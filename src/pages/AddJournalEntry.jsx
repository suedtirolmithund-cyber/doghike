import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import {
  ArrowLeft, Upload, X, Loader2, Star, FileText,
  Mountain, TrendingUp, MapPin, AlertTriangle, Dog, Search, Layers, CircleHelp
} from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import WaterIcon from "@/components/icons/WaterIcon";
import { toast } from "sonner";
import { showSavedFeedback, showUploadedFeedback } from "@/lib/feedbackToast";
import { useAuth } from "@/lib/AuthContext";
import {
  createJournalEntry,
  updateJournalEntry,
  getJournalEntry,
  getSignedJournalUrls,
  uploadJournalFile,
  deleteJournalFiles,
  getMissingSharedJournalFields,
} from "@/lib/journalApi";
import { getDogs } from "@/lib/profilesApi";
import { getImageUploadErrorMessage, validateImageUpload } from "@/lib/uploadValidation";
import { Link } from "react-router-dom";
import PawLoadingTrail from "@/components/PawLoadingTrail";
import { getAvatarDataUrl } from "@/lib/fallbackImages";
import {
  DIFFICULTY_APP_EXPLANATIONS,
  DIFFICULTY_GUIDE_NOTE,
  DIFFICULTY_LEVELS,
  DOG_PRIVATE_TAGS,
  DOG_DIFFICULTY_GUIDE,
  HUMAN_DIFFICULTY_GUIDE,
  SEASON_LEVELS,
  TOUR_ICONS,
  WATER_APP_EXPLANATION,
  WATER_GUIDE,
  WATER_GUIDE_NOTE,
  WATER_LEVELS,
  getDifficultyLabel,
  getDifficultyTextColor,
  getWaterLabel,
} from "@/lib/difficultyConfig";
import { hoursInputToMinutes, minutesToHoursInput } from "@/lib/duration";

