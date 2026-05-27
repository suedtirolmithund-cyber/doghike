import { useEffect, useMemo, useRef, useState } from "react";
import { getAllHikes } from "@/api/sheetsClient";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Edit, Trash2, ChevronLeft, ChevronRight, X, Share2, Check, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import RouteProfile from "@/components/hikes/RouteProfile";
import SmartRecommendations from "@/components/hikes/SmartRecommendations";
import HikeWeatherInfo from "@/components/weather/HikeWeatherInfo";
import InteractiveHikeMap from "@/components/hikes/InteractiveHikeMap";
import SaveButton from "@/components/hikes/SaveButton";
import OfflineDownload from "@/components/hikes/OfflineDownload";
import CommentSection from "@/components/community/CommentSection";
import RatingSection from "@/components/community/RatingSection";
import ExpandableText from "@/components/ExpandableText";
import PremiumGate from "@/components/hikes/PremiumGate";
import WaterIcon from "@/components/icons/WaterIcon";
import { DifficultyBars } from "@/components/difficulty/DifficultyScale";
import { supabase } from "@/lib/supabaseClient";
import { TOUR_ICONS, getDifficultyLabel, getDifficultyLevel, getSeasonIcon, getSeasonLabel, getWaterBadgeClass, getWaterLabel, normalizeSeasonValues } from "@/lib/difficultyConfig";
import { PREMIUM_FEATURES_ENABLED } from "@/lib/premiumConfig";
import { formatDurationHours } from "@/lib/duration";
import { getAvatarDataUrl } from "@/lib/fallbackImages";
import { getDisplayImageUrl } from "@/lib/imageProxy";
import { toast } from "sonner";

function getCountryLabel(country) {
  if (country === "italy") return "Italien";
  if (country === "austria") return "Österreich";
  if (country === "germany") return "Deutschland";
  if (country === "switzerland") return "Schweiz";
  if (country === "spain") return "Spanien";
  if (country === "croatia") return "Kroatien";
  if (country === "slovenia") return "Slowenien";
  if (country === "other") return "Anderes";
  return country || null;
}

function isManagedPublicHikePhoto(value) {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("public-hikes/")) return true;
  if (trimmed.startsWith("journal/public-hikes/")) return true;
  return /\/storage\/v1\/object\/(?:public|sign)\/journal\/public-hikes\//.test(trimmed);
}

const humanDifficultyChipClass =
  "!border-[#D4547A]/60 !bg-[#FFF3F7] !text-[#7C3020]";
const dogDifficultyChipClass =
  "!border-[#F9C030] !bg-[#FFF8E0] !text-[#7C3020]";
const detailStatChipClass =
  "doghike-stat-chip min-h-[52px] min-w-0 justify-center gap-2 px-2.5 py-2 text-center sm:min-h-[58px] sm:px-3 sm:py-2 lg:min-h-[60px] lg:px-3.5 lg:py-2.5";
const detailStatIconClass =
  "shrink-0 text-base leading-none sm:text-lg";
const detailStatTextClass =
  "min-w-0 flex-1 text-center";
const detailStatValueClass =
  "text-[13px] font-bold leading-tight text-[#7C3020] sm:text-sm";
const detailStatLabelClass =
  "text-[11px] leading-tight text-[#C07820] sm:text-xs";
const detailDifficultyRowClass =
  "flex min-w-0 flex-wrap items-center justify-center gap-1 sm:gap-1.5";
const weatherEmojis = {
  sunny: "☀️",
  cloudy: "☁️",
  partly_cloudy: "⛅",
  rainy: "🌧️",
  snowy: "❄️",
  foggy: "🌫️"
};

