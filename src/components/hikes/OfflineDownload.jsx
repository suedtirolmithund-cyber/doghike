import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Check, FileDown } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { format } from "date-fns";

const difficultyLabels = {
  "1": "Stufe 1 (Sehr leicht)",
  "2": "Stufe 2 (Leicht)",
  "3": "Stufe 3 (Mittel)",
  "4": "Stufe 4 (Schwer)",
  "5": "Stufe 5 (Sehr schwer)"
};

const seasonLabels = {
  spring: "Frühling",
  summer: "Sommer",
  autumn: "Herbst",
  winter: "Winter",
  all_year: "Ganzjährig"
};

const waterLabels = {
  none: "Kein Wasser",
  little: "Wenig Wasser",
  moderate: "Etwas Wasser",
  plenty: "Viel Wasser"
};

async function loadImageAsDataUrl(src) {
  if (!src) return null;

  const response = await fetch(src);
  if (!response.ok) {
    throw new Error("Bild konnte nicht geladen werden");
  }

  const blob = await response.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function OfflineDownload({ hike, dogs = [] }) {
  const [downloading, setDownloading] = useState(false);
  const [success, setSuccess] = useState(false);

  const saveToLocalStorage = () => {
    try {
      const offlineData = {
        hike,
        dogs,
        savedAt: new Date().toISOString()
      };
      const existing = JSON.parse(localStorage.getItem("offlineHikes") || "[]");
      const filtered = existing.filter(item => item.hike.id !== hike.id);
      filtered.push(offlineData);
      localStorage.setItem("offlineHikes", JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error("Fehler beim Speichern:", error);
      return false;
    }
  };

  const downloadAsPDF = async () => {
    setDownloading(true);
    
    try {
      // Save to localStorage first
      saveToLocalStorage();

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPosition = margin;
      const coverPhoto = hike.photos?.[0] || null;

      if (coverPhoto) {
        try {
          const imgData = await loadImageAsDataUrl(coverPhoto);
          const imgWidth = pageWidth - 2 * margin;
          const imgHeight = 70;
          pdf.addImage(imgData, "JPEG", margin, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 10;
        } catch (error) {
          console.error("Fehler beim Laden des Titelbilds:", error);
        }
      }

      // Title
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text(hike.trail_name, margin, yPosition);
      yPosition += 10;

      // Location and Date
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      if (hike.location) {
        pdf.text(`Ort: ${hike.location}`, margin, yPosition);
        yPosition += 6;
      }
      if (hike.date) {
        pdf.text(`Datum: ${format(new Date(hike.date), "dd.MM.yyyy")}`, margin, yPosition);
        yPosition += 8;
      }

      // Stats Box
      pdf.setFillColor(245, 245, 245);
      pdf.rect(margin, yPosition, pageWidth - 2 * margin, 30, "F");
      yPosition += 7;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      
      if (hike.distance_km) {
        pdf.text(`Strecke: ${hike.distance_km} km`, margin + 5, yPosition);
      }
      if (hike.elevation_gain_m) {
        pdf.text(`Höhenmeter: ${hike.elevation_gain_m} m`, pageWidth / 2, yPosition);
      }
      yPosition += 6;
      
      if (hike.duration_minutes) {
        pdf.text(`Gehzeit: ${(hike.duration_minutes / 60).toFixed(1)} Std`, margin + 5, yPosition);
      }
      if (hike.difficulty) {
        pdf.text(`Schwierigkeit Mensch: ${difficultyLabels[hike.difficulty]}`, margin + 5, yPosition + 6);
      }
      yPosition += 12;
      
      if (hike.dog_difficulty) {
        pdf.text(`Schwierigkeit Hund: ${difficultyLabels[hike.dog_difficulty]}`, margin + 5, yPosition);
      }
      yPosition += 10;

      // Season and Water
      pdf.setFont("helvetica", "normal");
      if (hike.season) {
        pdf.text(`Beste Jahreszeit: ${seasonLabels[hike.season] || hike.season}`, margin, yPosition);
        yPosition += 6;
      }
      if (hike.water_availability) {
        pdf.text(`Wasser unterwegs: ${waterLabels[hike.water_availability]}`, margin, yPosition);
        yPosition += 8;
      }

      if (yPosition > pageHeight - 80) {
        pdf.addPage();
        yPosition = margin;
      }

      // Parking Info
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

      // Restaurant Info
      if (hike.restaurant_info) {
        if (yPosition > pageHeight - 35) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.text("Einkehrmöglichkeiten:", margin, yPosition);
        yPosition += 7;
        
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        const restaurantLines = pdf.splitTextToSize(hike.restaurant_info, pageWidth - 2 * margin);
        pdf.text(restaurantLines, margin, yPosition);
        yPosition += restaurantLines.length * 5 + 8;
      }

      // Hazard Notes
      if (hike.hazard_notes) {
        if (yPosition > pageHeight - 35) {
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

      // Notes
      if (hike.notes) {
        if (yPosition > pageHeight - 35) {
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

      // Dogs
      if (dogs.length > 0) {
        if (yPosition > pageHeight - 25) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.text("Mit dabei:", margin, yPosition);
        yPosition += 7;
        
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        dogs.forEach(dog => {
          pdf.text(`- ${dog.name}${dog.breed ? ` (${dog.breed})` : ""}`, margin + 5, yPosition);
          yPosition += 5;
        });
      }

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text(
        `Erstellt am ${format(new Date(), "dd.MM.yyyy HH:mm")} - Südtirol mit Hund`,
        margin,
        pageHeight - 10
      );

      // Save PDF
      const filename = `${hike.trail_name.replace(/[^a-z0-9]/gi, '_')}_offline.pdf`;
      pdf.save(filename);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Fehler beim Erstellen der PDF:", error);
      toast.error("Fehler beim Erstellen der Offline-Datei. Bitte versuche es noch einmal.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={downloadAsPDF}
        disabled={downloading}
        className="bg-slate-700 hover:bg-slate-800 text-white"
      >
        {downloading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Erstellt PDF...
          </>
        ) : success ? (
          <>
            <Check className="w-4 h-4 mr-2" />
            Gespeichert!
          </>
        ) : (
          <>
            <FileDown className="w-4 h-4 mr-2" />
            Offline-PDF
          </>
        )}
      </Button>
    </div>
  );
}
