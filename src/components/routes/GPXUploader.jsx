import { useState, useRef } from "react";
import { MapContainer, TileLayer, Polyline, Marker } from "react-leaflet";
import { Button } from "@/components/ui/button";
import {
  Upload,
  FileText,
  Trash2,
  AlertCircle,
  Zap,
} from "lucide-react";
import RouteElevationProfile from "./RouteElevationProfile";
import { TOUR_ICONS } from "@/lib/difficultyConfig";
import { formatDurationHours } from "@/lib/duration";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function mapGpxError(message) {
  const msg = String(message || "").toLowerCase();

  if (msg.includes("keine wegpunkte")) {
    return "In der GPX-Datei steckt noch kein brauchbarer Weg.";
  }
  if (msg.includes("parsererror") || msg.includes("xml")) {
    return "Die GPX-Datei lässt sich nicht lesen. Prüfe kurz das Format.";
  }

  return "Die GPX-Datei wollte gerade nicht mit. Prüfe sie kurz und versuch es noch einmal.";
}

function parseGPX(text) {
  const parser = new DOMParser();
  const xml = parser.parseFromString(text, "application/xml");

  if (xml.querySelector("parsererror")) {
    throw new Error("parsererror");
  }

  const trkpts = xml.querySelectorAll("trkpt");
  const wpts = trkpts.length > 0 ? trkpts : xml.querySelectorAll("rtept");

  if (wpts.length === 0) {
    throw new Error("Keine Wegpunkte im GPX gefunden.");
  }

  const points = [];
  let elevGain = 0;
  let elevLoss = 0;
  let prevElev = null;

  wpts.forEach((pt) => {
    const lat = parseFloat(pt.getAttribute("lat"));
    const lon = parseFloat(pt.getAttribute("lon"));
    const eleEl = pt.querySelector("ele");
    const ele = eleEl ? parseFloat(eleEl.textContent) : null;

    if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
      points.push({ lat, lon, ele });

      if (ele !== null && prevElev !== null) {
        const diff = ele - prevElev;
        if (diff > 0) elevGain += diff;
        else elevLoss += Math.abs(diff);
      }
      if (ele !== null) prevElev = ele;
    }
  });

  let distKm = 0;
  for (let i = 1; i < points.length; i += 1) {
    distKm += haversine(points[i - 1].lat, points[i - 1].lon, points[i].lat, points[i].lon);
  }

  const baseTime = distKm / 4;
  const climbTime = elevGain / 600;
  const durationMin = Math.round((baseTime + climbTime) * 60);

  return {
    coordinates: points.map((p) => [p.lat, p.lon]),
    elevations: points.map((p) => p.ele),
    distance_km: parseFloat(distKm.toFixed(2)),
    elevation_gain_m: Math.round(elevGain),
    elevation_loss_m: Math.round(elevLoss),
    duration_minutes: durationMin,
    max_elevation: points.reduce(
      (max, p) => (p.ele !== null && p.ele > max ? p.ele : max),
      -Infinity,
    ),
    min_elevation: points.reduce(
      (min, p) => (p.ele !== null && p.ele < min ? p.ele : min),
      Infinity,
    ),
  };
}