export default function HikeDetail() {
  const [searchParams] = useSearchParams();
  const hikeId = searchParams.get("id");
  const hikeSource = searchParams.get("source") ?? "sheets";
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [heroPhotoIndex, setHeroPhotoIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const lightboxScrollerRef = useRef(null);
  const normalizedHikeId = hikeId ? String(hikeId) : null;
  const prefetchedHike = location.state?.hike;
  const initialHike = useMemo(() => {
    if (!prefetchedHike || !normalizedHikeId) return undefined;

    const prefetchedSource = prefetchedHike._source ?? "sheets";
    if (prefetchedSource !== hikeSource) return undefined;

    if (hikeSource === "sheets") {
      const prefetchedDetailId = String(
        prefetchedHike._public_hike_id ?? prefetchedHike.route_id ?? prefetchedHike.id ?? ""
      );
      return prefetchedDetailId === normalizedHikeId ? prefetchedHike : undefined;
    }

    return String(prefetchedHike.id ?? "") === normalizedHikeId ? prefetchedHike : undefined;
  }, [prefetchedHike, normalizedHikeId, hikeSource]);
  const fallbackBackUrl = hikeSource === "journal" ? createPageUrl("Journal") : createPageUrl("Hikes");
  const handleBack = () => {
    if (typeof window !== "undefined") {
      const previousPath = window.sessionStorage.getItem("doghike:last-path");
      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;

      if (
        previousPath &&
        previousPath !== currentPath &&
        !previousPath.startsWith(createPageUrl("HikeDetail"))
      ) {
        navigate(previousPath);
        return;
      }
    }

    navigate(fallbackBackUrl);
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: hike?.trail_name, url });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Link kopiert!");
        return;
      }

      throw new Error("clipboard_unavailable");
    } catch (error) {
      if (error?.name === "AbortError") {
        return;
      }

      toast.error("Der Link konnte gerade nicht geteilt oder kopiert werden. Bitte versuche es noch einmal.");
    }
  };

  const { data: hike, isLoading } = useQuery({
    queryKey: ["hike", hikeSource, hikeId],
    initialData: initialHike,
    queryFn: async () => {
      const cachedHikes = queryClient.getQueryData(["allHikes"]);
      const hikes = Array.isArray(cachedHikes) && cachedHikes.length > 0
        ? cachedHikes
        : await queryClient.fetchQuery({
            queryKey: ["allHikes"],
            queryFn: getAllHikes,
            staleTime: 5 * 60_000,
          });
      return hikes.find((h) => {
        if ((h._source ?? "sheets") !== hikeSource) return false;

        if (hikeSource === "sheets") {
          return String(h.route_id ?? h._public_hike_id ?? "") === normalizedHikeId || String(h.id) === normalizedHikeId;
        }

        return String(h.id) === normalizedHikeId;
      });
    },
    enabled: !!normalizedHikeId,
    staleTime: 5 * 60_000,
  });

  const { user: currentUser, isAdmin } = useAuth();

  const detailPhotoSource = useMemo(() => {
    if (Array.isArray(hike?.photos) && hike.photos.length > 0) {
      if (hike?._source === "sheets" && hike?._public_hike_id) {
        const managedPhotos = hike.photos.filter(isManagedPublicHikePhoto);
        const otherPhotos = hike.photos.filter((photo) => !isManagedPublicHikePhoto(photo));
        return managedPhotos.length > 0 ? [...managedPhotos, ...otherPhotos] : hike.photos;
      }
      return hike.photos;
    }
    if (typeof hike?.image === "string" && hike.image.trim()) return [hike.image.trim()];
    if (Array.isArray(hike?._photo_references) && hike._photo_references.length > 0) return hike._photo_references;
    return [];
  }, [hike?._photo_references, hike?.image, hike?.photos]);

  const heroPhotosKey = useMemo(
    () => detailPhotoSource.filter(Boolean).join("|"),
    [detailPhotoSource]
  );

  useEffect(() => {
    setHeroPhotoIndex(0);
  }, [heroPhotosKey]);

  const { data: dogs = [] } = useQuery({
    queryKey: ["dogs", currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const { getDogs } = await import("@/lib/profilesApi");
      return getDogs(currentUser.id);
    },
    enabled: !!currentUser?.id,
  });

  const { data: currentProfile } = useQuery({
    queryKey: ["profile_summary", currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("is_premium, premium_current_period_end")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    },
    enabled: !!currentUser?.id,
  });

  const { data: adminEditablePublicHikeId = null } = useQuery({
    queryKey: ["adminEditablePublicHikeId", hike?.trail_name, hike?.location],
    enabled: !!isAdmin && hike?._source === "sheets" && !hike?._public_hike_id && !!hike?.trail_name,
    queryFn: async () => {
      let query = supabase
        .from("public_hikes")
        .select("id")
        .eq("title", hike.trail_name);

      if (hike.location) {
        query = query.eq("location", hike.location);
      }

      const { data, error } = await query.maybeSingle();
      if (error) {
        console.error("[HikeDetail] admin public_hike fallback lookup error:", error.message);
        return null;
      }

      return data?.id ? String(data.id) : null;
    },
  });

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
    // The selected index is set before opening. After that, scrolling updates it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxOpen]);

  // Sheets hikes are read-only
  const isOwnHike = false;

  // Journal hikes created by the current user can be edited/deleted via Supabase
  const isOwnJournalHike = hike?._source === "journal" && !!currentUser?.id && currentUser.id === hike?._user_id;

  const deleteJournalEntryMutation = useMutation({
    mutationFn: async () => {
      const { deleteJournalEntry } = await import("@/lib/journalApi");
      return deleteJournalEntry(hike?._journal_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal", currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ["allHikes"] });
      queryClient.invalidateQueries({ queryKey: ["journalEntry"] });
      queryClient.invalidateQueries({ queryKey: ["savedHikes", currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ["notifications", currentUser?.id] });
      navigate(createPageUrl("Hikes"));
    },
    onError: () => {
      toast.error("Die Wanderung konnte gerade nicht gelöscht werden. Bitte versuche es noch einmal.");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50/20">
        {/* Hero skeleton */}
        <div className="h-64 md:h-80 lg:h-96 bg-slate-200 animate-pulse" />
        <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <div className="h-7 w-2/3 rounded-lg bg-slate-200 animate-pulse" />
            <div className="h-4 w-1/3 rounded-lg bg-slate-100 animate-pulse" />
          </div>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[1,2,3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
          {/* Description */}
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-slate-100 animate-pulse" />
            <div className="h-4 w-5/6 rounded bg-slate-100 animate-pulse" />
            <div className="h-4 w-4/6 rounded bg-slate-100 animate-pulse" />
          </div>
          {/* Map placeholder */}
          <div className="h-48 rounded-xl bg-slate-200 animate-pulse" />
        </div>
      </div>
    );
  }


  if (!hike) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50/20 flex items-center justify-center px-4">
        <div className="doghike-glass-card p-8 text-center">
          <p className="text-xl text-slate-700 mb-4">Tour nicht gefunden</p>
          <Link to={fallbackBackUrl}>
            <Button className="bg-brand-400 text-white hover:bg-brand-600">Zurück zu den Touren</Button>
          </Link>
        </div>
      </div>
    );
  }
  // Premium gate: admins may inspect premium hikes, but downloads still require active Premium.
  const isPremiumContent = PREMIUM_FEATURES_ENABLED && hike.is_premium === true;
  const isPremiumHike = isPremiumContent && !isAdmin && !isOwnHike;
  const premiumEndDate = currentProfile?.premium_current_period_end
    ? new Date(currentProfile.premium_current_period_end)
    : null;
  const userHasPremium = isAdmin || (
    currentProfile?.is_premium === true
    && (!premiumEndDate || premiumEndDate.getTime() > Date.now())
  );
  const showPremiumPreviewOnly = isPremiumHike && !userHasPremium;

  const hikeDogs = dogs.filter(d => hike.dogs?.includes(d.id));
  const photos = detailPhotoSource.filter(Boolean);
  const coverPhoto = heroPhotoIndex >= 0 ? photos[heroPhotoIndex] || "/splash/autumn-hero.jpg" : "/splash/autumn-hero.jpg";
  const heroPreviewPhoto = getDisplayImageUrl(coverPhoto, { width: 1600, quality: 80 }) || coverPhoto;
  const detailId = hike?._source === "sheets" && hike?._public_hike_id
    ? hike.route_id || String(hike._public_hike_id)
    : hike.id;
  const adminEditPublicHikeId =
    hike?._public_hike_id ? String(hike._public_hike_id) : adminEditablePublicHikeId;
  const communityHikeId = hike?._source === "sheets"
    ? String(hike?._public_hike_id ?? hike?.route_id ?? hike?.id ?? "")
    : hike?.id;
  const communityHikeAliases = hike?._source === "sheets"
    ? Array.from(
        new Set(
          [hike?.id, hike?._public_hike_id, hike?.route_id]
            .map((value) => (value == null ? null : String(value)))
            .filter(Boolean)
        )
      )
    : communityHikeId
      ? [String(communityHikeId)]
      : [];
  
  const countryLabel = getCountryLabel(hike.country);
  const seasonValues = normalizeSeasonValues(hike?.seasons, hike?.season);

  const openGalleryPhoto = (index) => {
    setCurrentPhotoIndex(index);
    setLightboxOpen(true);
  };
  const scrollLightboxToIndex = (nextIndex) => {
    if (!photos.length) return;

    const normalizedIndex = (nextIndex + photos.length) % photos.length;
    setCurrentPhotoIndex(normalizedIndex);

    const scroller = lightboxScrollerRef.current;
    if (!scroller) return;

    scroller.scrollTo({
      left: normalizedIndex * scroller.clientWidth,
      behavior: "smooth",
    });
  };
  const showPreviousLightboxPhoto = () => scrollLightboxToIndex(currentPhotoIndex - 1);
  const showNextLightboxPhoto = () => scrollLightboxToIndex(currentPhotoIndex + 1);
  const handleLightboxScroll = () => {
    const scroller = lightboxScrollerRef.current;
    if (!scroller?.clientWidth) return;

    const nextIndex = Math.round(scroller.scrollLeft / scroller.clientWidth);
    if (nextIndex >= 0 && nextIndex < photos.length) {
      setCurrentPhotoIndex((currentIndex) => (currentIndex === nextIndex ? currentIndex : nextIndex));
    }
  };
  const canComment = hike?._source === "sheets" || hike?.visibility === "public";
  const canDownloadPdf = (hike?._source === "sheets" || isOwnJournalHike || hike?.visibility === "public")
    && (!isPremiumContent || userHasPremium);
  const includePhotosInPdf = hike?._source === "sheets" || isOwnJournalHike;
  const previewNotes = hike.notes
    ? hike.notes.length > 360
      ? `${hike.notes.slice(0, 360).trim()}...`
      : hike.notes
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50/20 pb-24 md:pb-8">
      {/* Hero Image */}
      <div className="relative h-[50vh] overflow-hidden">
        <img
          src={heroPreviewPhoto}
          alt={hike.trail_name}
          onError={() => {
            setHeroPhotoIndex((currentIndex) => {
              const nextIndex = currentIndex + 1;
              return nextIndex < photos.length ? nextIndex : -1;
            });
          }}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        <div className="absolute left-4 right-4 top-4 flex flex-col gap-2 sm:left-6 sm:right-6 sm:top-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="self-start">
            <Button
              type="button"
              variant="ghost"
              onClick={handleBack}
              className="h-10 bg-white/10 px-3 text-sm backdrop-blur-sm text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 self-start sm:justify-end">
            {(isOwnJournalHike || (isAdmin && hike?._source === "sheets" && adminEditPublicHikeId)) && (
                <>
                  <Link
                    to={
                      isOwnJournalHike
                        ? createPageUrl("AddJournalEntry") + `?id=${hike?._journal_id}`
                      : createPageUrl("EditPublicHike") + `?id=${encodeURIComponent(adminEditPublicHikeId ?? "")}`
                    }
                  >
                  <Button variant="ghost" className="h-10 bg-white/10 px-3 text-sm backdrop-blur-sm text-white hover:bg-white/20">
                    <Edit className="w-4 h-4 mr-1" />
                    Bearbeiten
                  </Button>
                </Link>
                {isOwnJournalHike && <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" className="h-10 bg-brand-500/20 px-3 text-sm backdrop-blur-sm text-white hover:bg-brand-500/40">
                      <Trash2 className="w-4 h-4 mr-1" />
                      Löschen
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Tour löschen?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Dies wird "{hike.trail_name}" dauerhaft löschen. Diese Aktion kann nicht rückgängig gemacht werden.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteJournalEntryMutation.mutate()}
                        className="bg-brand-400 hover:bg-brand-500"
                      >
                        Löschen
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>}
              </>
            )}
          </div>
        </div>

        <div className="absolute bottom-6 left-4 right-4 sm:bottom-8 sm:left-8 sm:right-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {hike?._source === "journal" && (hike.author_username || hike.dog_name) && (
              <div className="flex items-center gap-2 mb-3">
                {hike.author_avatar && (
                  <img src={hike.author_avatar} alt="" className="w-7 h-7 rounded-full object-cover border-2 border-white/50" />
                )}
                <p className="text-sm text-white/90">
                  {hike.dog_name && <span>🐾 {hike.dog_name} · </span>}
                  {hike.author_username && <span>@{hike.author_username}</span>}
                </p>
              </div>
            )}

            <h1 className="mb-2 text-3xl font-light leading-tight text-white sm:text-4xl md:text-5xl">{hike.trail_name}</h1>
            <div className="flex flex-wrap items-center gap-2.5 text-white/85 sm:gap-3">
              <div className="flex min-w-0 items-center gap-2 text-sm font-medium sm:text-base md:text-lg">
                <span>{TOUR_ICONS.location}</span>
                <span className="break-words">{hike.location || "Dolomites"}</span>
              </div>
              <SaveButton
                hikeId={communityHikeId}
                hikeSource={hike?._source === "journal" ? "journal" : "sheets"}
              />
              <button
                onClick={handleShare}
                title="Tour teilen"
                className="flex items-center gap-1 px-2 py-1 rounded-full text-white/70 hover:text-white transition-all"
              >
                {copied
                  ? <Check className="w-5 h-5 text-brand-400" />
                  : <Share2 className="w-5 h-5" />}
              </button>
              {countryLabel && <span className="text-sm sm:text-base">{countryLabel}</span>}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">


        {/* Interactive Map - Full Width */}
        {hike.latitude && hike.longitude && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.11 }}
            className="mb-10"
          >
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50/80 px-3 py-1.5 text-sm font-semibold text-brand-800">
                  <MapPin className="h-4 w-4" />
                  Ausgangspunkt: {hike.location || hike.trail_name}
                </div>
                <h2 className="doghike-section-title">
                  {hike.route_coordinates?.length > 0 ? "Karte & Routenverlauf" : "Karte"}
                </h2>
              </div>
              <div className="flex justify-start sm:justify-end">
                <OfflineDownload
                  hike={hike}
                  dogs={hikeDogs}
                  allowDownload={canDownloadPdf}
                  includePhotos={includePhotosInPdf}
                />
              </div>
            </div>
            <InteractiveHikeMap
              latitude={hike.latitude}
              longitude={hike.longitude}
              routeCoordinates={hike.route_coordinates}
              trailName={hike.trail_name}
              location={hike.location}
            />
          </motion.div>
        )}

        {/* Stats Row - below map */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8 md:mb-9"
        >
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3 xl:grid-cols-4">
          {countryLabel && (
            <div className={detailStatChipClass}>
              <span className={detailStatIconClass}>{TOUR_ICONS.country}</span>
              <div className={detailStatTextClass}>
                <div className={detailStatValueClass}>{countryLabel}</div>
                <div className={detailStatLabelClass}>Land</div>
              </div>
            </div>
          )}
          {hike.duration_minutes && (
            <div className={detailStatChipClass}>
              <span className={detailStatIconClass}>{TOUR_ICONS.duration}</span>
              <div className={detailStatTextClass}>
                <div className={detailStatValueClass}>
                  {formatDurationHours(hike.duration_minutes)}
                </div>
                <div className={detailStatLabelClass}>Gehzeit</div>
              </div>
            </div>
          )}
          {hike.distance_km && (
            <div className={detailStatChipClass}>
              <span className={detailStatIconClass}>{TOUR_ICONS.distance}</span>
              <div className={detailStatTextClass}>
                <div className={detailStatValueClass}>{hike.distance_km} km</div>
                <div className={detailStatLabelClass}>Strecke</div>
              </div>
            </div>
          )}
          {hike.elevation_gain_m && (
            <div className={detailStatChipClass}>
              <span className={detailStatIconClass}>{TOUR_ICONS.elevation}</span>
              <div className={detailStatTextClass}>
                <div className={detailStatValueClass}>{hike.elevation_gain_m} Hm</div>
                <div className={detailStatLabelClass}>Aufstieg</div>
              </div>
            </div>
          )}
          {hike.difficulty && (
            <div className={`${detailStatChipClass} ${humanDifficultyChipClass}`}>
              <span className={detailStatIconClass}>{TOUR_ICONS.human}</span>
              <div className={detailStatTextClass}>
                <div className={detailDifficultyRowClass}>
                  <DifficultyBars level={hike.difficulty} type="human" />
                  <span className={detailStatValueClass}>{getDifficultyLabel(hike.difficulty)}</span>
                </div>
                {getDifficultyLabel(hike.difficulty) && (
                  <div className={detailStatLabelClass}>Mensch {getDifficultyLevel(hike.difficulty)}/5</div>
                )}
              </div>
            </div>
          )}
          {hike.dog_difficulty && (
            <div className={`${detailStatChipClass} ${dogDifficultyChipClass}`}>
              <span className={detailStatIconClass}>{TOUR_ICONS.dog}</span>
              <div className={detailStatTextClass}>
                <div className={detailDifficultyRowClass}>
                  <DifficultyBars level={hike.dog_difficulty} type="dog" />
                  <span className={detailStatValueClass}>{getDifficultyLabel(hike.dog_difficulty)}</span>
                </div>
                {getDifficultyLabel(hike.dog_difficulty) && (
                  <div className="text-xs leading-tight text-[#7C4A00]">Hund {getDifficultyLevel(hike.dog_difficulty)}/5</div>
                )}
              </div>
            </div>
          )}
          {seasonValues.map((season) => (
            getSeasonLabel(season) ? (
              <div
                key={season}
                className={detailStatChipClass}
              >
                <span className={detailStatIconClass}>{getSeasonIcon(season)}</span>
                <div className={detailStatTextClass}>
                  <div className={detailStatValueClass}>{getSeasonLabel(season)}</div>
                  <div className={detailStatLabelClass}>Jahreszeit</div>
                </div>
              </div>
            ) : null
          ))}
          {hike.grazing_animals && (
            <div className={detailStatChipClass}>
              <span className={detailStatIconClass}>{TOUR_ICONS.grazing}</span>
              <div className={detailStatTextClass}>
                <div className={detailStatValueClass}>Achtung Weidetiere</div>
                <div className={detailStatLabelClass}>Hinweis</div>
              </div>
            </div>
          )}
          {hike.muzzle_recommended && (
            <div className={detailStatChipClass}>
              <span className={detailStatIconClass}>{TOUR_ICONS.muzzle}</span>
              <div className={detailStatTextClass}>
                <div className={detailStatValueClass}>Maulkorb empfohlen</div>
                <div className={detailStatLabelClass}>Hinweis</div>
              </div>
            </div>
          )}
          </div>
        </motion.div>

        {/* Route Profile - Full Width */}
        {!showPremiumPreviewOnly && hike.route_coordinates && hike.route_coordinates.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mb-10"
          >
            <RouteProfile hike={hike} />
          </motion.div>
        )}

        {showPremiumPreviewOnly && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mb-10"
          >
            <div className="doghike-glass-card p-6">
              <h2 className="doghike-card-title mb-4">Vorschau</h2>
              <div className="space-y-4">
                {previewNotes ? (
                  <p className="text-slate-600 leading-relaxed">{previewNotes}</p>
                ) : (
                  <p className="text-slate-500">Zu dieser Premium-Tour ist eine Kurzvorschau sichtbar. Die ganzen Details kannst du mit Premium freischalten.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Weather Info - Full Width */}
        {!showPremiumPreviewOnly && hike.latitude && hike.longitude && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.13 }}
            className="mb-10"
          >
            <HikeWeatherInfo
              location={hike.location}
              date={hike.date}
              latitude={hike.latitude}
              longitude={hike.longitude}
            />
          </motion.div>
        )}

        {showPremiumPreviewOnly ? (
          <PremiumGate
            hikeName={hike.trail_name}
            coverPhoto={coverPhoto}
            variant="inline"
          />
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Parking & Starting Point */}
            {hike.parking_info && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="doghike-glass-card p-6"
              >
                <h2 className="doghike-card-title mb-3 flex items-center gap-2">
                  {TOUR_ICONS.parking} Ausgangspunkt & Parken
                </h2>
                <ExpandableText text={hike.parking_info} />
              </motion.div>
            )}

            {/* Restaurants & Huts */}
            {hike.restaurant_info && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16 }}
                className="doghike-glass-card p-6"
              >
                <h2 className="doghike-card-title mb-3 flex items-center gap-2">
                  {TOUR_ICONS.restaurant} Einkehrmöglichkeiten
                </h2>
                <ExpandableText text={hike.restaurant_info} />
              </motion.div>
            )}

            {/* Water & Hazards Info — always shown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.17 }}
              className="doghike-glass-card p-6"
            >
              <h2 className="doghike-card-title mb-4">{TOUR_ICONS.dog} Infos für Hundebesitzer</h2>
              <div className="space-y-4">
                {/* Wasser: immer anzeigen */}
                {hike.water_availability ? (
                  <div className={`flex items-center gap-3 p-3 rounded-xl ${getWaterBadgeClass(hike.water_availability)}`}>
                    <WaterIcon value={hike.water_availability} className="text-lg" />
                    <div>
                      <p className="font-medium">Wasser unterwegs</p>
                      <p className="text-sm opacity-80">{getWaterLabel(hike.water_availability)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="doghike-soft-panel flex items-center gap-3 p-3">
                    <WaterIcon value="little" className="text-lg" />
                    <div>
                      <p className="font-medium text-slate-700">Wasser unterwegs</p>
                      <p className="text-sm text-slate-400">Keine Angabe – Wasser mitnehmen empfohlen</p>
                    </div>
                  </div>
                )}
                {(hike.grazing_animals || hike.muzzle_recommended) && (
                  <div className="flex flex-wrap gap-2">
                    {hike.grazing_animals && (
                      <Badge className="border border-brand-100 bg-brand-50/70 text-brand-700">
                        {TOUR_ICONS.grazing} Weidetiere
                      </Badge>
                    )}
                    {hike.muzzle_recommended && (
                      <Badge className="border border-brand-100 bg-brand-50/70 text-brand-700">
                        {TOUR_ICONS.muzzle} Maulkorb
                      </Badge>
                    )}
                  </div>
                )}
                  {hike.hazard_notes && (
                    <div className="p-3 bg-brand-50 border border-brand-100 rounded-xl">
                      <p className="font-medium text-brand-700 mb-1">{TOUR_ICONS.hazard} Achtung</p>
                      <ExpandableText
                        text={hike.hazard_notes}
                        lines={3}
                        minChars={200}
                        className="text-sm text-brand-600 whitespace-pre-wrap"
                      />
                    </div>
                  )}
                </div>
            </motion.div>

            {/* Dogs */}
            {hikeDogs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="doghike-glass-card p-6"
              >
                <h2 className="doghike-card-title mb-4">{TOUR_ICONS.dog} Mit dabei</h2>
                <div className="flex flex-wrap gap-4">
                  {hikeDogs.map((dog) => (
                    <div key={dog.id} className="doghike-soft-panel flex items-center gap-3 p-3">
                      <img
                        src={getDisplayImageUrl(dog.photo_url, { width: 128, quality: 70 }) || getAvatarDataUrl(dog.name)}
                        alt={dog.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium text-slate-900">{dog.name}</p>
                        {dog.breed && <p className="text-sm text-slate-500">{dog.breed}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Notes */}
            {hike.notes && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="doghike-glass-card p-6"
              >
                <h2 className="doghike-card-title mb-4">Beschreibung & Tipps</h2>
                <ExpandableText text={hike.notes} lines={6} minChars={320} />
              </motion.div>
            )}

            {/* Photo Gallery */}
            {photos.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="doghike-glass-card p-6"
              >
                <h2 className="doghike-card-title mb-4">Fotos</h2>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                  {photos.map((photo, index) => (
                    <button
                      type="button"
                      key={index}
                      className="aspect-square overflow-hidden rounded-xl border border-brand-100/70 bg-brand-50/70 p-0 ring-brand-300 transition-all hover:ring-2 focus-visible:outline-none focus-visible:ring-2"
                      onClick={() => openGalleryPhoto(index)}
                    >
                      <img
                        src={getDisplayImageUrl(photo, { width: 640, quality: 72 }) || photo}
                        alt={`Photo ${index + 1}`}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                      />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Rating Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <RatingSection
                hikeId={communityHikeId}
                hikeAliases={communityHikeAliases}
                hikeSource={hike?._source === "journal" ? "journal" : "sheets"}
              />
            </motion.div>

            {/* Community Section - Comments */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <CommentSection
                hikeId={communityHikeId}
                hikeAliases={communityHikeAliases}
                hikeSource={hike?._source === "journal" ? "journal" : "sheets"}
                canComment={canComment}
              />
            </motion.div>
          </div>
        </div>
        )}
      </div>

      {/* Ähnliche Touren */}
      {!showPremiumPreviewOnly && hike && (
        <div className="mx-auto max-w-5xl px-4 pb-8 sm:px-6 lg:px-8">
          <SmartRecommendations
            currentHike={hike}
            allHikes={(queryClient.getQueryData(["allHikes"]) ?? []).filter(
              (h) => String(h._public_hike_id ?? h.route_id ?? h.id) !== normalizedHikeId
            )}
          />
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {!showPremiumPreviewOnly && lightboxOpen && photos.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95"
          >
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute left-4 top-4 z-20 rounded-full bg-white/12 p-2 text-white/80 backdrop-blur-sm hover:bg-white/20 hover:text-white"
              aria-label="Fotoansicht schließen"
            >
              <X className="w-8 h-8" />
            </button>

            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={showPreviousLightboxPhoto}
                  className="absolute left-4 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/12 text-white/85 shadow-lg backdrop-blur-sm transition hover:bg-white/22 hover:text-white md:flex"
                  aria-label="Vorheriges Foto"
                >
                  <ChevronLeft className="h-7 w-7" />
                </button>
                <button
                  type="button"
                  onClick={showNextLightboxPhoto}
                  className="absolute right-4 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/12 text-white/85 shadow-lg backdrop-blur-sm transition hover:bg-white/22 hover:text-white md:flex"
                  aria-label="NÃ¤chstes Foto"
                >
                  <ChevronRight className="h-7 w-7" />
                </button>
              </>
            )}

            <div
              ref={lightboxScrollerRef}
              className="flex h-full snap-x snap-mandatory overflow-x-auto scroll-smooth"
              onScroll={handleLightboxScroll}
            >
              {photos.map((photo, index) => (
                <div
                  key={index}
                  className="flex h-full w-screen flex-none snap-center items-center justify-center px-4 py-16 sm:px-8"
                >
                  <img
                    src={getDisplayImageUrl(photo, { width: 1800, quality: 84 }) || photo}
                    alt={`Photo ${index + 1}`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ))}
            </div>

            <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1 text-sm font-semibold text-white/80 backdrop-blur-sm">
              {currentPhotoIndex + 1} / {photos.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

