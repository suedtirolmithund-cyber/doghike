import { useState } from "react";
import { format } from "date-fns";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Check, FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getDifficultyLabel, getWaterLabel } from "@/lib/difficultyConfig";
import { formatDurationHours } from "@/lib/duration";

function getCountryLabel(country) {
  if (country === "italy") return "Italien";
  if (country === "austria") return "Österreich";
  if (country === "germany") return "Deutschland";
  if (country === "switzerland") return "Schweiz";
  if (country === "other") return "Anderes";
  return country || null;
}

const seasonLabels = {
  spring: "Frühling",
  summer: "Sommer",
  autumn: "Herbst",
  winter: "Winter",
  all_year: "Ganzjährig",
};

const PDF_COLORS = {
  brand: [180, 124, 78],
  text: [31, 41, 55],
  muted: [107, 114, 128],
  line: [229, 231, 235],
  soft: [248, 245, 241],
};

function fileToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function imageUrlToDataUrl(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("image_fetch_failed");
  const blob = await response.blob();
  return fileToDataUrl(blob);
}

function transliterateFilename(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

export default function OfflineDownload({
  hike,
  dogs = [],
  allowDownload = true,
  includePhotos = false,
}) {
  const [downloading, setDownloading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!allowDownload) {
    return null;
  }

  const saveToLocalStorage = () => {
    try {
      const offlineData = {
        hike,
        dogs,
        savedAt: new Date().toISOString(),
      };
      const existing = JSON.parse(localStorage.getItem("offlineHikes") || "[]");
      const filtered = existing.filter((item) => item.hike.id !== hike.id);
      filtered.push(offlineData);
      localStorage.setItem("offlineHikes", JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error("Fehler beim Speichern:", error);
      return false;
    }
  };

  const downloadAsPDF = async () => {
    if (!allowDownload) return;

    setDownloading(true);

    try {
      saveToLocalStorage();

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;
      const footerHeight = 12;
      const maxY = pageHeight - margin - footerHeight;
      let yPosition = margin;

      const ensureSpace = (heightNeeded = 12) => {
        if (yPosition + heightNeeded <= maxY) return;
        pdf.addPage();
        yPosition = margin;
      };

      const addSectionTitle = (title) => {
        ensureSpace(14);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.setTextColor(...PDF_COLORS.text);
        pdf.text(title, margin, yPosition);
        yPosition += 3;
        pdf.setDrawColor(...PDF_COLORS.line);
        pdf.line(margin, yPosition, margin + contentWidth, yPosition);
        yPosition += 6;
      };

      const addParagraph = (text) => {
        if (!text) return;
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.setTextColor(...PDF_COLORS.text);
        const lines = pdf.splitTextToSize(text, contentWidth);
        ensureSpace(lines.length * 5 + 4);
        pdf.text(lines, margin, yPosition);
        yPosition += lines.length * 5 + 4;
      };

      const addKeyValueGrid = (items) => {
        const visibleItems = items.filter((item) => item.value);
        if (!visibleItems.length) return;

        const columns = 2;
        const gap = 4;
        const boxWidth = (contentWidth - gap) / columns;
        const boxHeight = 18;

        for (let index = 0; index < visibleItems.length; index += columns) {
          ensureSpace(boxHeight + 2);
          const row = visibleItems.slice(index, index + columns);

          row.forEach((item, columnIndex) => {
            const x = margin + columnIndex * (boxWidth + gap);
            pdf.setFillColor(...PDF_COLORS.soft);
            pdf.setDrawColor(...PDF_COLORS.line);
            pdf.roundedRect(x, yPosition, boxWidth, boxHeight, 3, 3, "FD");

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(8);
            pdf.setTextColor(...PDF_COLORS.muted);
            pdf.text(item.label, x + 4, yPosition + 6);

            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(11);
            pdf.setTextColor(...PDF_COLORS.text);
            const valueLines = pdf.splitTextToSize(String(item.value), boxWidth - 8);
            pdf.text(valueLines.slice(0, 2), x + 4, yPosition + 12);
          });

          yPosition += boxHeight + 4;
        }
      };

      const addFooterToAllPages = () => {
        const totalPages = pdf.getNumberOfPages();

        for (let page = 1; page <= totalPages; page += 1) {
          pdf.setPage(page);
          pdf.setDrawColor(...PDF_COLORS.line);
          pdf.line(margin, pageHeight - footerHeight, margin + contentWidth, pageHeight - footerHeight);
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8);
          pdf.setTextColor(...PDF_COLORS.muted);
          pdf.text(`Erstellt am ${format(new Date(), "dd.MM.yyyy HH:mm")} · DogTrails`, margin, pageHeight - 7);
          pdf.text(`Seite ${page}/${totalPages}`, pageWidth - margin, pageHeight - 7, { align: "right" });
        }
      };

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(22);
      pdf.setTextColor(...PDF_COLORS.text);
      const titleLines = pdf.splitTextToSize(hike.trail_name || "Tour", contentWidth);
      pdf.text(titleLines, margin, yPosition);
      yPosition += titleLines.length * 8;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(...PDF_COLORS.muted);
      const introLine = [hike.location, getCountryLabel(hike.country)].filter(Boolean).join(" · ");
      if (introLine) {
        pdf.text(introLine, margin, yPosition);
        yPosition += 8;
      }

      pdf.setDrawColor(...PDF_COLORS.brand);
      pdf.setLineWidth(0.8);
      pdf.line(margin, yPosition, margin + contentWidth, yPosition);
      yPosition += 8;

      addKeyValueGrid([
        { label: "Strecke", value: hike.distance_km ? `${hike.distance_km} km` : null },
        { label: "Höhenmeter", value: hike.elevation_gain_m ? `${hike.elevation_gain_m} m` : null },
        { label: "Gehzeit", value: hike.duration_minutes ? formatDurationHours(hike.duration_minutes) : null },
        { label: "Mensch", value: hike.difficulty ? getDifficultyLabel(hike.difficulty) : null },
        { label: "Hund", value: hike.dog_difficulty ? getDifficultyLabel(hike.dog_difficulty) : null },
        { label: "Wasser", value: hike.water_availability ? getWaterLabel(hike.water_availability) : null },
        { label: "Jahreszeit", value: hike.season ? seasonLabels[hike.season] || hike.season : null },
        { label: "Datum", value: hike.date ? format(new Date(hike.date), "dd.MM.yyyy") : null },
      ]);

      const mapElement = document.querySelector(".leaflet-container");
      if (mapElement) {
        try {
          const canvas = await html2canvas(mapElement, {
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#f5f5f5",
            scale: 1.4,
          });

          const imgData = canvas.toDataURL("image/jpeg", 0.88);
          const imgHeight = Math.min((canvas.height * contentWidth) / canvas.width, 96);

          addSectionTitle("Karte");
          ensureSpace(imgHeight + 10);
          pdf.addImage(imgData, "JPEG", margin, yPosition, contentWidth, imgHeight);
          yPosition += imgHeight + 5;
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8);
          pdf.setTextColor(...PDF_COLORS.muted);
          pdf.text("Kartengrundlage: OpenStreetMap / CARTO", margin, yPosition);
          yPosition += 6;
        } catch (error) {
          console.error("Fehler beim Erfassen der Karte:", error);
        }
      }

      addSectionTitle("Tourdetails");
      addKeyValueGrid([
        { label: "Startpunkt / Parkplatz", value: hike.parking_info || null },
        { label: "Einkehr", value: hike.restaurant_info || null },
      ]);

      if (hike.hazard_notes) {
        addSectionTitle("Achtung - Gefahrenstellen");
        addParagraph(hike.hazard_notes);
      }

      if (hike.notes) {
        addSectionTitle("Beschreibung & Tipps");
        addParagraph(hike.notes);
      }

      if (dogs.length > 0) {
        addSectionTitle("Mit dabei");
        addParagraph(dogs.map((dog) => `• ${dog.name}${dog.breed ? ` (${dog.breed})` : ""}`).join("\n"));
      }

      if (includePhotos && Array.isArray(hike.photos) && hike.photos.length > 0) {
        const photoData = [];
        for (const photo of hike.photos.slice(0, 4)) {
          try {
            const imgData = await imageUrlToDataUrl(photo);
            photoData.push(imgData);
          } catch (error) {
            console.error("Fehler beim Einfügen eines Fotos:", error);
          }
        }

        if (photoData.length > 0) {
          pdf.addPage();
          yPosition = margin;
          addSectionTitle("Fotos");

          const gap = 6;
          const photoWidth = (contentWidth - gap) / 2;
          const photoHeight = 56;

          for (let index = 0; index < photoData.length; index += 2) {
            ensureSpace(photoHeight + 4);
            const row = photoData.slice(index, index + 2);

            row.forEach((imgData, columnIndex) => {
              const x = margin + columnIndex * (photoWidth + gap);
              pdf.addImage(imgData, "JPEG", x, yPosition, photoWidth, photoHeight);
            });

            yPosition += photoHeight + 6;
          }
        }
      }

      addFooterToAllPages();

      const baseName = transliterateFilename(hike.trail_name || "tour");
      const filename = `${baseName || "tour"}.pdf`;
      pdf.save(filename);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Fehler beim Erstellen der PDF:", error);
      toast.error("Das PDF konnte gerade nicht erstellt werden. Versuch es gleich noch einmal.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={downloadAsPDF}
        disabled={downloading}
        className="bg-slate-700 text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {downloading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Erstellt PDF...
          </>
        ) : success ? (
          <>
            <Check className="mr-2 h-4 w-4" />
            PDF fertig
          </>
        ) : (
          <>
            <FileDown className="mr-2 h-4 w-4" />
            Tour als PDF
          </>
        )}
      </Button>
    </div>
  );
}
