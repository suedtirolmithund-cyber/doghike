import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { supabase } from "@/lib/supabaseClient";
import { getJournalEntryForDisplay } from "@/lib/journalApi";
import { useAuth } from "@/lib/AuthContext";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { AnimatePresence, motion } from "framer-motion";
import { TileLayer, Marker, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { configureLeafletDefaultIcon } from "@/lib/leafletDefaultIcon";
import {
  Star, AlertTriangle, Dog, User, Users, Globe,
  Loader2, ShieldOff, ChevronLeft, ChevronRight, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/ui/BackButton";
import { Badge } from "@/components/ui/badge";
import WaterIcon from "@/components/icons/WaterIcon";
import PawLoadingTrail from "@/components/PawLoadingTrail";
import SafeMapContainer from "@/components/map/SafeMapContainer";
import { DifficultyBars } from "@/components/difficulty/DifficultyScale";
import {
  getDifficultyLabel,
  getDifficultyLevel,
  getSeasonBadgeClass,
  getSeasonIcon,
  getSeasonLabel,
  getWaterLabel,
  getWaterTextColor,
  TOUR_ICONS,
} from "@/lib/difficultyConfig";
import { formatDurationHours } from "@/lib/duration";
import { getAvatarDataUrl } from "@/lib/fallbackImages";


configureLeafletDefaultIcon();


const VISIBILITY_INFO = {
  private: { icon: User,  label: "Privat",       color: "text-slate-500" },
  friends: { icon: Users, label: "Freunde",       color: "text-brand-600"  },
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
        <Badge className="bg-brand-100 text-brand-500 border border-brand-100 hover:bg-brand-100">
          Abgelehnt
        </Badge>
        {rejectionReason ? (
          <p className="text-xs text-brand-400">
            Grund: {rejectionReason}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <Badge className="bg-brand-100 text-brand-600 border border-brand-100 hover:bg-brand-100">
      Wartet auf Prüfung
    </Badge>
  );
}

function preloadPhoto(url) {
  if (!url) return;
  const image = new Image();
  image.src = url;
}

function PhotoGallery({ photos }) {
  const [idx, setIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isCurrentPhotoLoading, setIsCurrentPhotoLoading] = useState(true);
  const lightboxScrollerRef = useRef(null);
  const lightboxDragRef = useRef({
    isDragging: false,
    pointerId: null,
    startX: 0,
    scrollLeft: 0,
  });

  useEffect(() => {
    if (!photos?.length) return;
    setIsCurrentPhotoLoading(true);
  }, [idx, photos]);

  useEffect(() => {
    setIdx(0);
    setCurrentPhotoIndex(0);
  }, [photos]);

  useEffect(() => {
    if (!photos?.length) return;
    if (photos.length > 1) {
      preloadPhoto(photos[(idx + 1) % photos.length]);
    }
  }, [idx, photos]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const scroller = lightboxScrollerRef.current;
    if (!scroller) return;

    requestAnimationFrame(() => {
      scroller.scrollTo({
        left: currentPhotoIndex * scroller.clientWidth,
        behavior: "auto",
      });
    });
  }, [currentPhotoIndex, lightboxOpen]);

  if (!photos?.length) return null;

  const openPhoto = (index) => {
    setIdx(index);
    setCurrentPhotoIndex(index);
    setLightboxOpen(true);
  };

  const showPhoto = (nextIndex) => {
    const normalizedIndex = (nextIndex + photos.length) % photos.length;
    setIdx(normalizedIndex);
    setCurrentPhotoIndex(normalizedIndex);
  };

  const showLightboxPhoto = (nextIndex) => {
    const normalizedIndex = (nextIndex + photos.length) % photos.length;
    setCurrentPhotoIndex(normalizedIndex);
    const scroller = lightboxScrollerRef.current;
    if (scroller) {
      scroller.scrollTo({
        left: normalizedIndex * scroller.clientWidth,
        behavior: "smooth",
      });
    }
  };

  const handleLightboxScroll = () => {
    const scroller = lightboxScrollerRef.current;
    if (!scroller?.clientWidth) return;
    const nextIndex = Math.round(scroller.scrollLeft / scroller.clientWidth);
    if (nextIndex >= 0 && nextIndex < photos.length) {
      setCurrentPhotoIndex(nextIndex);
    }
  };

  const handleLightboxWheel = (event) => {
    const scroller = lightboxScrollerRef.current;
    if (!scroller || photos.length <= 1) return;

    const delta =
      Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ? event.deltaX
        : event.deltaY;
    if (!delta) return;

    event.preventDefault();
    scroller.scrollLeft += delta;
  };

  const handleLightboxPointerDown = (event) => {
    if (photos.length <= 1 || event.pointerType === "touch") return;
    const scroller = lightboxScrollerRef.current;
    if (!scroller) return;

    lightboxDragRef.current = {
      isDragging: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollLeft: scroller.scrollLeft,
    };
    scroller.setPointerCapture?.(event.pointerId);
  };

  const handleLightboxPointerMove = (event) => {
    const drag = lightboxDragRef.current;
    if (!drag.isDragging || drag.pointerId !== event.pointerId) return;

    const scroller = lightboxScrollerRef.current;
    if (!scroller) return;

    event.preventDefault();
    scroller.scrollLeft = drag.scrollLeft - (event.clientX - drag.startX);
  };

  const stopLightboxDrag = (event) => {
    const drag = lightboxDragRef.current;
    if (!drag.isDragging || drag.pointerId !== event.pointerId) return;

    const scroller = lightboxScrollerRef.current;
    if (scroller?.hasPointerCapture?.(event.pointerId)) {
      scroller.releasePointerCapture(event.pointerId);
    }

    lightboxDragRef.current = {
      isDragging: false,
      pointerId: null,
      startX: 0,
      scrollLeft: 0,
    };
  };

  return (
    <>
      <div className="space-y-3">
        <div className="relative overflow-hidden rounded-[22px] border border-brand-100/80 bg-brand-100/80 shadow-[0_12px_28px_rgba(168,0,60,0.08)]">
          {isCurrentPhotoLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-brand-50/70 backdrop-blur-[1px]">
              <Loader2 className="h-5 w-5 animate-spin text-brand-400" />
              <p className="text-xs font-medium text-slate-500">Foto wird geladen...</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => openPhoto(idx)}
            className="group block w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
            aria-label={`Foto ${idx + 1} groß öffnen`}
          >
            <img
              src={photos[idx]}
              alt={`Foto ${idx + 1}`}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              onLoad={() => setIsCurrentPhotoLoading(false)}
              onError={() => setIsCurrentPhotoLoading(false)}
              className="h-72 w-full object-cover transition-transform duration-700 group-hover:scale-[1.02] sm:h-80 md:h-[420px]"
            />
          </button>
          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => showPhoto(idx - 1)}
                className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/55"
                aria-label="Vorheriges Foto"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => showPhoto(idx + 1)}
                className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/55"
                aria-label="Nächstes Foto"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/25 px-2 py-1 backdrop-blur-sm">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => showPhoto(i)}
                    aria-label={`Foto ${i + 1} anzeigen`}
                    className={`h-2.5 w-2.5 rounded-full transition ${i === idx ? "bg-white" : "bg-white/50"}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {photos.length > 1 && (
          <div className="doghike-glass-card p-4">
            <h2 className="doghike-card-title mb-3">Fotos</h2>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {photos.map((photo, index) => (
                <button
                  type="button"
                  key={`${photo}-${index}`}
                  onClick={() => openPhoto(index)}
                  className={`aspect-square overflow-hidden rounded-xl border bg-brand-50/70 p-0 transition-all hover:ring-2 hover:ring-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 ${
                    index === idx ? "border-brand-300 ring-2 ring-brand-200" : "border-brand-100/70"
                  }`}
                  aria-label={`Foto ${index + 1} groß öffnen`}
                >
                  <img
                    src={photo}
                    alt={`Foto ${index + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-110"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95"
          >
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="absolute left-4 z-30 rounded-full bg-white/12 p-2 text-white/80 backdrop-blur-sm hover:bg-white/20 hover:text-white"
              style={{ top: "max(1rem, env(safe-area-inset-top))" }}
              aria-label="Fotoansicht schließen"
            >
              <X className="h-8 w-8" />
            </button>

            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => showLightboxPhoto(currentPhotoIndex - 1)}
                  className="absolute left-4 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/12 text-white/85 shadow-lg backdrop-blur-sm transition hover:bg-white/22 hover:text-white md:flex"
                  aria-label="Vorheriges Foto"
                >
                  <ChevronLeft className="h-7 w-7" />
                </button>
                <button
                  type="button"
                  onClick={() => showLightboxPhoto(currentPhotoIndex + 1)}
                  className="absolute right-4 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/12 text-white/85 shadow-lg backdrop-blur-sm transition hover:bg-white/22 hover:text-white md:flex"
                  aria-label="Nächstes Foto"
                >
                  <ChevronRight className="h-7 w-7" />
                </button>
              </>
            )}

            <div
              ref={lightboxScrollerRef}
              className="flex h-full cursor-grab snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth touch-pan-x active:cursor-grabbing"
              onScroll={handleLightboxScroll}
              onWheel={handleLightboxWheel}
              onPointerDown={handleLightboxPointerDown}
              onPointerMove={handleLightboxPointerMove}
              onPointerUp={stopLightboxDrag}
              onPointerCancel={stopLightboxDrag}
            >
              {photos.map((photo, index) => (
                <div
                  key={`${photo}-lightbox-${index}`}
                  className="flex h-full w-screen flex-none snap-center items-center justify-center px-4 py-16 sm:px-8"
                >
                  <img
                    src={photo}
                    alt={`Foto ${index + 1}`}
                    draggable={false}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ))}
            </div>

            {photos.length > 1 && (
              <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1 text-sm font-semibold text-white/80 backdrop-blur-sm">
                {currentPhotoIndex + 1} / {photos.length}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
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
        .from("public_profiles")
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

  const selectedDogIds = useMemo(() => {
    if (!entry) return [];
    if (Array.isArray(entry.dog_ids) && entry.dog_ids.length > 0) {
      return [...new Set(entry.dog_ids.filter(Boolean))];
    }
    return entry.dog_id ? [entry.dog_id] : [];
  }, [entry]);

  const { data: selectedDogs = [] } = useQuery({
    queryKey: ["journalDogs", selectedDogIds.join(",")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dogs")
        .select("id, name, breed, photo_url")
        .in("id", selectedDogIds);

      if (error) {
        throw error;
      }

      const dogMap = Object.fromEntries((data ?? []).map((dog) => [dog.id, dog]));
      return selectedDogIds.map((dogId) => dogMap[dogId]).filter(Boolean);
    },
    enabled: selectedDogIds.length > 0,
  });

  const isOwner = user?.id === entry?.user_id;
  const visInfo = VISIBILITY_INFO[entry?.visibility ?? "private"];
  const fallbackBackUrl = createPageUrl("Journal");
  const authorDisplayName =
    entry?.visibility === "public" && !isOwner
      ? author?.username || "DogTrails-Mitglied"
      : author?.full_name || author?.username || "Nutzer";

  const handleBack = () => {
    if (typeof window !== "undefined") {
      const previousPath = window.sessionStorage.getItem("doghike:last-path");

      if (
        previousPath &&
        previousPath !== window.location.pathname + window.location.search + window.location.hash &&
        previousPath.startsWith("/") &&
        !previousPath.startsWith(createPageUrl("JournalDetail"))
      ) {
        navigate(previousPath);
        return;
      }
    }

    navigate(fallbackBackUrl);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400" />
          <p className="mt-3 text-slate-500">Lädt...</p>
          <PawLoadingTrail />
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <ShieldOff className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 font-medium mb-2">Eintrag nicht gefunden</p>
          <p className="text-slate-400 text-sm mb-4">Dieser Eintrag existiert nicht oder du hast keinen Zugriff.</p>
          <BackButton to={fallbackBackUrl} variant="outline" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50/10 pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 md:py-8">

        {/* Back button */}
        <div className="mb-4 flex items-center justify-between">
          <BackButton onClick={handleBack} />
          {isOwner && (
            <Link to={createPageUrl("AddJournalEntry") + `?id=${entry.id}`}>
              <Button variant="outline" size="sm">Bearbeiten</Button>
            </Link>
          )}
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

          {/* Header */}
          <div className="doghike-glass-card p-5">
            {/* Author */}
            <div className="flex items-center gap-3 mb-4">
              <img
                src={author?.avatar_url || getAvatarDataUrl(entry.user_id)}
                alt="" className="w-9 h-9 rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-medium text-slate-900">{authorDisplayName}</p>
                <p className="text-xs text-slate-400">
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

            <h1 className="doghike-page-title mb-2">{entry.title}</h1>

            {entry.location && (
              <p className="doghike-card-subtitle mb-3 flex items-center gap-1.5">
                <span className="text-sm leading-none shrink-0">{TOUR_ICONS.location}</span> {entry.location}
              </p>
            )}

            {/* Stats */}
            <div className="flex flex-wrap gap-3 text-sm">
              {entry.distance_km && (
                <span className="flex items-center gap-1 text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-100">
                  <span className="text-sm leading-none">{TOUR_ICONS.distance}</span> {entry.distance_km} km
                </span>
              )}
              {entry.elevation_m && (
                <span className="flex items-center gap-1 text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full">
                  <span className="text-sm leading-none">{TOUR_ICONS.elevation}</span> +{entry.elevation_m} Hm
                </span>
              )}
              {entry.duration_minutes && (
                <span className="flex items-center gap-1 text-slate-600 bg-brand-100/80 px-2.5 py-1 rounded-full">
                  <span className="text-sm leading-none">{TOUR_ICONS.duration}</span>
                  {formatDurationHours(entry.duration_minutes)}
                </span>
              )}
            </div>
          </div>

          {/* Photos */}
          {entry.photos?.length > 0 && <PhotoGallery photos={entry.photos} />}

          {/* Description */}
          {entry.description && (
            <div className="doghike-glass-card p-5">
              <h2 className="doghike-card-title mb-3">Beschreibung</h2>
              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{entry.description}</p>
            </div>
          )}

          {/* Details */}
          <div className="doghike-glass-card p-5 space-y-3">
            <h2 className="doghike-card-title">Details</h2>

            {entry.rating > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 w-28">Bewertung</span>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} className={`w-4 h-4 ${s <= entry.rating ? "fill-brand-100 text-brand-100" : "text-brand-100"}`} />
                  ))}
                </div>
              </div>
            )}
            {entry.difficulty && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 w-28">{TOUR_ICONS.human} Mensch</span>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#A8003C]">
                  <DifficultyBars level={entry.difficulty} type="human" />
                  {getDifficultyLabel(entry.difficulty)} · {getDifficultyLevel(entry.difficulty)}/5
                </span>
              </div>
            )}
            {entry.dog_difficulty && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 w-28">{TOUR_ICONS.dog} Hund</span>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#7C3020]">
                  <DifficultyBars level={entry.dog_difficulty} type="dog" />
                  {getDifficultyLabel(entry.dog_difficulty)} · {getDifficultyLevel(entry.dog_difficulty)}/5
                </span>
              </div>
            )}
            {entry.water_available !== null && entry.water_available !== undefined && (
              <div className="flex items-center gap-2">
                <span className="flex w-28 items-center gap-1 text-xs text-slate-500">
                  <WaterIcon value="little" /> Wasser
                </span>
                <span className={`text-sm font-medium ${getWaterTextColor(entry.water_available)}`}>
                    <WaterIcon value={entry.water_available} /> {getWaterLabel(entry.water_available)}
                </span>
              </div>
            )}
            {entry.seasons?.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-500 w-28">{TOUR_ICONS.season} Jahreszeit</span>
                <div className="flex gap-1.5 flex-wrap">
                  {entry.seasons.map((s) => (
                    <Badge key={s} variant="secondary" className={`border text-xs ${getSeasonBadgeClass(s)}`}>
                      {getSeasonIcon(s)} {getSeasonLabel(s) || s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {entry.dog_suitable && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 w-28">Hundefreundlich</span>
                <span className="text-sm text-brand-400 font-medium">{TOUR_ICONS.dog} Ja</span>
              </div>
            )}
            {(entry.grazing_animals || entry.muzzle_recommended) && (
              <div className="flex items-start gap-2 flex-wrap">
                <span className="text-xs text-slate-500 w-28">Hinweise</span>
                <div className="flex flex-wrap gap-1.5">
                  {entry.grazing_animals && (
                    <Badge variant="secondary" className="border border-brand-100 bg-brand-50/70 text-brand-700 text-xs">
                      {TOUR_ICONS.grazing} Weidetiere
                    </Badge>
                  )}
                  {entry.muzzle_recommended && (
                    <Badge variant="secondary" className="border border-brand-100 bg-brand-50/70 text-brand-700 text-xs">
                      {TOUR_ICONS.muzzle} Maulkorb
                    </Badge>
                  )}
                </div>
              </div>
            )}
            {isOwner && Array.isArray(entry.dog_mood_tags) && entry.dog_mood_tags.length > 0 && (
              <div className="flex items-start gap-2 flex-wrap">
                <span className="text-xs text-slate-500 w-28">Hund heute</span>
                <div className="flex flex-wrap gap-1.5">
                  {entry.dog_mood_tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="border border-brand-100 bg-brand-50/70 text-brand-700 text-xs">
                      {TOUR_ICONS.dog} {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {entry.hazard_notes && (
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-600">{entry.hazard_notes}</p>
              </div>
            )}
          </div>

          {/* Dog */}
          {selectedDogs.length > 0 && (
            <div className="doghike-glass-card p-4">
              <div className="mb-3 flex items-center gap-2">
                <Dog className="w-5 h-5 text-slate-300" />
                <h2 className="font-semibold text-slate-900">
                  {selectedDogs.length === 1 ? "Hund dabei" : "Hunde dabei"}
                </h2>
              </div>
              <div className="space-y-3">
                {selectedDogs.map((dog) => (
                  <div key={dog.id} className="flex items-center gap-3">
                    <img
                      src={dog.photo_url || getAvatarDataUrl(dog.name)}
                      alt={dog.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow"
                    />
                    <div>
                      <p className="font-semibold text-slate-900">{dog.name}</p>
                      {dog.breed && <p className="text-xs text-slate-400">{dog.breed}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Map */}
          {entry.latitude && entry.longitude && (
            <div className="doghike-glass-card p-4">
              <h2 className="doghike-card-title mb-3">Standort</h2>
              <div className="h-48 rounded-xl overflow-hidden">
                <SafeMapContainer
                  resetKey={`journal-detail-${entry.id}-${entry.latitude}-${entry.longitude}`}
                  center={[entry.latitude, entry.longitude]}
                  zoom={13}
                  style={{ height: "100%", width: "100%" }}
                  scrollWheelZoom={false}
                  zoomControl={false}
                >
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png" />
                  <Marker position={[entry.latitude, entry.longitude]} />
                  <Circle center={[entry.latitude, entry.longitude]} radius={300} color="#A8003C" fillOpacity={0.1} />
                </SafeMapContainer>
              </div>
            </div>
          )}

        </motion.div>
      </div>
    </div>
  );
}