// Sterne-Picker (Gesamtbewertung)
function StarPicker({ label, value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div>
      <Label className="text-sm text-slate-600 mb-1 block">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button key={s} type="button"
            onClick={() => onChange(s === value ? 0 : s)}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
            className="focus:outline-none"
          >
            <Star className={`w-7 h-7 transition-colors ${
              s <= (hover || value) ? "fill-brand-100 text-brand-100" : "text-slate-300"
            }`} />
          </button>
        ))}
        {value > 0 && (
          <button type="button" onClick={() => onChange(0)} className="ml-1 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function DifficultyInfoDialog({ icon, title, description, levels }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-brand-200 bg-white/80 text-brand-500 shadow-sm transition hover:border-brand-300 hover:text-brand-600"
          aria-label={`${title} erklären`}
        >
          <CircleHelp className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="grid-rows-[auto,minmax(0,1fr)] max-h-[85vh] overflow-hidden border-white/80 bg-white/95 p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-brand-100/80 px-6 pb-3 pt-6">
          <DialogTitle className="flex items-center gap-2 text-left text-slate-800">
            {icon}
            {title}
          </DialogTitle>
          <DialogDescription className="text-left text-slate-500">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 space-y-3 overflow-y-auto px-6 pb-6 pr-5">
          <div className="doghike-info-box">
            <div className="space-y-2">
              {DIFFICULTY_APP_EXPLANATIONS.map((item) => (
                <div key={item.key}>
                  <div className="doghike-info-subtitle">{item.title}</div>
                  <p className="doghike-info-text">{item.description}</p>
                </div>
              ))}
            </div>
            <p className="doghike-info-note">
              {DIFFICULTY_GUIDE_NOTE}
            </p>
          </div>
          {levels.map((level) => (
            <div key={level.stufe} className={`rounded-2xl border p-4 shadow-sm ${level.color}`}>
              <div className="mb-2 flex items-center gap-3">
                <span className={`rounded-full px-2 py-1 text-xs font-bold text-white ${level.badge}`}>
                  {level.level}
                </span>
                <div>
                  <div className="font-semibold">{level.title}</div>
                  <div className="text-xs opacity-75">{level.stufe}</div>
                </div>
              </div>
              <p className="mb-2 text-sm">{level.desc}</p>
              <div className="grid gap-1.5 text-xs opacity-85">
                <div><span className="font-medium">Beispiele:</span> {level.examples}</div>
                <div><span className="font-medium">Gelände:</span> {level.terrain}</div>
                <div><span className="font-medium">{level.fitness ? "Einordnung" : "Hinweis"}:</span> {level.fitness ?? level.note}</div>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WaterInfoDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-brand-200 bg-white/80 text-brand-500 shadow-sm transition hover:border-brand-300 hover:text-brand-600"
          aria-label="Wasser erklären"
        >
          <CircleHelp className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="grid-rows-[auto,minmax(0,1fr)] max-h-[85vh] overflow-hidden border-white/80 bg-white/95 p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-brand-100/80 px-6 pb-3 pt-6">
          <DialogTitle className="flex items-center gap-2 text-left text-slate-800">
            <WaterIcon value="little" className="text-base text-brand-500" />
            Wasser unterwegs
          </DialogTitle>
          <DialogDescription className="text-left text-slate-500">
            So ist die Wasserverfügbarkeit entlang der Route eingeordnet.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 space-y-3 overflow-y-auto px-6 pb-6 pr-5">
          <div className="doghike-info-box">
            <p className="doghike-info-text">{WATER_APP_EXPLANATION}</p>
            <p className="doghike-info-note">
              {WATER_GUIDE_NOTE}
            </p>
          </div>
          {WATER_GUIDE.map((level) => (
            <div key={level.value} className={`rounded-2xl border p-4 shadow-sm ${level.color}`}>
              <div className="mb-2 flex items-center gap-3">
                <WaterIcon value={level.value} className="text-xl" />
                <div className="font-semibold">{level.label}</div>
              </div>
              <p className="mb-2 text-sm">{level.desc}</p>
              <div className="grid gap-1.5 text-xs opacity-85">
                <div><span className="font-medium">Beispiele:</span> {level.examples}</div>
                <div><span className="font-medium">Tipp:</span> {level.tip}</div>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GrazingAnimalsInfoDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-brand-200 bg-white/80 text-brand-500 shadow-sm transition hover:border-brand-300 hover:text-brand-600"
          aria-label="Weidetiere erklären"
        >
          <Layers className="h-3.5 w-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="grid-rows-[auto,minmax(0,1fr)] max-h-[85vh] overflow-hidden border-white/80 bg-white/95 p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-brand-100/80 px-6 pb-3 pt-6">
          <DialogTitle className="flex items-center gap-2 text-left text-slate-800">
            <span className="text-sm leading-none">{TOUR_ICONS.grazing}</span>
            Weidetiere unterwegs
          </DialogTitle>
          <DialogDescription className="text-left text-slate-500">
            Dieser Hinweis ist hilfreich, aber nie ganz verlässlich.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 space-y-3 overflow-y-auto px-6 pb-6 pr-5">
          <div className="doghike-info-box space-y-3">
            <p className="doghike-info-text">
              Weidetiere können sich je nach Saison, Ort und Jahr verändern. Eine Wanderung kann zum Beispiel im Herbst oder Frühling gemacht worden sein, als noch keine Tiere auf der Weide waren.
            </p>
            <p className="doghike-info-text">
              Außerdem können Tiere später an anderen Stellen stehen oder auf derselben Route in einem anderen Jahr ganz anders verteilt sein.
            </p>
            <p className="doghike-info-note">
              Nutze den Hinweis also nur als Orientierung und rechne trotzdem immer damit, dass unterwegs Weidetiere auftauchen können.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MuzzleInfoDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-brand-200 bg-white/80 text-brand-500 shadow-sm transition hover:border-brand-300 hover:text-brand-600"
          aria-label="Maulkorb erklären"
        >
          <Layers className="h-3.5 w-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="grid-rows-[auto,minmax(0,1fr)] max-h-[85vh] overflow-hidden border-white/80 bg-white/95 p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-brand-100/80 px-6 pb-3 pt-6">
          <DialogTitle className="flex items-center gap-2 text-left text-slate-800">
            <span className="text-sm leading-none">{TOUR_ICONS.muzzle}</span>
            Maulkorb unterwegs
          </DialogTitle>
          <DialogDescription className="text-left text-slate-500">
            Informiere dich am besten immer vorher je nach Land und Situation.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 space-y-3 overflow-y-auto px-6 pb-6 pr-5">
          <div className="doghike-info-box space-y-3">
            <p className="doghike-info-text">
              Je nach Land, Region oder Betreiber können für Hunde Leinen- und Maulkorbpflichten gelten. Informiere dich deshalb am besten immer vorab.
            </p>
            <p className="doghike-info-text">
              In Italien kann ein Maulkorb zum Beispiel in öffentlichen Verkehrsmitteln, bei Menschenansammlungen oder auf Anweisung verlangt werden. Es ist deshalb sinnvoll, den Hund schon vor der Reise stressfrei an einen Maulkorb zu gewöhnen.
            </p>
            <p className="doghike-info-text">
              Auch bei Bergbahnen kann es je nach Gesellschaft Unterschiede geben. Dasselbe gilt oft für Regeln und Ticketpreise für Hunde.
            </p>
            <p className="doghike-info-note">
              In öffentlichen Verkehrsmitteln reicht eine Maulschlinge oft nicht aus. Prüfe deshalb immer die aktuellen Vorgaben vor Ort.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Berg-Picker (Schwierigkeit Mensch)
function MountainPicker({ label, value, onChange }) {
  const [hover, setHover] = useState(0);
  const active = hover || value;
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5">
        <Label className="mb-0 block text-sm text-slate-600">{label}</Label>
        <DifficultyInfoDialog
          icon={<span className="text-sm leading-none">{TOUR_ICONS.human}</span>}
          title="Schwierigkeit Mensch"
          description="So ist die Wegtechnik für Menschen von Stufe 1 bis Stufe 5 eingeordnet."
          levels={HUMAN_DIFFICULTY_GUIDE}
        />
      </div>
      <div className="flex items-center gap-1">
        {DIFFICULTY_LEVELS.map(({ value: levelValue }) => {
          const s = Number(levelValue);
          return (
          <button key={s} type="button"
            onClick={() => onChange(s === value ? 0 : s)}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
            className="focus:outline-none"
            title={getDifficultyLabel(s)}
          >
            <Mountain className={`w-7 h-7 transition-colors ${
              s <= active
                ? `${getDifficultyTextColor(active)} fill-current`
                : "text-slate-300"
            }`} />
          </button>
        )})}
        {value > 0 && (
          <>
            <button type="button" onClick={() => onChange(0)} className="ml-1 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
            <span className={`text-xs font-medium ml-1 ${getDifficultyTextColor(value)}`}>{getDifficultyLabel(value)}</span>
          </>
        )}
      </div>
    </div>
  );
}

// Knochen-Picker (Schwierigkeit Hund)
function BonePicker({ label, value, onChange }) {
  const [hover, setHover] = useState(0);
  const active = hover || value;
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5">
        <Label className="mb-0 block text-sm text-slate-600">{label}</Label>
        <DifficultyInfoDialog
          icon={<span className="text-sm leading-none">{TOUR_ICONS.dog}</span>}
          title="Schwierigkeit Hund"
          description="So ist die Belastung für Hunde von Stufe 1 bis Stufe 5 eingeordnet."
          levels={DOG_DIFFICULTY_GUIDE}
        />
      </div>
      <div className="flex items-center gap-1">
        {DIFFICULTY_LEVELS.map(({ value: levelValue }) => {
          const s = Number(levelValue);
          return (
          <button key={s} type="button"
            onClick={() => onChange(s === value ? 0 : s)}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
            className={`text-2xl leading-none transition-opacity focus:outline-none ${
              s <= active ? "opacity-100" : "opacity-25"
            }`}
            title={getDifficultyLabel(s)}
          >{TOUR_ICONS.dog}</button>
        )})}
        {value > 0 && (
          <>
            <button type="button" onClick={() => onChange(0)} className="ml-1 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
            <span className={`text-xs font-medium ml-1 ${getDifficultyTextColor(value)}`}>{getDifficultyLabel(value)}</span>
          </>
        )}
      </div>
    </div>
  );
}

// Karten-Marker Icon
const markerIcon = L.divIcon({
  html: `<div style="background:#16a34a;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.25);border:3px solid white;">P</div>`,
  className: "",
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -30],
});

const LOCATION_PICKER_TILES = {
  standard: {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    label: "Standard",
    maxZoom: 19,
    maxNativeZoom: 19,
  },
  topo: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
    label: "Topo",
    maxZoom: 17,
    maxNativeZoom: 17,
  },
};

// Fliegt zur neuen Position wenn sich center ändert
function MapFlyTo({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom, { duration: 1 });
  }, [center, zoom]);
  return null;
}

// Setzt Marker beim Klick auf die Karte
function MapClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng) });
  return null;
}

