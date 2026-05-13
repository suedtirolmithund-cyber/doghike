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
  if (country === "austria") return "Oesterreich";
  if (country === "germany") return "Deutschland";
  if (country === "switzerland") return "Schweiz";
  if (country === "other") return "Anderes";
  return country || null;
}

const seasonLabels = {
  spring: "Fruehling",
  summer: "Sommer",
  autumn: "Herbst",
  winter: "Winter",
  all_year: "Ganzjaehrig",
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
      let yPosition = margin;

      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text(hike.trail_name, margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      if (hike.location) {
        pdf.text(`Ort: ${hike.location}`, margin, yPosition);
        yPosition += 6;
      }

      const countryLabel = getCountryLabel(hike.country);
      if (countryLabel) {
        pdf.text(`Land: ${countryLabel}`, margin, yPosition);
        yPosition += 6;
      }

      if (hike.date) {
        pdf.text(`Datum: ${format(new Date(hike.date), "dd.MM.yyyy")}`, margin, yPosition);
        yPosition += 8;
      }

      pdf.setFillColor(245, 245, 245);
      pdf.rect(margin, yPosition, pageWidth - 2 * margin, 30, "F");
      yPosition += 7;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      if (hike.distance_km) {
        pdf.text(`Strecke: ${hike.distance_km} km`, margin + 5, yPosition);
      }
      if (hike.elevation_gain_m) {
        pdf.text(`Hoehenmeter: ${hike.elevation_gain_m} m`, pageWidth / 2, yPosition);
      }
      yPosition += 6;

      if (hike.duration_minutes) {
        pdf.text(`Gehzeit: ${formatDurationHours(hike.duration_minutes)}`, margin + 5, yPosition);
      }
      if (hike.difficulty) {
        pdf.text(`Schwierigkeit Mensch: ${getDifficultyLabel(hike.difficulty)}`, margin + 5, yPosition + 6);
      }
      yPosition += 12;

      if (hike.dog_difficulty) {
        pdf.text(`Schwierigkeit Hund: ${getDifficultyLabel(hike.dog_difficulty)}`, margin + 5, yPosition);
        yPosition += 6;
      }

      pdf.setFont("helvetica", "normal");
      if (hike.season) {
        pdf.text(`Beste Jahreszeit: ${seasonLabels[hike.season] || hike.season}`, margin, yPosition);
        yPosition += 6;
      }
      if (hike.water_availability) {
        pdf.text(`Wasser unterwegs: ${getWaterLabel(hike.water_availability)}`, margin, yPosition);
        yPosition += 8;
      }

      const mapElement = document.querySelector(".leaflet-container");
      if (mapElement) {
        try {
          const canvas = await html2canvas(mapElement, {
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#f5f5f5",
          });

          const imgData = canvas.toDataURL("image/jpeg", 0.82);
          const imgWidth = pageWidth - 2 * margin;
          const imgHeight = Math.min((canvas.height * imgWidth) / canvas.width, 100);

          if (yPosition + imgHeight > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }

          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(12);
          pdf.text("Karte:", margin, yPosition);
          yPosition += 7;

          pdf.addImage(imgData, "JPEG", margin, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 10;
        } catch (error) {
          console.error("Fehler beim Erfassen der Karte:", error);
        }
      }

      pdf.addPage();
      yPosition = margin;

      if (hike.parking_info) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.text("Ausgangspunkt & Parken:", margin, yPosition);
        yPosition += 7;

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        const parkingLines = pdf.splitTextToSize(hike.parking_info, pageWidth - 2 * margin);
        pdf.text(parkingLines, margin, yPosition);
        yPosition += parkingLines.length * 5 + 8;
      }

      if (hike.restaurant_info) {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.text("Einkehrmoeglichkeiten:", margin, yPosition);
        yPosition += 7;

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        const restaurantLines = pdf.splitTextToSize(hike.restaurant_info, pageWidth - 2 * margin);
        pdf.text(restaurantLines, margin, yPosition);
        yPosition += restaurantLines.length * 5 + 8;
      }

      if (hike.hazard_notes) {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.text("Achtung - Gefahrenstellen:", margin, yPosition);
        yPosition += 7;

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        const hazardLines = pdf.splitTextToSize(hike.hazard_notes, pageWidth - 2 * margin);
        pdf.text(hazardLines, margin, yPosition);
        yPosition += hazardLines.length * 5 + 8;
      }

      if (hike.notes) {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.text("Beschreibung & Tipps:", margin, yPosition);
        yPosition += 7;

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        const notesLines = pdf.splitTextToSize(hike.notes, pageWidth - 2 * margin);
        pdf.text(notesLines, margin, yPosition);
        yPosition += notesLines.length * 5 + 8;
      }

      if (dogs.length > 0) {
        if (yPosition > 260) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.text("Mit dabei:", margin, yPosition);
        yPosition += 7;

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        dogs.forEach((dog) => {
          pdf.text(`- ${dog.name}${dog.breed ? ` (${dog.breed})` : ""}`, margin + 5, yPosition);
          yPosition += 5;
        });
      }

      if (includePhotos && Array.isArray(hike.photos) && hike.photos.length > 0) {
        pdf.addPage();
        yPosition = margin;
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.text("Fotos:", margin, yPosition);
        yPosition += 8;

        for (const photo of hike.photos.slice(0, 4)) {
          try {
            const imgData = await imageUrlToDataUrl(photo);
            const imgWidth = pageWidth - 2 * margin;
            const imgHeight = 60;

            if (yPosition + imgHeight > pageHeight - margin) {
              pdf.addPage();
              yPosition = margin;
            }

            pdf.addImage(imgData, "JPEG", margin, yPosition, imgWidth, imgHeight);
            yPosition += imgHeight + 6;
          } catch (error) {
            console.error("Fehler beim Einfuegen eines Fotos:", error);
          }
        }
      }

      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text(
        `Erstellt am ${format(new Date(), "dd.MM.yyyy HH:mm")} - DogTrails`,
        margin,
        pageHeight - 10
      );

      const filename = `${hike.trail_name.replace(/[^a-z0-9]/gi, "_")}.pdf`;
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
