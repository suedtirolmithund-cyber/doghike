import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import {
  ArrowLeft, Upload, X, Loader2, Star, FileText,
  Mountain, Clock, Ruler, TrendingUp, MapPin, AlertTriangle, Dog, Search
} from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import {
  createJournalEntry,
  updateJournalEntry,
  getJournalEntry,
  getSignedJournalUrls,
  uploadJournalFile,
  deleteJournalFiles,
  getMissingPublicJournalFields,
} from "@/lib/journalApi";
import { getDogs } from "@/lib/profilesApi";
import { Link } from "react-router-dom";
import { DIFFICULTY_LEVELS, WATER_LEVELS, getDifficultyLabel, getDifficultyTextColor, getWaterIcon, getWaterLabel } from "@/lib/difficultyConfig";

// Sterne-Picker (Gesamtbewertung)
function StarPicker({ label, value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div>
      <Label className="text-sm text-stone-600 mb-1 block">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button key={s} type="button"
            onClick={() => onChange(s === value ? 0 : s)}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
            className="focus:outline-none"
          >
            <Star className={`w-7 h-7 transition-colors ${
              s <= (hover || value) ? "fill-yellow-400 text-yellow-400" : "text-stone-300"
            }`} />
          </button>
        ))}
        {value > 0 && (
          <button type="button" onClick={() => onChange(0)} className="ml-1 text-stone-400 hover:text-stone-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// Berg-Picker (Schwierigkeit Mensch)
function MountainPicker({ label, value, onChange }) {
  const [hover, setHover] = useState(0);
  const active = hover || value;
  return (
    <div>
      <Label className="text-sm text-stone-600 mb-1 block">{label}</Label>
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
                : "text-stone-300"
            }`} />
          </button>
        )})}
        {value > 0 && (
          <>
            <button type="button" onClick={() => onChange(0)} className="ml-1 text-stone-400 hover:text-stone-600">
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
      <Label className="text-sm text-stone-600 mb-1 block">{label}</Label>
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
          >
            🦴
          </button>
        )})}
        {value > 0 && (
          <>
            <button type="button" onClick={() => onChange(0)} className="ml-1 text-stone-400 hover:text-stone-600">
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

// Fliegt zur neuen Position wenn sich center aendert
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
  const [searchText, setSearchText] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const handleMapClick = ({ lat: clickLat, lng: clickLng }) => {
    setMarkerPos([clickLat, clickLng]);
    onChange(clickLat, clickLng);
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    const query = searchText.trim();
    if (!query) return;
    setSearching(true);
    setSearchError(null);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&accept-language=de`;
      const resp = await fetch(url, { headers: { "Accept-Language": "de" } });
      const results = await resp.json();
      if (results.length > 0) {
        const { lat: rLat, lon: rLon } = results[0];
        const pos = [parseFloat(rLat), parseFloat(rLon)];
        setMarkerPos(pos);
        setFlyTarget({ center: pos, zoom: 13 });
        onChange(pos[0], pos[1]);
      } else {
        setSearchError("Ort nicht gefunden. Bitte genauere Suche eingeben.");
      }
    } catch {
      setSearchError("Suche fehlgeschlagen. Bitte Karte manuell tippen.");
    } finally {
      setSearching(false);
    }
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
        <p className="text-xs text-red-500">{searchError}</p>
      )}

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-stone-200 shadow-sm" style={{ height: 260 }}>
        <MapContainer
          center={[46.5, 11.3]}
          zoom={9}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
          />
          <MapClickHandler onMapClick={handleMapClick} />
          {flyTarget && <MapFlyTo center={flyTarget.center} zoom={flyTarget.zoom} />}
          {markerPos && <Marker position={markerPos} icon={markerIcon} />}
        </MapContainer>
      </div>

      <p className="text-xs text-stone-400">
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
      <Label className="text-sm text-stone-600 mb-1 block">{label}</Label>
      <div className="flex gap-2">
        {WATER_LEVELS.map((option) => {
          const level = option.numeric;
          return (
          <button key={level} type="button"
            onClick={() => onChange(level)}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all focus:outline-none ${
              value === level
                ? "border-blue-400 bg-blue-50 text-blue-700"
                : "border-stone-200 bg-stone-50 text-stone-400 hover:border-blue-300 hover:bg-blue-50/50"
            }`}
            title={getWaterLabel(level)}
            >
              <span className="text-lg leading-none">
                {getWaterIcon(level)}
              </span>
              <span className="text-[10px] font-medium whitespace-nowrap">
                {getWaterLabel(level)}
              </span>
            </button>
        )})}
      </div>
    </div>
  );
}

// Jahreszeiten-Picker (Mehrfachauswahl)
const SEASON_OPTIONS = [
  { value: "spring", emoji: "🌸", label: "Frühling", color: "#ec9cf4" },
  { value: "summer", emoji: "☀️", label: "Sommer", color: "#d64545" },
  { value: "autumn", emoji: "🍂", label: "Herbst", color: "#f19a4b" },
  { value: "winter", emoji: "❄️", label: "Winter", color: "#5b83f0" },
  { value: "all_year", emoji: "🍃", label: "Ganzjährig", color: "#38a062" },
];

function SeasonPicker({ value = [], onChange }) {
  const toggle = (season) => {
    const next = value.includes(season)
      ? value.filter((s) => s !== season)
      : [...value, season];
    onChange(next);
  };
  return (
    <div>
      <Label className="text-sm text-stone-600 mb-2 block">Empfohlene Jahreszeit</Label>
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
                  : "border-stone-200 bg-white text-stone-500 hover:border-stone-300"
              }`}
            >
              <span>{opt.emoji}</span>
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
      {value.length === 0 && (
        <p className="text-xs text-stone-400 mt-1">Keine Auswahl = wird nicht angezeigt</p>
      )}
    </div>
  );
}

// Sichtbarkeits-Picker
const VISIBILITY_OPTIONS = [
  {
    value: "private",
    emoji: "👤",
    label: "Privat",
    desc: "Nur ich sehe diesen Eintrag",
    active: "border-stone-400 bg-stone-100 text-stone-800",
    idle: "border-stone-200 hover:border-stone-300",
  },
  {
    value: "friends",
    emoji: "🫂",
    label: "Freunde",
    desc: "Nur bestätigte Freunde",
    active: "border-blue-400 bg-blue-50 text-blue-800",
    idle: "border-stone-200 hover:border-blue-300",
  },
  {
    value: "public",
    emoji: "🌍",
    label: "Öffentlich",
    desc: "Wird an Admin zur Prüfung geschickt",
    active: "border-brand-400 bg-brand-50 text-brand-700",
    idle: "border-stone-200 hover:border-brand-300",
  },
];

function VisibilityPicker({ value, onChange }) {
  return (
    <div>
      <Label className="text-sm text-stone-600 mb-2 block">Sichtbarkeit</Label>
      <div className="grid grid-cols-3 gap-2">
        {VISIBILITY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all focus:outline-none text-center ${
              value === opt.value ? opt.active : `border-stone-200 bg-white text-stone-500 ${opt.idle}`
            }`}
          >
            <span className="text-xl">{opt.emoji}</span>
            <span className="text-xs font-semibold leading-tight">{opt.label}</span>
            <span className="text-[10px] leading-tight opacity-70">{opt.desc}</span>
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
  hazard_notes: "",
  visibility: "private",
  seasons: [],
  dog_id: null,
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
    duration_minutes: routePrefill?.duration_minutes ?? searchParams.get("prefill_duration") ?? "",
    description: routePrefill?.description ?? searchParams.get("prefill_description") ?? "",
    difficulty: routePrefill?.difficulty ?? 0,
    rating: routePrefill?.rating ?? 0,
    dog_difficulty: routePrefill?.dog_difficulty ?? 0,
    water_available: routePrefill?.water_available ?? 0,
    hazard_notes: routePrefill?.hazard_notes ?? "",
    seasons: routePrefill?.seasons ?? [],
    dog_id: routePrefill?.dog_id ?? null,
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
      hazard_notes: prefill.hazard_notes || EMPTY_FORM.hazard_notes,
      seasons: Array.isArray(prefill.seasons) ? prefill.seasons : EMPTY_FORM.seasons,
      dog_id: prefill.dog_id ?? EMPTY_FORM.dog_id,
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
        duration_minutes: existing.duration_minutes ?? "",
        difficulty: existing.difficulty ?? 0,
        description: existing.description ?? "",
        photos: existing.photos ?? [],
        gpx_url: existing.gpx_url ?? "",
        rating: existing.rating ?? 0,
        dog_suitable: existing.dog_suitable ?? true,
        water_available: existing.water_available ?? 0,
        dog_difficulty: existing.dog_difficulty ?? 0,
        hazard_notes: existing.hazard_notes ?? "",
        visibility: existing.visibility ?? "private",
        seasons: existing.seasons ?? [],
        dog_id: existing.dog_id ?? null,
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
          toast.error("Einige ersetzte Dateien konnten nicht vollständig entfernt werden.");
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
      toast.success(editId ? "Eintrag aktualisiert" : "Wanderung gespeichert!");
      navigate(createPageUrl("Journal"));
    },
    onError: () => toast.error("Deine Wanderung konnte gerade nicht gespeichert werden. Bitte versuche es noch einmal."),
  });

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setPhotoUploading(true);
    try {
      const urls = await Promise.all(files.map((f) => uploadJournalFile(user.id, f)));
      uploadedPhotosRef.current = [...uploadedPhotosRef.current, ...urls];
      setForm((p) => ({ ...p, photos: [...p.photos, ...urls] }));
      toast.success(`${urls.length} Foto${urls.length > 1 ? "s" : ""} hochgeladen`);
    } catch {
      toast.error("Die Fotos konnten gerade nicht hochgeladen werden. Bitte versuche es noch einmal.");
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
        toast.error("Das Foto konnte gerade nicht entfernt werden. Bitte versuche es noch einmal.");
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
      toast.success("GPX-Datei hochgeladen");
    } catch {
      toast.error("Die GPX-Datei konnte gerade nicht hochgeladen werden. Bitte versuche es noch einmal.");
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
        toast.error("Die GPX-Datei konnte gerade nicht entfernt werden. Bitte versuche es noch einmal.");
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
      toast.error("Titel und Datum sind Pflichtfelder.");
      return;
    }

    if (form.visibility === "public") {
      const missing = getMissingPublicJournalFields(form);
      if (missing.length > 0) {
        toast.error(`Bitte fülle für eine öffentliche Tour noch diese Felder aus:\n${missing.join(", ")}`, {
          duration: 6000,
        });
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
      duration_minutes: form.duration_minutes !== "" ? Number(form.duration_minutes) : null,
      difficulty: form.difficulty || null,
      rating: form.rating || null,
      dog_difficulty: form.dog_difficulty || null,
      latitude: form.latitude !== "" ? Number(form.latitude) : null,
      longitude: form.longitude !== "" ? Number(form.longitude) : null,
      // public -> pending admin review (admins can keep approved entries approved)
      // friends -> approved immediately (no review needed, only friends see it)
      // private -> draft (only owner sees it)
      status: nextStatus,
    });
  };

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone-500 mb-4">Bitte zuerst anmelden.</p>
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
        <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
      </div>
    );
  }

  if (editId && !existing) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-xl text-stone-700 mb-4">Eintrag nicht gefunden</p>
          <Link to={createPageUrl("Journal")}>
            <Button variant="outline">Zurück zum Tagebuch</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-brand-50/10 pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 md:py-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Link to={createPageUrl("Journal")}>
            <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-stone-600">
              <ArrowLeft className="w-4 h-4 mr-1" /> Zurück
            </Button>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-stone-800">
            {editId ? "Eintrag bearbeiten" : "Neue Wanderung"}
          </h1>
          <p className="text-stone-500 text-sm mt-0.5">
            {editId ? "Ändere deine Aufzeichnung" : "Halte dein Wandererlebnis fest"}
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Basis-Infos */}
          <section className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-5 space-y-4">
            <h2 className="font-semibold text-stone-700 text-sm uppercase tracking-wide flex items-center gap-2">
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
          <section className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-5 space-y-4">
            <h2 className="font-semibold text-stone-700 text-sm uppercase tracking-wide flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Statistiken
            </h2>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="distance_km" className="flex items-center gap-1"><Ruler className="w-3.5 h-3.5" /> Distanz (km)</Label>
                <Input id="distance_km" type="number" step="0.1" min="0" value={form.distance_km}
                  onChange={(e) => set("distance_km", e.target.value)}
                  placeholder="z.B. 8.5" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="elevation_m" className="flex items-center gap-1"><Mountain className="w-3.5 h-3.5" /> Höhenmeter</Label>
                <Input id="elevation_m" type="number" min="0" value={form.elevation_m}
                  onChange={(e) => set("elevation_m", e.target.value)}
                  placeholder="z.B. 450" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="duration_minutes" className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Dauer (min)</Label>
                <Input id="duration_minutes" type="number" min="0" value={form.duration_minutes}
                  onChange={(e) => set("duration_minutes", e.target.value)}
                  placeholder="z.B. 180" className="mt-1" />
              </div>
            </div>

            <MountainPicker label="Schwierigkeit (Mensch)" value={form.difficulty} onChange={(v) => set("difficulty", v)} />
          </section>

          {/* Hund */}
          <section className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-5 space-y-4">
            <h2 className="font-semibold text-stone-700 text-sm uppercase tracking-wide flex items-center gap-2">
              <Dog className="w-4 h-4" /> Mit dem Hund
            </h2>

            <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
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

            {/* Dog picker */}
            {userDogs.length > 0 && (
              <div>
                <Label className="text-sm text-stone-600 mb-2 block">Welcher Hund war dabei?</Label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => set("dog_id", null)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm transition-all focus:outline-none ${
                      form.dog_id === null
                        ? "border-stone-400 bg-stone-100 text-stone-700 font-medium"
                        : "border-stone-200 text-stone-400 hover:border-stone-300"
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
                          : "border-stone-200 text-stone-600 hover:border-brand-300"
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-stone-100 shrink-0">
                        <img
                          src={dog.photo_url || `https://api.dicebear.com/7.x/thumbs/svg?seed=${dog.name}`}
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
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Gefahrenhinweise
              </Label>
              <Textarea id="hazard_notes" value={form.hazard_notes} onChange={(e) => set("hazard_notes", e.target.value)}
                placeholder="z.B. Steinschlaggefahr, steile Abschnitte, kein Schatten..." rows={2} className="mt-1" />
            </div>
          </section>

          {/* Bewertung */}
          <section className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-5">
            <h2 className="font-semibold text-stone-700 text-sm uppercase tracking-wide mb-4 flex items-center gap-2">
              <Star className="w-4 h-4" /> Gesamtbewertung
            </h2>
            <StarPicker label="Wie hat dir die Wanderung gefallen?" value={form.rating} onChange={(v) => set("rating", v)} />
          </section>

          {/* Fotos */}
          <section className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-5 space-y-4">
            <h2 className="font-semibold text-stone-700 text-sm uppercase tracking-wide flex items-center gap-2">
              <Upload className="w-4 h-4" /> Fotos
            </h2>

            {form.photos.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {photoPreviewUrls.map((url, i) => (
                  <div key={i} className="relative group aspect-square">
                    <img src={url} alt="" className="w-full h-full object-cover rounded-lg" />
                    <button type="button"
                      onClick={() => void removeUploadedPhoto(i)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-stone-300 rounded-xl cursor-pointer hover:border-brand-400 hover:bg-brand-50/30 transition-colors">
              <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" disabled={photoUploading} />
              {photoUploading ? (
                <><Loader2 className="w-6 h-6 text-stone-400 animate-spin" /><span className="text-sm text-stone-400">Lade hoch...</span></>
              ) : (
                <><Upload className="w-6 h-6 text-stone-400" /><span className="text-sm text-stone-500">Fotos hochladen</span><span className="text-xs text-stone-400">JPG, PNG, WEBP</span></>
              )}
            </label>
          </section>

          {/* GPX */}
          <section className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-5 space-y-3">
            <h2 className="font-semibold text-stone-700 text-sm uppercase tracking-wide flex items-center gap-2">
              <MapPin className="w-4 h-4" /> GPX-Route (optional)
            </h2>

            {form.gpx_url ? (
              <div className="flex items-center gap-3 p-3 bg-brand-50 border border-brand-200 rounded-lg">
                <MapPin className="w-4 h-4 text-brand-400 shrink-0" />
                <span className="text-sm text-brand-600 flex-1 truncate">GPX-Datei gespeichert</span>
                <button type="button" onClick={() => void removeUploadedGpx()} className="text-stone-400 hover:text-red-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-3 p-4 border-2 border-dashed border-stone-300 rounded-xl cursor-pointer hover:border-brand-400 hover:bg-brand-50/30 transition-colors">
                <input type="file" accept=".gpx" onChange={handleGpxUpload} className="hidden" disabled={gpxUploading} />
                {gpxUploading ? (
                  <><Loader2 className="w-5 h-5 text-stone-400 animate-spin" /><span className="text-sm text-stone-400">Lade hoch...</span></>
                ) : (
                  <><Upload className="w-5 h-5 text-stone-400" /><span className="text-sm text-stone-500">.gpx Datei hochladen</span></>
                )}
              </label>
            )}
          </section>

          {/* Jahreszeit (nur bei friends/public) */}
          {(form.visibility === "friends" || form.visibility === "public") && (
            <section className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-5">
              <h2 className="font-semibold text-stone-700 text-sm uppercase tracking-wide mb-4 flex items-center gap-2">
                Jahreszeit
              </h2>
              <SeasonPicker
                value={form.seasons}
                onChange={(v) => set("seasons", v)}
              />
            </section>
          )}

          {/* Sichtbarkeit */}
          <section className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-5">
            <h2 className="font-semibold text-stone-700 text-sm uppercase tracking-wide mb-4 flex items-center gap-2">
              Sichtbarkeit
            </h2>
            <VisibilityPicker value={form.visibility} onChange={(v) => { set("visibility", v); }} />
            {form.visibility === "public" && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  Nach dem Speichern wird dieser Eintrag an einen Admin zur Prüfung geschickt und erst danach öffentlich sichtbar.
                </p>
                <div className="text-xs bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-blue-800">
                  <p className="font-semibold mb-1">Pflichtfelder für öffentliche Touren:</p>
                  <p>Ort - Startpunkt (Karte) - Distanz - Höhenmeter - Dauer - Schwierigkeit (Mensch und Hund) - Beschreibung - mind. 1 Foto - Jahreszeit</p>
                  <p className="mt-1 text-blue-600">GPX-Datei ist optional.</p>
                </div>
              </div>
            )}
          </section>

          {/* Foto-Einverständnis (nur wenn Fotos + nicht privat) */}
          {form.photos.length > 0 && form.visibility !== "private" && (
            <section className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={photoConsent}
                  onChange={(e) => setPhotoConsent(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded accent-brand-400 shrink-0 cursor-pointer"
                />
                <span className="text-sm text-amber-800 leading-relaxed">
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