// Location Picker Komponente
function LocationPicker({ lat, lng, onChange }) {
  const [markerPos, setMarkerPos] = useState(
    lat && lng ? [Number(lat), Number(lng)] : null
  );
  const [flyTarget, setFlyTarget] = useState(null);
  const [mapType, setMapType] = useState("standard");
  const [searchText, setSearchText] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const topoTileFallbackRef = useRef(false);
  const tile = LOCATION_PICKER_TILES[mapType];

  useEffect(() => {
    if (lat && lng) {
      setMarkerPos([Number(lat), Number(lng)]);
      return;
    }
    setMarkerPos(null);
  }, [lat, lng]);

  useEffect(() => {
    topoTileFallbackRef.current = false;
  }, [mapType]);

  const handleMapClick = ({ lat: clickLat, lng: clickLng }) => {
    setMarkerPos([clickLat, clickLng]);
    setSearchResults([]);
    onChange(clickLat, clickLng);
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    const query = searchText.trim();
    if (!query) return;
    setSearching(true);
    setSearchError(null);
    setSearchResults([]);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&accept-language=de&addressdetails=1`;
      const resp = await fetch(url, { headers: { "Accept-Language": "de" } });
      const results = await resp.json();
      if (results.length > 0) {
        if (results.length === 1) {
          const { lat: rLat, lon: rLon } = results[0];
          const pos = [parseFloat(rLat), parseFloat(rLon)];
          setMarkerPos(pos);
          setFlyTarget({ center: pos, zoom: 13 });
          onChange(pos[0], pos[1]);
        } else {
          setSearchResults(results);
        }
      } else {
        setSearchError("Ort nicht gefunden. Bitte genauere Suche eingeben.");
      }
    } catch {
      setSearchError("Suche fehlgeschlagen. Bitte Karte manuell tippen.");
    } finally {
      setSearching(false);
    }
  };

  const handleSelectSearchResult = (result) => {
    const pos = [parseFloat(result.lat), parseFloat(result.lon)];
    setMarkerPos(pos);
    setFlyTarget({ center: pos, zoom: 13 });
    setSearchResults([]);
    setSearchError(null);
    setSearchText(result.display_name ?? searchText);
    onChange(pos[0], pos[1]);
  };

  const dismissSearchResults = () => {
    setSearchResults([]);
  };

  const handleTileError = (event) => {
    const failedZoom = event?.coords?.z ?? tile.maxNativeZoom;
    if (mapType !== "topo" || topoTileFallbackRef.current || failedZoom < tile.maxNativeZoom) return;
    topoTileFallbackRef.current = true;
    setMapType("standard");
    toast.info("Topo ist an dieser Zoomstufe nicht verfügbar. Die Karte wurde auf Standard zurückgesetzt.");
  };

  return (
    <div className="space-y-2">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Ort suchen, z.B. Pragser Wildsee..."
          className="flex-1 h-9 text-sm"
        />
        <Button type="submit" size="sm" variant="outline" disabled={searching} className="h-9 px-3">
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </form>

      {searchError && (
        <p className="text-xs text-brand-500">{searchError}</p>
      )}

      {searchResults.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-brand-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-brand-100 px-3 py-2">
            <p className="text-xs font-medium text-slate-500">
              Mehrere Orte gefunden. Bitte den richtigen auswählen.
            </p>
            <button
              type="button"
              onClick={dismissSearchResults}
              className="rounded-md p-1 text-slate-400 transition-colors hover:bg-brand-50/70 hover:text-slate-600"
              aria-label="Trefferliste schließen"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {searchResults.map((result, index) => (
              <button
                key={`${result.place_id ?? result.osm_id ?? index}`}
                type="button"
                onClick={() => handleSelectSearchResult(result)}
                className="flex w-full items-start gap-3 border-b border-brand-100 px-3 py-3 text-left transition-colors last:border-b-0 hover:bg-brand-50/70"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-700">{result.name || result.display_name}</p>
                  <p className="text-xs leading-relaxed text-slate-500">{result.display_name}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Map */}
      <div className="relative rounded-xl overflow-hidden border border-brand-100 shadow-sm" style={{ height: 260 }}>
        <div className="absolute right-3 top-3 z-[1000]">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setMapType((current) => (current === "standard" ? "topo" : "standard"))}
            className="h-9 border-white/80 bg-white/92 px-3 text-xs text-slate-700 shadow-sm backdrop-blur-sm hover:bg-white"
          >
            <Layers className="mr-1.5 h-4 w-4" />
            {mapType === "standard" ? "Topo" : "Standard"}
          </Button>
        </div>
        <MapContainer
          center={[46.5, 11.3]}
          zoom={9}
          maxZoom={tile.maxZoom}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution={tile.attribution}
            url={tile.url}
            maxZoom={tile.maxZoom}
            maxNativeZoom={tile.maxNativeZoom}
            eventHandlers={{ tileerror: handleTileError }}
          />
          <MapClickHandler onMapClick={handleMapClick} />
          {flyTarget && <MapFlyTo center={flyTarget.center} zoom={flyTarget.zoom} />}
          {markerPos && <Marker position={markerPos} icon={markerIcon} />}
        </MapContainer>
      </div>

      <p className="text-xs text-slate-400">
        Tippe auf die Karte um den Startpunkt der Tour zu markieren
        {markerPos && (
          <span className="ml-2 text-brand-400 font-medium">
            Punkt gesetzt
          </span>
        )}
      </p>
    </div>
  );
}

// Wasser-Picker (0=keins, 1=wenig, 2=mittel, 3=viel)
function WaterPicker({ label, value, onChange }) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5">
        <Label className="mb-0 block text-sm text-slate-600">{label}</Label>
        <WaterInfoDialog />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {WATER_LEVELS.map((option) => {
          const level = option.numeric;
          return (
          <button key={level} type="button"
            onClick={() => onChange(level)}
            className={`flex min-h-[70px] min-w-0 flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 text-center transition-all focus:outline-none ${
              value === level
                ? "border-brand-400 bg-brand-50 text-brand-700"
                : "border-brand-100 bg-white/70 text-slate-500 hover:border-brand-200 hover:bg-brand-50/40"
            }`}
            title={getWaterLabel(level)}
            >
              <span className="text-lg leading-none">
                <WaterIcon value={level} />
              </span>
              <span className="text-xs font-medium leading-tight">
                {getWaterLabel(level)}
              </span>
            </button>
        )})}
      </div>
    </div>
  );
}

// Jahreszeiten-Picker (Mehrfachauswahl)
const SEASON_OPTIONS = SEASON_LEVELS.map((season) => ({
  value: season.value,
  emoji: season.icon,
  label: season.label,
  color: {
    spring: "#ec9cf4",
    summer: "#d64545",
    autumn: "#f19a4b",
    winter: "#5b83f0",
    all_year: "#38a062",
  }[season.value],
}));

function SeasonPicker({ value = [], onChange }) {
  const toggle = (season) => {
    const next = value.includes(season)
      ? value.filter((s) => s !== season)
      : [...value, season];
    onChange(next);
  };
  return (
    <div>
      <Label className="text-sm text-slate-600 mb-2 block">{TOUR_ICONS.season} Empfohlene Jahreszeit</Label>
      <div className="flex flex-wrap gap-2">
        {SEASON_OPTIONS.map((opt) => {
          const active = value.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              style={active ? {
                borderColor: opt.color,
                backgroundColor: opt.color + "22",
                color: opt.color,
              } : {}}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all focus:outline-none ${
                active
                  ? "shadow-sm"
                  : "border-brand-100 bg-white text-slate-500 hover:border-brand-100"
              }`}
            >
              <span>{opt.emoji}</span>
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
      {value.length === 0 && (
        <p className="text-xs text-slate-400 mt-1">Keine Auswahl = wird nicht angezeigt</p>
      )}
    </div>
  );
}

