import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { supabase } from "@/lib/supabaseClient";
import { getJournalEntryForDisplay } from "@/lib/journalApi";
import { useAuth } from "@/lib/AuthContext";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, Marker, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  ArrowLeft, MapPin, Ruler, TrendingUp, Clock, Star, AlertTriangle, Dog, User, Users, Globe,
  Loader2, ShieldOff, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getDifficultyLabel, getDifficultyTextColor, getWaterLabel, getWaterTextColor } from "@/lib/difficultyConfig";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const SEASON_LABEL = { spring: "🌸 Frühling", summer: "☀️ Sommer", autumn: "🍂 Herbst", winter: "❄️ Winter" };
const VISIBILITY_INFO = {
  private: { icon: User,  label: "Privat",       color: "text-stone-500" },
  friends: { icon: Users, label: "Freunde",       color: "text-blue-600"  },
  public:  { icon: Globe, label: "Öffentlich",    color: "text-brand-400" },
};

function PublicStatusBadge({ status, rejectionReason }) {
  if (status === "approved") {
    return (
      <Badge className="bg-brand-100 text-brand-600 border border-brand-200 hover:bg-brand-100">
        Öffentlich sichtbar
      </Badge>
    );
  }

  if (status === "rejected") {
    return (
      <div className="space-y-2">
        <Badge className="bg-red-100 text-red-700 border border-red-200 hover:bg-red-100">
          Abgelehnt
        </Badge>
        {rejectionReason ? (
          <p className="text-xs text-red-600">
            Grund: {rejectionReason}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <Badge className="bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-100">
      Wartet auf Prüfung
    </Badge>
  );
}


function PhotoGallery({ photos }) {
  const [idx, setIdx] = useState(0);
  if (!photos?.length) return null;
  return (
    <div className="relative rounded-2xl overflow-hidden bg-stone-100">
      <img src={photos[idx]} alt="" className="w-full h-64 md:h-96 object-cover" />
      {photos.length > 1 && (
        <>
          <button onClick={() => setIdx((i) => (i - 1 + photos.length) % photos.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => setIdx((i) => (i + 1) % photos.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition">
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {photos.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)}
                className={`w-2 h-2 rounded-full transition ${i === idx ? "bg-white" : "bg-white/50"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function JournalDetail() {
  const [searchParams] = useSearchParams();
  const entryId = searchParams.get("id");
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: entry, isLoading } = useQuery({
    queryKey: ["journalEntry", entryId],
    queryFn: () => getJournalEntryForDisplay(entryId),
    enabled: !!entryId,
  });

  const { data: author } = useQuery({
    queryKey: ["profile", entry?.user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, username, full_name, avatar_url")
        .eq("user_id", entry.user_id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    },
    enabled: !!entry?.user_id,
  });

  const { data: dog } = useQuery({
    queryKey: ["dog", entry?.dog_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dogs")
        .select("id, name, breed, photo_url")
        .eq("id", entry.dog_id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    },
    enabled: !!entry?.dog_id,
  });

  const isOwner = user?.id === entry?.user_id;
  const visInfo = VISIBILITY_INFO[entry?.visibility ?? "private"];

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(createPageUrl("Journal"));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <ShieldOff className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <p className="text-stone-600 font-medium mb-2">Eintrag nicht gefunden</p>
          <p className="text-stone-400 text-sm mb-4">Dieser Eintrag existiert nicht oder du hast keinen Zugriff.</p>
          <Link to={createPageUrl("Journal")}>
            <Button variant="outline">Zurück zum Tagebuch</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-brand-50/10 pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 md:py-8">

        {/* Back button */}
        <div className="mb-4 flex items-center justify-between">
          <button onClick={handleBack}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" /> Zurück
            </Button>
          </button>
          {isOwner && (
            <Link to={createPageUrl("AddJournalEntry") + `?id=${entry.id}`}>
              <Button variant="outline" size="sm">Bearbeiten</Button>
            </Link>
          )}
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

          {/* Header */}
          <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-5">
            {/* Author */}
            <div className="flex items-center gap-3 mb-4">
              <img
                src={author?.avatar_url || `https://api.dicebear.com/7.x/thumbs/svg?seed=${entry.user_id}`}
                alt="" className="w-9 h-9 rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-medium text-stone-800">{author?.full_name || author?.username || "Nutzer"}</p>
                <p className="text-xs text-stone-400">
                  {format(new Date(entry.date || entry.created_at), "d. MMMM yyyy", { locale: de })}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <visInfo.icon className={`w-4 h-4 ${visInfo.color}`} />
                <span className={`text-xs font-medium ${visInfo.color}`}>{visInfo.label}</span>
              </div>
            </div>

            {entry.visibility === "public" && isOwner && (
              <div className="mb-4">
                <PublicStatusBadge
                  status={entry.status}
                  rejectionReason={entry.rejection_reason}
                />
              </div>
            )}

            <h1 className="text-xl md:text-2xl font-bold text-stone-800 mb-2">{entry.title}</h1>

            {entry.location && (
              <p className="flex items-center gap-1.5 text-stone-500 text-sm mb-3">
                <MapPin className="w-4 h-4 shrink-0" /> {entry.location}
              </p>
            )}

            {/* Stats */}
            <div className="flex flex-wrap gap-3 text-sm">
              {entry.distance_km && (
                <span className="flex items-center gap-1 text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
                  <Ruler className="w-3.5 h-3.5" /> {entry.distance_km} km
                </span>
              )}
              {entry.elevation_m && (
                <span className="flex items-center gap-1 text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full">
                  <TrendingUp className="w-3.5 h-3.5" /> +{entry.elevation_m} Hm
                </span>
              )}
              {entry.duration_minutes && (
                <span className="flex items-center gap-1 text-stone-600 bg-stone-100 px-2.5 py-1 rounded-full">
                  <Clock className="w-3.5 h-3.5" />
                  {Math.floor(entry.duration_minutes / 60) > 0
                    ? `${Math.floor(entry.duration_minutes / 60)}h ${entry.duration_minutes % 60}min`
                    : `${entry.duration_minutes}min`}
                </span>
              )}
            </div>
          </div>

          {/* Photos */}
          {entry.photos?.length > 0 && <PhotoGallery photos={entry.photos} />}

          {/* Description */}
          {entry.description && (
            <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-stone-600 uppercase tracking-wide mb-3">Beschreibung</h2>
              <p className="text-stone-700 text-sm leading-relaxed whitespace-pre-wrap">{entry.description}</p>
            </div>
          )}

          {/* Details */}
          <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-5 space-y-3">
            <h2 className="text-sm font-semibold text-stone-600 uppercase tracking-wide">Details</h2>

            {entry.rating > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-500 w-28">Bewertung</span>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} className={`w-4 h-4 ${s <= entry.rating ? "fill-yellow-400 text-yellow-400" : "text-stone-200"}`} />
                  ))}
                </div>
              </div>
            )}
            {entry.difficulty && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-500 w-28">👤 Mensch</span>
                <span className={`text-sm font-medium ${getDifficultyTextColor(entry.difficulty)}`}>
                  {getDifficultyLabel(entry.difficulty)}
                </span>
              </div>
            )}
            {entry.dog_difficulty && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-500 w-28">🐕 Hund</span>
                <span className={`text-sm font-medium ${getDifficultyTextColor(entry.dog_difficulty)}`}>
                  {getDifficultyLabel(entry.dog_difficulty)}
                </span>
              </div>
            )}
            {entry.water_available !== null && entry.water_available !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-500 w-28">Wasser</span>
                <span className={`text-sm font-medium ${getWaterTextColor(entry.water_available)}`}>
                  {getWaterLabel(entry.water_available)}
                </span>
              </div>
            )}
            {entry.seasons?.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-stone-500 w-28">Jahreszeit</span>
                <div className="flex gap-1.5 flex-wrap">
                  {entry.seasons.map((s) => (
                    <Badge key={s} variant="secondary" className="text-xs">{SEASON_LABEL[s] || s}</Badge>
                  ))}
                </div>
              </div>
            )}
            {entry.dog_suitable && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-500 w-28">Hundefreundlich</span>
                <span className="text-sm text-brand-400 font-medium">🐕 Ja</span>
              </div>
            )}
            {entry.hazard_notes && (
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-stone-600">{entry.hazard_notes}</p>
              </div>
            )}
          </div>

          {/* Dog */}
          {dog && (
            <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-4 flex items-center gap-3">
              <img
                src={dog.photo_url || `https://api.dicebear.com/7.x/thumbs/svg?seed=${dog.name}`}
                alt={dog.name} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow"
              />
              <div>
                <p className="font-semibold text-stone-800">{dog.name}</p>
                {dog.breed && <p className="text-xs text-stone-400">{dog.breed}</p>}
              </div>
              <Dog className="w-5 h-5 text-stone-300 ml-auto" />
            </div>
          )}

          {/* Map */}
          {entry.latitude && entry.longitude && (
            <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-4">
              <h2 className="text-sm font-semibold text-stone-600 uppercase tracking-wide mb-3">Standort</h2>
              <div className="h-48 rounded-xl overflow-hidden">
                <MapContainer
                  center={[entry.latitude, entry.longitude]}
                  zoom={13}
                  style={{ height: "100%", width: "100%" }}
                  scrollWheelZoom={false}
                  zoomControl={false}
                >
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png" />
                  <Marker position={[entry.latitude, entry.longitude]} />
                  <Circle center={[entry.latitude, entry.longitude]} radius={300} color="#16a34a" fillOpacity={0.1} />
                </MapContainer>
              </div>
            </div>
          )}

        </motion.div>
      </div>
    </div>
  );
}