export default function GPXUploader({ onSave }) {
  const [gpxData, setGpxData] = useState(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef();

  const processFile = (file) => {
    setError("");
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".gpx")) {
      setError("Hier passt nur eine GPX-Datei.");
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = parseGPX(e.target.result);
        setGpxData({ ...parsed, rawFile: file });
      } catch (err) {
        setError(mapGpxError(err.message));
        setGpxData(null);
      }
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e) => processFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    processFile(e.dataTransfer.files[0]);
  };

  const handleSave = () => {
    if (!gpxData) return;
    onSave(gpxData);
  };

  const handleClear = () => {
    setGpxData(null);
    setFileName("");
    setError("");
    fileInputRef.current.value = "";
  };

  const mapCenter = gpxData
    ? [
        gpxData.coordinates[Math.floor(gpxData.coordinates.length / 2)][0],
        gpxData.coordinates[Math.floor(gpxData.coordinates.length / 2)][1],
      ]
    : [46.5, 11.9];

  return (
    <div className="space-y-4">
      {!gpxData && (
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
            isDragging
              ? "border-brand-400 bg-brand-50"
              : "border-brand-100 hover:border-brand-300 hover:bg-brand-50/40"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".gpx"
            className="hidden"
            onChange={handleFileChange}
          />
          <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-base font-medium text-slate-700 mb-1">GPX-Weg reinziehen</p>
          <p className="text-sm text-slate-500">Zieh die Datei hierher oder wähle sie aus.</p>
          <p className="text-xs text-slate-400 mt-2">Unterstützt: .gpx (Garmin, Komoot, Strava und ähnliche)</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-brand-50 border border-brand-100 rounded-lg p-3 text-brand-500 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {gpxData && (
        <>
          <div className="flex items-center justify-between bg-brand-50 border border-brand-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-400" />
              <div>
                <p className="text-sm font-medium text-[#7C3020]">{fileName}</p>
                <p className="text-xs text-brand-400">{gpxData.coordinates.length} Wegpunkte geladen</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClear} className="text-slate-500 hover:text-brand-400">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl bg-gradient-to-br from-[#A8003C] to-[#F9C030] p-4 text-center text-white">
              <span className="block text-xl mb-1 opacity-80">{TOUR_ICONS.distance}</span>
              <p className="text-2xl font-bold">{gpxData.distance_km}</p>
              <p className="text-xs opacity-70">km Distanz</p>
            </div>
            <div className="bg-brand-600 text-white rounded-xl p-4 text-center">
              <span className="block text-xl mb-1 opacity-80">{TOUR_ICONS.elevation}</span>
              <p className="text-2xl font-bold">+{gpxData.elevation_gain_m}</p>
              <p className="text-xs opacity-70">m Aufstieg</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-[#7C3020] to-[#A8003C] p-4 text-center text-white">
              <span className="block text-xl mb-1 opacity-80">{TOUR_ICONS.duration}</span>
              <p className="text-2xl font-bold">{formatDurationHours(gpxData.duration_minutes)}</p>
              <p className="text-xs opacity-70">gesch. Dauer</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-[#F9C030] to-[#A8003C] p-4 text-center text-white">
              <span className="block text-xl mb-1 opacity-80">{TOUR_ICONS.elevation}</span>
              <p className="text-2xl font-bold">
                {gpxData.max_elevation !== -Infinity ? Math.round(gpxData.max_elevation) : "–"}
              </p>
              <p className="text-xs opacity-70">m max. Höhe</p>
            </div>
          </div>

          <div className="bg-brand-50/70 rounded-lg p-3 text-xs text-slate-600 flex flex-wrap gap-4">
            <span>⬇️ Abstieg: <strong>{gpxData.elevation_loss_m} m</strong></span>
            {gpxData.min_elevation !== Infinity && (
              <span>🏔️ Min. Höhe: <strong>{Math.round(gpxData.min_elevation)} m</strong></span>
            )}
            <span className="text-slate-400 ml-auto flex items-center gap-1">
              <Zap className="w-3 h-3" /> Dauer nach Naismith-Formel geschätzt
            </span>
          </div>

          <div className="relative h-72 md:h-96 rounded-xl overflow-hidden border-2 border-brand-100">
            <MapContainer center={mapCenter} zoom={12} style={{ height: "100%", width: "100%" }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap"
              />
              <Polyline positions={gpxData.coordinates} color="#A8003C" weight={4} opacity={0.85} />
              {gpxData.coordinates.length > 0 && (
                <>
                  <Marker position={gpxData.coordinates[0]} />
                  <Marker position={gpxData.coordinates[gpxData.coordinates.length - 1]} />
                </>
              )}
            </MapContainer>
          </div>

          <RouteElevationProfile
            coordinates={gpxData.coordinates}
            distance={gpxData.distance_km}
          />

      <Button onClick={handleSave} className="w-full bg-brand-400 hover:bg-brand-600">
            <Upload className="w-4 h-4 mr-2" />
            GPX-Route übernehmen und speichern
          </Button>
        </>
      )}
    </div>
  );
}