// Sichtbarkeits-Picker
const VISIBILITY_OPTIONS = [
  {
    value: "private",
    emoji: TOUR_ICONS.private,
    label: "Privat",
    desc: "Nur ich sehe diesen Eintrag",
    active: "border-brand-200 bg-brand-100/80 text-slate-900",
    idle: "border-brand-100 hover:border-brand-100",
  },
  {
    value: "friends",
    emoji: TOUR_ICONS.friends,
    label: "Freunde",
    desc: "Nur bestätigte Freunde",
    active: "border-brand-300 bg-brand-50 text-brand-800",
    idle: "border-brand-100 hover:border-brand-200 hover:bg-brand-50/40",
  },
  {
    value: "public",
    emoji: TOUR_ICONS.public,
    label: "Öffentlich",
    desc: "Wird an Admin zur Prüfung geschickt",
    active: "border-brand-400 bg-brand-50 text-brand-700",
    idle: "border-brand-100 hover:border-brand-300",
  },
];

function VisibilityPicker({ value, onChange }) {
  return (
    <div>
      <Label className="text-sm text-slate-600 mb-2 block">Sichtbarkeit</Label>
      <div className="grid grid-cols-3 gap-2">
        {VISIBILITY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all focus:outline-none text-center ${
              value === opt.value ? opt.active : `border-brand-100 bg-white text-slate-500 ${opt.idle}`
            }`}
          >
            <span className="text-xl">{opt.emoji}</span>
            <span className="text-xs font-semibold leading-tight">{opt.label}</span>
            <span className="text-xs leading-tight opacity-70">{opt.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const EMPTY_FORM = {
  title: "",
  date: new Date().toISOString().split("T")[0],
  location: "",
  latitude: "",
  longitude: "",
  distance_km: "",
  elevation_m: "",
  duration_minutes: "",
  difficulty: 0,
  description: "",
  photos: [],
  gpx_url: "",
  rating: 0,
  dog_suitable: true,
  water_available: 0,
  dog_difficulty: 0,
  grazing_animals: false,
  muzzle_recommended: false,
  hazard_notes: "",
  visibility: "private",
  seasons: [],
  dog_id: null,
  dog_mood_tags: [],
};

export default function AddJournalEntry() {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");

  const routePrefill = location.state?.routePrefill || null;

  // Pre-fill from route if navigated from RouteDetail
  const prefill = {
    title: routePrefill?.title ?? searchParams.get("prefill_title") ?? "",
    location: routePrefill?.location ?? searchParams.get("prefill_location") ?? "",
    date: routePrefill?.date ?? "",
    latitude: routePrefill?.latitude ?? "",
    longitude: routePrefill?.longitude ?? "",
    distance_km: routePrefill?.distance_km ?? searchParams.get("prefill_distance") ?? "",
    elevation_m: routePrefill?.elevation_m ?? searchParams.get("prefill_elevation") ?? "",
    duration_minutes: minutesToHoursInput(routePrefill?.duration_minutes ?? searchParams.get("prefill_duration") ?? ""),
    description: routePrefill?.description ?? searchParams.get("prefill_description") ?? "",
    difficulty: routePrefill?.difficulty ?? 0,
    rating: routePrefill?.rating ?? 0,
    dog_difficulty: routePrefill?.dog_difficulty ?? 0,
    water_available: routePrefill?.water_available ?? 0,
    grazing_animals: routePrefill?.grazing_animals ?? false,
    muzzle_recommended: routePrefill?.muzzle_recommended ?? false,
    hazard_notes: routePrefill?.hazard_notes ?? "",
    seasons: routePrefill?.seasons ?? [],
    dog_id: routePrefill?.dog_id ?? null,
    dog_mood_tags: routePrefill?.dog_mood_tags ?? [],
    photos: routePrefill?.photos ?? [],
    gpx_url: routePrefill?.gpx_url ?? "",
  };
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    ...EMPTY_FORM,
    // Apply prefill from route params (only when not editing existing entry)
    ...(editId ? {} : {
      title: prefill.title || EMPTY_FORM.title,
      date: prefill.date || EMPTY_FORM.date,
      location: prefill.location || EMPTY_FORM.location,
      latitude: prefill.latitude || EMPTY_FORM.latitude,
      longitude: prefill.longitude || EMPTY_FORM.longitude,
      distance_km: prefill.distance_km || EMPTY_FORM.distance_km,
      elevation_m: prefill.elevation_m || EMPTY_FORM.elevation_m,
      duration_minutes: prefill.duration_minutes || EMPTY_FORM.duration_minutes,
      description: prefill.description || EMPTY_FORM.description,
      difficulty: prefill.difficulty || EMPTY_FORM.difficulty,
      rating: prefill.rating || EMPTY_FORM.rating,
      dog_difficulty: prefill.dog_difficulty || EMPTY_FORM.dog_difficulty,
      water_available: prefill.water_available ?? EMPTY_FORM.water_available,
      grazing_animals: prefill.grazing_animals ?? EMPTY_FORM.grazing_animals,
      muzzle_recommended: prefill.muzzle_recommended ?? EMPTY_FORM.muzzle_recommended,
      hazard_notes: prefill.hazard_notes || EMPTY_FORM.hazard_notes,
      seasons: Array.isArray(prefill.seasons) ? prefill.seasons : EMPTY_FORM.seasons,
      dog_id: prefill.dog_id ?? EMPTY_FORM.dog_id,
      dog_mood_tags: Array.isArray(prefill.dog_mood_tags) ? prefill.dog_mood_tags : EMPTY_FORM.dog_mood_tags,
      photos: Array.isArray(prefill.photos) ? prefill.photos : EMPTY_FORM.photos,
      gpx_url: prefill.gpx_url || EMPTY_FORM.gpx_url,
    }),
  });
  const [photoUploading, setPhotoUploading] = useState(false);
  const [gpxUploading, setGpxUploading] = useState(false);
  const [photoConsent, setPhotoConsent] = useState(false);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState([]);
  const uploadedPhotosRef = useRef([]);
  const uploadedGpxRef = useRef([]);
  const originalPhotosRef = useRef([]);
  const originalGpxRef = useRef("");
  const removedExistingPhotosRef = useRef([]);
  const removedExistingGpxRef = useRef([]);
  const keepUploadedMediaRef = useRef(false);

  const { data: userDogs = [] } = useQuery({
    queryKey: ["dogs", user?.id],
    queryFn: () => getDogs(user.id),
    enabled: !!user?.id,
  });

  // Load existing entry for editing
  const { data: existing, isLoading: loadingEntry } = useQuery({
    queryKey: ["journalEntry", editId],
    queryFn: () => getJournalEntry(editId),
    enabled: !!editId,
  });

  useEffect(() => {
    if (existing) {
      originalPhotosRef.current = existing.photos ?? [];
      originalGpxRef.current = existing.gpx_url ?? "";
      removedExistingPhotosRef.current = [];
      removedExistingGpxRef.current = [];
      setForm({
        title: existing.title ?? "",
        date: existing.date ?? EMPTY_FORM.date,
        location: existing.location ?? "",
        latitude: existing.latitude ?? "",
        longitude: existing.longitude ?? "",
        distance_km: existing.distance_km ?? "",
        elevation_m: existing.elevation_m ?? "",
        duration_minutes: minutesToHoursInput(existing.duration_minutes),
        difficulty: existing.difficulty ?? 0,
        description: existing.description ?? "",
        photos: existing.photos ?? [],
        gpx_url: existing.gpx_url ?? "",
        rating: existing.rating ?? 0,
        dog_suitable: existing.dog_suitable ?? true,
        water_available: existing.water_available ?? 0,
        dog_difficulty: existing.dog_difficulty ?? 0,
        grazing_animals: existing.grazing_animals ?? false,
        muzzle_recommended: existing.muzzle_recommended ?? false,
        hazard_notes: existing.hazard_notes ?? "",
        visibility: existing.visibility ?? "private",
        seasons: existing.seasons ?? [],
        dog_id: existing.dog_id ?? null,
        dog_mood_tags: existing.dog_mood_tags ?? [],
      });
    }
  }, [existing]);

  useEffect(() => {
    let cancelled = false;

    async function loadPhotoPreviews() {
      const previewUrls = await getSignedJournalUrls(form.photos ?? []);
      if (!cancelled) {
        setPhotoPreviewUrls(previewUrls);
      }
    }

    loadPhotoPreviews();

    return () => {
      cancelled = true;
    };
  }, [form.photos]);

  useEffect(() => {
    return () => {
      if (keepUploadedMediaRef.current) return;

      const filesToDelete = [...uploadedPhotosRef.current, ...uploadedGpxRef.current].filter(Boolean);
      if (filesToDelete.length > 0) {
        void deleteJournalFiles(filesToDelete);
      }
    };
  }, []);

  const saveMutation = useMutation({
    mutationFn: (data) =>
      editId
        ? updateJournalEntry(editId, data)
        : createJournalEntry(user.id, data),
    onSuccess: async () => {
      const filesToDelete = [
        ...removedExistingPhotosRef.current,
        ...removedExistingGpxRef.current,
      ].filter(Boolean);

      if (filesToDelete.length > 0) {
        try {
          await deleteJournalFiles(filesToDelete);
        } catch {
          toast.error("Ein paar alte Dateien hängen noch fest.");
        }
      }

        keepUploadedMediaRef.current = true;
        queryClient.invalidateQueries({ queryKey: ["journal", user?.id] });
        queryClient.invalidateQueries({ queryKey: ["dogStats", user?.id] });
        queryClient.invalidateQueries({ queryKey: ["admin_pending"] });
        queryClient.invalidateQueries({ queryKey: ["allHikes"] });
        queryClient.invalidateQueries({ queryKey: ["topDogs"] });
        queryClient.invalidateQueries({ queryKey: ["journalEntry"] });
        queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
      const selectedDog = userDogs.find((dog) => dog.id === form.dog_id);
      if (editId) {
        showSavedFeedback("Tagebuch gespeichert", "Dein Eintrag ist wieder rund.");
      } else if (selectedDog) {
        showSavedFeedback("Wanderung gespeichert", `${selectedDog.name} und du habt diesen Tag festgehalten.`);
      } else {
        showSavedFeedback("Wanderung gespeichert", "Diese Wanderung ist jetzt in deinem Tagebuch.");
      }
      navigate(createPageUrl("Journal"));
    },
    onError: () => toast.error("Die Wanderung wollte gerade nicht ins Tagebuch. Versuch es gleich noch einmal."),
  });

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    try {
      files.forEach(validateImageUpload);
    } catch (error) {
      toast.error(getImageUploadErrorMessage(error));
      return;
    }
    setPhotoUploading(true);
    try {
      const urls = await Promise.all(files.map((f) => uploadJournalFile(user.id, f)));
      uploadedPhotosRef.current = [...uploadedPhotosRef.current, ...urls];
      setForm((p) => ({ ...p, photos: [...p.photos, ...urls] }));
      showUploadedFeedback(
        `${urls.length} Foto${urls.length > 1 ? "s" : ""} hochgeladen`,
        "Deine Bilder sind jetzt im Eintrag dabei."
      );
    } catch (error) {
      toast.error(
        getImageUploadErrorMessage(
          error,
          "Die Fotos wollten gerade nicht hochladen. Versuch es gleich noch einmal."
        )
      );
    } finally {
      setPhotoUploading(false);
    }
  };

  const removeUploadedPhoto = async (index) => {
    const photoToRemove = form.photos?.[index];
    if (!photoToRemove) return;

    const isNewUpload = uploadedPhotosRef.current.includes(photoToRemove);

    if (isNewUpload) {
      try {
        await deleteJournalFiles([photoToRemove]);
      } catch {
        toast.error("Das Foto bleibt gerade noch drin. Versuch es gleich noch einmal.");
        return;
      }

      uploadedPhotosRef.current = uploadedPhotosRef.current.filter((url) => url !== photoToRemove);
    } else if (originalPhotosRef.current.includes(photoToRemove)) {
      removedExistingPhotosRef.current = [...new Set([...removedExistingPhotosRef.current, photoToRemove])];
    }

    set("photos", form.photos.filter((_, j) => j !== index));
  };

  const handleGpxUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("GPX-Datei zu groß (max. 5 MB)");
      return;
    }
    setGpxUploading(true);
    try {
      const url = await uploadJournalFile(user.id, file);
      if (form.gpx_url) {
        if (uploadedGpxRef.current.includes(form.gpx_url)) {
          await deleteJournalFiles([form.gpx_url]);
          uploadedGpxRef.current = uploadedGpxRef.current.filter((existingUrl) => existingUrl !== form.gpx_url);
        } else if (originalGpxRef.current === form.gpx_url) {
          removedExistingGpxRef.current = [...new Set([...removedExistingGpxRef.current, form.gpx_url])];
        }
      }
      uploadedGpxRef.current = [...uploadedGpxRef.current, url];
      setForm((p) => ({ ...p, gpx_url: url }));
      showUploadedFeedback("GPX hochgeladen", "Die Route ist jetzt im Eintrag dabei.");
    } catch {
      toast.error("Die GPX-Datei wollte gerade nicht hochladen.");
    } finally {
      setGpxUploading(false);
    }
  };

  const removeUploadedGpx = async () => {
    if (!form.gpx_url) return;

    if (uploadedGpxRef.current.includes(form.gpx_url)) {
      try {
        await deleteJournalFiles([form.gpx_url]);
        uploadedGpxRef.current = uploadedGpxRef.current.filter((existingUrl) => existingUrl !== form.gpx_url);
      } catch {
        toast.error("Die GPX-Datei bleibt gerade noch drin.");
        return;
      }
    } else if (originalGpxRef.current === form.gpx_url) {
      removedExistingGpxRef.current = [...new Set([...removedExistingGpxRef.current, form.gpx_url])];
    }

    set("gpx_url", "");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.date) {
      toast.error("Titel und Datum fehlen noch.");
      return;
    }

    if (form.visibility === "friends" || form.visibility === "public") {
      const missing = getMissingSharedJournalFields(form);
      if (missing.length > 0) {
        const targetLabel = form.visibility === "public" ? "öffentlich" : "mit Freunden geteilt";
        toast.error(
          `Um eine Tour ${targetLabel} zu speichern, müssen alle Pflichtfelder ausgefüllt sein: ${missing.join(", ")}`,
          {
          duration: 6000,
          }
        );
        return;
      }
    }

    const needsConsent = form.photos.length > 0 && form.visibility !== "private";
    if (needsConsent && !photoConsent) {
      toast.error("Bitte bestätige dein Einverständnis zu den Fotos.");
      return;
    }

    const nextStatus =
      form.visibility === "public"
        ? (isAdmin ? "approved" : "pending")
        : form.visibility === "friends"
          ? "approved"
          : "draft";

    saveMutation.mutate({
      ...form,
      distance_km: form.distance_km !== "" ? Number(form.distance_km) : null,
      elevation_m: form.elevation_m !== "" ? Number(form.elevation_m) : null,
      duration_minutes: hoursInputToMinutes(form.duration_minutes),
      difficulty: form.difficulty || null,
      rating: form.rating || null,
      dog_difficulty: form.dog_difficulty || null,
      grazing_animals: !!form.grazing_animals,
      muzzle_recommended: !!form.muzzle_recommended,
      dog_mood_tags: form.visibility === "private" ? (form.dog_mood_tags ?? []) : [],
      latitude: form.latitude !== "" ? Number(form.latitude) : null,
      longitude: form.longitude !== "" ? Number(form.longitude) : null,
      // public -> pending admin review (admins can keep approved entries approved)
      // friends -> approved immediately (no review needed, only friends see it)
      // private -> draft (only owner sees it)
      status: nextStatus,
    });
  };

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));
  const toggleDogMoodTag = (tag) => {
    setForm((prev) => ({
      ...prev,
      dog_mood_tags: prev.dog_mood_tags.includes(tag)
        ? prev.dog_mood_tags.filter((entry) => entry !== tag)
        : [...prev.dog_mood_tags, tag],
    }));
  };
  const toggleDogHint = (field) => setForm((prev) => ({ ...prev, [field]: !prev[field] }));

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Bitte zuerst anmelden.</p>
          <Link to={createPageUrl("Login")}>
            <Button className="bg-brand-400 hover:bg-brand-600">Anmelden</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loadingEntry) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (editId && !existing) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-xl text-slate-700 mb-4">Eintrag nicht gefunden</p>
          <Link to={createPageUrl("Journal")}>
            <Button variant="outline">Zurück zum Tagebuch</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50/10 pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 md:py-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Link to={createPageUrl("Journal")}>
            <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-slate-600">
              <ArrowLeft className="w-4 h-4 mr-1" /> Zurück
            </Button>
          </Link>
          <div className="doghike-page-header">
            <div className="doghike-page-icon">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="doghike-page-title">
                {editId ? "Eintrag bearbeiten" : "Neue Wanderung"}
              </h1>
              <p className="doghike-page-subtitle">
                {editId ? "Ändere deine Aufzeichnung" : "Halte dein Wandererlebnis fest"}
              </p>
            </div>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Basis-Infos */}
          <section className="doghike-glass-card p-5 space-y-4">
            <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide flex items-center gap-2">
              <FileText className="w-4 h-4" /> Allgemein
            </h2>

            <div>
              <Label htmlFor="title">Titel *</Label>
              <Input id="title" value={form.title} onChange={(e) => set("title", e.target.value)}
                placeholder="z.B. Pragser Wildsee Rundweg" required className="mt-1" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Datum *</Label>
                <Input id="date" type="date" value={form.date} onChange={(e) => set("date", e.target.value)}
                  required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="location" className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Ort</Label>
                <Input id="location" value={form.location} onChange={(e) => set("location", e.target.value)}
                  placeholder="z.B. Prags, Südtirol" className="mt-1" />
              </div>
            </div>

            <div>
              <Label className="flex items-center gap-1 mb-2">
                <MapPin className="w-3.5 h-3.5" /> Startpunkt auf Karte
              </Label>
              <LocationPicker
                lat={form.latitude}
                lng={form.longitude}
                onChange={(lat, lng) => {
                  set("latitude", lat);
                  set("longitude", lng);
                }}
              />
            </div>

            <div>
              <Label htmlFor="description">Beschreibung / Notizen</Label>
              <Textarea id="description" value={form.description} onChange={(e) => set("description", e.target.value)}
                placeholder="Wie war die Wanderung? Besondere Momente, Tipps..."
                rows={4} className="mt-1" />
            </div>
          </section>

          {/* Stats */}
          <section className="doghike-glass-card p-5 space-y-4">
            <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Statistiken
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="distance_km" className="flex items-center gap-1"><span>{TOUR_ICONS.distance}</span> Distanz (km)</Label>
                <Input id="distance_km" type="number" step="0.1" min="0" value={form.distance_km}
                  onChange={(e) => set("distance_km", e.target.value)}
                  placeholder="z.B. 8.5" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="elevation_m" className="flex items-center gap-1"><span>{TOUR_ICONS.elevation}</span> Höhenmeter</Label>
                <Input id="elevation_m" type="number" min="0" value={form.elevation_m}
                  onChange={(e) => set("elevation_m", e.target.value)}
                  placeholder="z.B. 450" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="duration_minutes" className="flex items-center gap-1"><span>{TOUR_ICONS.duration}</span> Dauer (Stunden)</Label>
                <Input id="duration_minutes" type="number" min="0" step="0.1" value={form.duration_minutes}
                  onChange={(e) => set("duration_minutes", e.target.value)}
                  placeholder="z.B. 3" className="mt-1" />
              </div>
            </div>

            <MountainPicker label="Schwierigkeit (Mensch)" value={form.difficulty} onChange={(v) => set("difficulty", v)} />
          </section>

          {/* Hund */}
          <section className="doghike-glass-card p-5 space-y-4">
            <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide flex items-center gap-2">
              <Dog className="w-4 h-4" /> Mit dem Hund
            </h2>

            <div className="doghike-soft-panel flex items-center justify-between p-3">
              <Label htmlFor="dog_suitable" className="cursor-pointer flex items-center gap-2">
                Hundefreundlich
              </Label>
              <input
                id="dog_suitable"
                type="checkbox"
                checked={form.dog_suitable}
                onChange={(e) => set("dog_suitable", e.target.checked)}
                className="w-5 h-5 rounded accent-brand-400 cursor-pointer"
              />
            </div>

            <WaterPicker label="Wasserverfügbarkeit" value={form.water_available} onChange={(v) => set("water_available", v)} />

            <BonePicker label="Schwierigkeit (Hund)" value={form.dog_difficulty} onChange={(v) => set("dog_difficulty", v)} />

            <div>
              <Label className="mb-2 block text-sm text-slate-600">Hinweise für Hunde (optional)</Label>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => toggleDogHint("grazing_animals")}
                    className={`rounded-full border px-3 py-2 text-sm transition-all ${
                      form.grazing_animals
                        ? "border-brand-200 bg-brand-100/80 font-medium text-slate-700"
                        : "border-brand-100 bg-white/70 text-slate-500 hover:border-brand-200 hover:bg-brand-50/70"
                    }`}
                  >
                    {TOUR_ICONS.grazing} Weidetiere
                  </button>
                  <GrazingAnimalsInfoDialog />
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => toggleDogHint("muzzle_recommended")}
                    className={`rounded-full border px-3 py-2 text-sm transition-all ${
                      form.muzzle_recommended
                        ? "border-brand-200 bg-brand-100/80 font-medium text-slate-700"
                        : "border-brand-100 bg-white/70 text-slate-500 hover:border-brand-200 hover:bg-brand-50/70"
                    }`}
                  >
                    {TOUR_ICONS.muzzle} Maulkorb
                  </button>
                  <MuzzleInfoDialog />
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Du kannst keinen, einen oder beide Hinweise auswählen. Wenn nichts markiert ist, werden sie im Eintrag nicht angezeigt.
              </p>
            </div>

            {form.visibility === "private" && (
              <div>
                <Label className="text-sm text-slate-600 mb-2 block">Wie war dein Hund drauf? (optional, nur privat)</Label>
                <div className="flex flex-wrap gap-2">
                  {DOG_PRIVATE_TAGS.map((tag) => {
                    const isActive = form.dog_mood_tags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleDogMoodTag(tag)}
                        className={`rounded-full border px-3 py-2 text-sm transition-all ${
                          isActive
                            ? "border-brand-200 bg-brand-100/80 font-medium text-slate-700"
                            : "border-brand-100 bg-white/70 text-slate-500 hover:border-brand-200 hover:bg-brand-50/70"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Du kannst eine oder mehrere Angaben wählen. Diese Infos bleiben nur in privaten Einträgen und werden bei Freunde oder öffentlich nicht mitgeteilt.
                </p>
              </div>
            )}

            {/* Dog picker */}
            {userDogs.length > 0 && (
              <div>
                <Label className="text-sm text-slate-600 mb-2 block">Welcher Hund war dabei?</Label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => set("dog_id", null)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm transition-all focus:outline-none ${
                      form.dog_id === null
                        ? "border-brand-200 bg-brand-100/80 text-slate-700 font-medium"
                        : "border-brand-100 text-slate-400 hover:border-brand-100"
                    }`}
                  >
                    Kein / unbekannt
                  </button>
                  {userDogs.map((dog) => (
                    <button
                      key={dog.id}
                      type="button"
                      onClick={() => set("dog_id", dog.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm transition-all focus:outline-none ${
                        form.dog_id === dog.id
                          ? "border-brand-400 bg-brand-50 text-brand-700 font-medium"
                          : "border-brand-100 text-slate-600 hover:border-brand-300"
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-brand-100/80 shrink-0">
                        <img
                          src={dog.photo_url || getAvatarDataUrl(dog.name)}
                          alt={dog.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {dog.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="hazard_notes" className="flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-brand-500" /> Gefahrenhinweise
              </Label>
              <Textarea id="hazard_notes" value={form.hazard_notes} onChange={(e) => set("hazard_notes", e.target.value)}
                placeholder="z.B. Steinschlaggefahr, steile Abschnitte, kein Schatten..." rows={2} className="mt-1" />
            </div>
          </section>

          {/* Bewertung */}
          <section className="doghike-glass-card p-5">
            <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide mb-4 flex items-center gap-2">
              <Star className="w-4 h-4" /> Gesamtbewertung
            </h2>
            <StarPicker label="Wie hat dir die Wanderung gefallen?" value={form.rating} onChange={(v) => set("rating", v)} />
          </section>

          {/* Fotos */}
          <section className="doghike-glass-card p-5 space-y-4">
            <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide flex items-center gap-2">
              <Upload className="w-4 h-4" /> Fotos
            </h2>

            {form.photos.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {photoPreviewUrls.map((url, i) => (
                  <div key={i} className="relative group aspect-square">
                    <img src={url} alt="" className="w-full h-full object-cover rounded-lg" />
                    <button type="button"
                      onClick={() => void removeUploadedPhoto(i)}
                      className="absolute top-1 right-1 bg-brand-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-brand-100 rounded-xl cursor-pointer hover:border-brand-400 hover:bg-brand-50/30 transition-colors">
              <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" disabled={photoUploading} />
              {photoUploading ? (
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                    <span className="text-sm text-slate-400">Lade hoch...</span>
                  </div>
                  <PawLoadingTrail className="mt-2" />
                </div>
              ) : (
                <><Upload className="w-6 h-6 text-slate-400" /><span className="text-sm text-slate-500">Fotos hochladen</span><span className="text-xs text-slate-400">JPG, PNG, WEBP</span></>
              )}
            </label>
          </section>

          {/* GPX */}
          <section className="doghike-glass-card p-5 space-y-3">
            <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide flex items-center gap-2">
              <MapPin className="w-4 h-4" /> GPX-Route (optional)
            </h2>

            {form.gpx_url ? (
              <div className="flex items-center gap-3 p-3 bg-brand-50 border border-brand-200 rounded-lg">
                <MapPin className="w-4 h-4 text-brand-400 shrink-0" />
                <span className="text-sm text-brand-600 flex-1 truncate">GPX-Datei ist dabei</span>
                <button type="button" onClick={() => void removeUploadedGpx()} className="text-slate-400 hover:text-brand-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-3 p-4 border-2 border-dashed border-brand-100 rounded-xl cursor-pointer hover:border-brand-400 hover:bg-brand-50/30 transition-colors">
                <input type="file" accept=".gpx" onChange={handleGpxUpload} className="hidden" disabled={gpxUploading} />
                {gpxUploading ? (
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                      <span className="text-sm text-slate-400">Lade hoch...</span>
                    </div>
                    <PawLoadingTrail className="mt-2" />
                  </div>
                ) : (
                  <><Upload className="w-5 h-5 text-slate-400" /><span className="text-sm text-slate-500">.gpx Datei hochladen</span></>
                )}
              </label>
            )}
          </section>

          {/* Jahreszeit */}
          <section className="doghike-glass-card p-5">
            <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide mb-4 flex items-center gap-2">
              {TOUR_ICONS.season} Jahreszeit
            </h2>
            <SeasonPicker
              value={form.seasons}
              onChange={(v) => set("seasons", v)}
            />
            <p className="mt-2 text-xs text-slate-400">
              Du kannst eine oder mehrere Jahreszeiten auswählen, zum Beispiel Frühling und Herbst. Bei privaten Einträgen optional. Für Einträge mit Freunden oder öffentlich bitte mindestens eine Jahreszeit auswählen.
            </p>
          </section>

          {/* Sichtbarkeit */}
          <section className="doghike-glass-card p-5">
            <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide mb-4 flex items-center gap-2">
              Sichtbarkeit
            </h2>
            <VisibilityPicker value={form.visibility} onChange={(v) => { set("visibility", v); }} />
            {form.visibility === "public" && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-brand-600 bg-brand-50 border border-brand-100 rounded-lg px-3 py-2">
                  Nach dem Speichern wird dieser Eintrag an einen Admin zur Prüfung geschickt und erst danach öffentlich sichtbar.
                </p>
                <div className="text-xs rounded-lg border border-brand-200 bg-brand-50/70 px-3 py-2 text-brand-800">
                  <p className="font-semibold mb-1">Pflichtfelder für öffentliche Touren:</p>
                  <p>Ort - Startpunkt (Karte) - Distanz - Höhenmeter - Dauer - Schwierigkeit (Mensch und Hund) - Beschreibung - mind. 1 Foto - Jahreszeit</p>
                  <p className="mt-1 text-brand-600">GPX-Datei ist optional.</p>
                </div>
              </div>
            )}
          </section>

          {/* Foto-Einverständnis (nur wenn Fotos + nicht privat) */}
          {form.photos.length > 0 && form.visibility !== "private" && (
            <section className="bg-brand-50 border border-brand-100 rounded-2xl p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={photoConsent}
                  onChange={(e) => setPhotoConsent(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded accent-brand-400 shrink-0 cursor-pointer"
                />
                <span className="text-sm text-brand-700 leading-relaxed">
                  <strong>Einverständnis Fotos:</strong> Ich bestätige, dass ich die Nutzungsrechte
                  an den hochgeladenen Fotos besitze und dass abgebildete Personen der
                  Veröffentlichung zugestimmt haben. Mir ist bewusst, dass diese Fotos für{" "}
                  {form.visibility === "public" ? "alle Nutzer weltweit" : "meine Freunde"}{" "}
                  sichtbar und über eine URL abrufbar sind.
                </span>
              </label>
            </section>
          )}

          {/* Submit */}
          <div className="flex gap-3 justify-end pb-4">
            <Link to={createPageUrl("Journal")}>
              <Button type="button" variant="outline">Abbrechen</Button>
            </Link>
            <Button
              type="submit"
              disabled={
                saveMutation.isPending ||
                (form.photos.length > 0 && form.visibility !== "private" && !photoConsent)
              }
              className="bg-brand-400 hover:bg-brand-600 px-8"
            >
              {saveMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Speichern...</>
              ) : (
                editId ? "Aktualisieren" : "Wanderung speichern"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}





