import { useEffect, useMemo, useRef, useState } from "react";
import { getAllHikes } from "@/api/sheetsClient";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Edit, Trash2, ChevronLeft, ChevronRight, X, Share2, Check, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/ui/BackButton";
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
import { TOUR_ICONS, getDifficultyLabel, getDifficultyLevel, getDifficultyTypeChipClass, getSeasonBadgeClass, getSeasonIcon, getSeasonLabel, getWaterBadgeClass, getWaterLabel, normalizeSeasonValues } from "@/lib/difficultyConfig";
import { PREMIUM_FEATURES_ENABLED } from "@/lib/premiumConfig";
import { hasActivePremiumAccess } from "@/lib/premiumAccess";
import { formatDurationHours } from "@/lib/duration";
import { getAvatarDataUrl, HIKE_PLACEHOLDER_IMAGE } from "@/lib/fallbackImages";
import { getDisplayImageUrl } from "@/lib/imageProxy";
import { getUniqueHikeImageSources, resolveHikeImageUrl } from "@/lib/hikeImages";
import { toast } from "sonner";
import { getCountryLabel } from "@/lib/countries";

function isManagedPublicHikePhoto(value) {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("public-hikes/")) return true;
  if (trimmed.startsWith("journal/public-hikes/")) return true;
  return /\/storage\/v1\/object\/(?:public|sign)\/journal\/public-hikes\//.test(trimmed);
}

function getCanonicalGalleryPhotoKey(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("public-hikes/")) {
    return trimmed;
  }

  if (trimmed.startsWith("journal/public-hikes/")) {
    return trimmed.slice("journal/".length);
  }

  try {
    const parsedUrl = new URL(trimmed);
    const publicMarker = "/storage/v1/object/public/journal/";
    const signedMarker = "/storage/v1/object/sign/journal/";

    if (parsedUrl.pathname.includes(publicMarker)) {
      return decodeURIComponent(
        parsedUrl.pathname.slice(parsedUrl.pathname.indexOf(publicMarker) + publicMarker.length)
      );
    }

    if (parsedUrl.pathname.includes(signedMarker)) {
      return decodeURIComponent(
        parsedUrl.pathname.slice(parsedUrl.pathname.indexOf(signedMarker) + signedMarker.length)
      );
    }

    return `${parsedUrl.origin}${parsedUrl.pathname}`;
  } catch {
    return trimmed;
  }
}

function getRenderablePhotoKey(photo) {
  return getCanonicalGalleryPhotoKey(photo) || (typeof photo === "string" ? photo.trim() : "");
}

function formatUpdatedAtLabel(value) {
  if (!value) return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  return new Intl.DateTimeFormat("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

function mapWaterAvailabilityToJournalValue(value) {
  if (value === "none" || value === 0 || value === "0") return 0;
  if (value === "little" || value === 1 || value === "1") return 1;
  if (value === "moderate" || value === 2 || value === "2") return 2;
  if (value === "plenty" || value === 3 || value === "3") return 3;
  return null;
}

const humanDifficultyChipClass =
  getDifficultyTypeChipClass("human", "important");
const dogDifficultyChipClass =
  getDifficultyTypeChipClass("dog", "important");
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
  const requestedHikeSource = searchParams.get("source") ?? "sheets";
  const hikeSource = requestedHikeSource === "supabase" ? "sheets" : requestedHikeSource;
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [heroPhotoIndex, setHeroPhotoIndex] = useState(0);
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);
  const [failedPhotoKeys, setFailedPhotoKeys] = useState(() => new Set());
  const [copied, setCopied] = useState(false);
  const lightboxScrollerRef = useRef(null);
  const lightboxDragRef = useRef({
    isDragging: false,
    pointerId: null,
    startX: 0,
    scrollLeft: 0,
  });
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
    placeholderData: initialHike,
    queryFn: async () => {
      const hikes = await queryClient.fetchQuery({
        queryKey: ["allHikes"],
        queryFn: getAllHikes,
        staleTime: 0,
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
    const normalizedPhotos = getUniqueHikeImageSources(Array.isArray(hike?.photos) ? hike.photos : []);

    const prioritizedPhotos =
      hike?._source === "sheets" && hike?._public_hike_id
        ? (() => {
            const managedPhotos = normalizedPhotos.filter(isManagedPublicHikePhoto);
            const otherPhotos = normalizedPhotos.filter((photo) => !isManagedPublicHikePhoto(photo));
            return managedPhotos.length > 0 ? [...managedPhotos, ...otherPhotos] : normalizedPhotos;
          })()
        : normalizedPhotos;

    const normalizedPhotoReferences = getUniqueHikeImageSources(
      Array.isArray(hike?._photo_references) ? hike._photo_references : []
    );
    const explicitTitleImage = getUniqueHikeImageSources(hike?.image)[0] ?? null;

    const uniquePhotos = [];
    const seenPhotoKeys = new Set();

    [
      explicitTitleImage,
      ...prioritizedPhotos,
      ...normalizedPhotoReferences,
    ]
      .filter(Boolean)
      .forEach((photo) => {
        const canonicalKey =
          getCanonicalGalleryPhotoKey(photo) ||
          getCanonicalGalleryPhotoKey(getDisplayImageUrl(photo) || photo);
        if (seenPhotoKeys.has(canonicalKey)) return;
        seenPhotoKeys.add(canonicalKey);
        uniquePhotos.push(photo);
      });

    return uniquePhotos;
  }, [hike?._photo_references, hike?.image, hike?.photos]);

  const heroPhotosKey = useMemo(
    () => detailPhotoSource.filter(Boolean).join("|"),
    [detailPhotoSource]
  );

  useEffect(() => {
    setHeroPhotoIndex(0);
    setHeroImageLoaded(false);
    setFailedPhotoKeys(new Set());
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

  const publicSubmitterDogIds = useMemo(
    () =>
      Array.from(
        new Set(
          [
            ...(Array.isArray(hike?.dog_ids) ? hike.dog_ids : []),
            hike?.dog_id,
          ]
            .map((dogId) => String(dogId ?? "").trim())
            .filter(Boolean)
        )
      ),
    [hike?.dog_id, hike?.dog_ids]
  );

  const { data: publicSubmitterProfile = null } = useQuery({
    queryKey: ["publicHikeSubmitterProfile", hike?._user_id],
    queryFn: async () => {
      if (!hike?._user_id) return null;

      const { data, error } = await supabase
        .from("public_profiles")
        .select("user_id, username, avatar_url")
        .eq("user_id", hike._user_id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    },
    enabled: hike?._source === "sheets" && !!hike?._user_id,
  });

  const { data: publicSubmitterDogs = [] } = useQuery({
    queryKey: ["publicHikeSubmitterDogs", publicSubmitterDogIds],
    queryFn: async () => {
      if (publicSubmitterDogIds.length === 0) return [];

      const { data, error } = await supabase
        .from("dogs")
        .select("id, name, breed, photo_url")
        .in("id", publicSubmitterDogIds);

      if (error) {
        throw error;
      }

      const dogMap = new Map((data ?? []).map((dog) => [String(dog.id), dog]));
      return publicSubmitterDogIds
        .map((dogId) => dogMap.get(String(dogId)))
        .filter(Boolean);
    },
    enabled: hike?._source === "sheets" && publicSubmitterDogIds.length > 0,
  });

  const { data: currentProfile } = useQuery({
    queryKey: ["profile_summary", currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("is_premium, premium_current_period_end, role, username, full_name")
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
  const publicSubmitterName =
    publicSubmitterProfile?.username ||
    (hike?._user_id ? "ein DogTrails-Mitglied" : null);
  const primaryPublicSubmitterDog = publicSubmitterDogs[0] ?? null;
  const publicSubmitterHandle = publicSubmitterProfile?.username
    ? `@${publicSubmitterProfile.username}`
    : null;
  const countryLabel = getCountryLabel(hike?.country);
  const updatedAtLabel = formatUpdatedAtLabel(hike?.updated_at || hike?.created_at);
  const detailAuthorName =
    publicSubmitterName ||
    (hike?._source === "journal"
      ? hike.author_username || null
      : isAdmin && hike?._source === "sheets" && !hike?._user_id
        ? "Julia Schwärzer, Hundetrainerin und Buchautorin"
        : null);
  const publicSubmitterDisplayPhoto =
    getDisplayImageUrl(primaryPublicSubmitterDog?.photo_url, { width: 80, quality: 72 }) ||
    getDisplayImageUrl(publicSubmitterProfile?.avatar_url, { width: 80, quality: 72 }) ||
    getAvatarDataUrl(primaryPublicSubmitterDog?.name || publicSubmitterHandle || hike?._user_id || "DogTrails-Mitglied");
  const publicSubmitterDisplayLine = primaryPublicSubmitterDog?.name || null;
  const seasonValues = normalizeSeasonValues(hike?.seasons, hike?.season);
  const detailStatItems = useMemo(() => {
    const items = [];

    if (countryLabel) {
      items.push({
        key: `country-${countryLabel}`,
        icon: TOUR_ICONS.country,
        value: countryLabel,
        label: "Land",
      });
    }

    if (hike?.duration_minutes) {
      const formattedDuration = formatDurationHours(hike.duration_minutes);
      if (formattedDuration) {
        items.push({
          key: "duration",
          icon: TOUR_ICONS.duration,
          value: formattedDuration,
          label: "Gehzeit",
        });
      }
    }

    if (hike?.distance_km) {
      items.push({
        key: "distance",
        icon: TOUR_ICONS.distance,
        value: `${hike.distance_km} km`,
        label: "Strecke",
      });
    }

    if (hike?.elevation_gain_m) {
      items.push({
        key: "elevation",
        icon: TOUR_ICONS.elevation,
        value: `${hike.elevation_gain_m} Hm`,
        label: "Aufstieg",
      });
    }

    const seasonLabels = seasonValues
      .map((season) => getSeasonLabel(season))
      .filter(Boolean);
    if (seasonLabels.length > 0) {
      items.push({
        key: "seasons",
        icon: getSeasonIcon(seasonValues[0]) || TOUR_ICONS.season,
        value: seasonLabels.join(", "),
        label: seasonLabels.length > 1 ? "Jahreszeiten" : "Jahreszeit",
        className: getSeasonBadgeClass(seasonValues[0]),
      });
    }

    return items;
  }, [countryLabel, hike?.distance_km, hike?.duration_minutes, hike?.elevation_gain_m, seasonValues]);

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
        <div className="h-64 animate-pulse bg-gradient-to-br from-[#FDF0E8] via-[#F9C030]/30 to-[#D4547A]/25 md:h-80 lg:h-96" />
        <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <div className="h-7 w-2/3 animate-pulse rounded-lg bg-[#F9C030]/28" />
            <div className="h-4 w-1/3 animate-pulse rounded-lg bg-[#FDF0E8]" />
          </div>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[1,2,3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-[#FDF0E8]" />
            ))}
          </div>
          {/* Description */}
          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-[#FDF0E8]" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-[#FDF0E8]" />
            <div className="h-4 w-4/6 animate-pulse rounded bg-[#FDF0E8]" />
          </div>
          {/* Map placeholder */}
          <div className="h-48 animate-pulse rounded-xl bg-gradient-to-br from-[#FDF0E8] to-[#F9C030]/30" />
        </div>
      </div>
    );
  }


  if (!hike) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50/20 flex items-center justify-center px-4">
        <div className="doghike-glass-card p-8 text-center">
          <p className="text-xl text-slate-700 mb-4">Wanderung nicht gefunden</p>
          <BackButton to={fallbackBackUrl} variant="default" />
        </div>
      </div>
    );
  }
  // Premium gate: admins may inspect premium hikes, but downloads still require active Premium.
  const isPremiumContent = PREMIUM_FEATURES_ENABLED && hike.is_premium === true;
  const isPremiumHike = isPremiumContent && !isAdmin && !isOwnHike;
  const userHasPremium = isAdmin || hasActivePremiumAccess(currentProfile);
  const showPremiumPreviewOnly = isPremiumHike && !userHasPremium;

  const hikeDogs = dogs.filter(d => hike.dogs?.includes(d.id));
  const photos = detailPhotoSource.filter((photo) => {
    const photoKey = getRenderablePhotoKey(photo);
    return photoKey && !failedPhotoKeys.has(photoKey);
  });
  const coverPhoto = heroPhotoIndex >= 0 ? photos[heroPhotoIndex] || HIKE_PLACEHOLDER_IMAGE : HIKE_PLACEHOLDER_IMAGE;
  const heroPreviewPhoto = resolveHikeImageUrl(coverPhoto, { width: 1600, quality: 80 });
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
  
  const markPhotoAsFailed = (photo) => {
    const photoKey = getRenderablePhotoKey(photo);
    if (!photoKey) return;

    setFailedPhotoKeys((currentKeys) => {
      if (currentKeys.has(photoKey)) return currentKeys;
      const nextKeys = new Set(currentKeys);
      nextKeys.add(photoKey);
      return nextKeys;
    });
  };

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
      <div className="relative h-[50vh] overflow-hidden bg-[#FDF0E8]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(249,192,48,0.42),transparent_26%),linear-gradient(135deg,#FFF8F0_0%,#FDF0E8_42%,#F6B178_100%)]" />
        <div
          className="pointer-events-none absolute inset-0 scale-105 bg-cover bg-center opacity-45 blur-sm"
          style={{ backgroundImage: `url("${HIKE_PLACEHOLDER_IMAGE}")` }}
          aria-hidden="true"
        />
        {!heroImageLoaded && (
          <div className="pointer-events-none absolute inset-0 animate-pulse bg-gradient-to-r from-[#FFF8F0]/20 via-white/20 to-[#F9C030]/20" />
        )}
        <img
          src={heroPreviewPhoto}
          alt={hike.trail_name}
          onLoad={() => setHeroImageLoaded(true)}
          onError={() => {
            setHeroImageLoaded(false);
            markPhotoAsFailed(coverPhoto);
            setHeroPhotoIndex((currentIndex) => {
              const nextIndex = currentIndex + 1;
              return nextIndex < photos.length ? nextIndex : -1;
            });
          }}
          className={`relative z-10 h-full w-full object-cover transition-opacity duration-500 ${heroImageLoaded ? "opacity-100" : "opacity-0"}`}
        />
        <div className={`pointer-events-none absolute inset-0 z-20 bg-gradient-to-t transition-colors duration-500 ${heroImageLoaded ? "from-black/70 via-black/20 to-transparent" : "from-[#7C3020]/34 via-[#A8003C]/10 to-transparent"}`} />
        
        <div className="absolute left-4 right-4 top-4 z-30 flex flex-col gap-2 sm:left-6 sm:right-6 sm:top-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="self-start">
            <BackButton
              onClick={handleBack}
              className="h-10 bg-white/10 px-3 text-sm text-white backdrop-blur-sm hover:bg-white/20"
            />
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
                      <AlertDialogTitle>Wanderung löschen?</AlertDialogTitle>
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

        <div className="absolute bottom-6 left-4 right-4 z-30 sm:bottom-8 sm:left-8 sm:right-8">
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
                title="Wanderung teilen"
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
          {detailStatItems.map((item) => (
            <div key={item.key} className={`${detailStatChipClass} ${item.className ?? ""}`}>
              <span className={detailStatIconClass}>{item.icon}</span>
              <div className={detailStatTextClass}>
                <div className={detailStatValueClass}>{item.value}</div>
                <div className={detailStatLabelClass}>{item.label}</div>
              </div>
            </div>
          ))}
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
                  <p className="text-slate-500">Zu dieser Premium-Wanderung ist eine Kurzvorschau sichtbar. Die ganzen Details kannst du mit Premium freischalten.</p>
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
            {typeof hike.restaurant_info === "string" && hike.restaurant_info.trim() && (
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
                  {typeof hike.hazard_notes === "string" &&
                    hike.hazard_notes.trim() &&
                    hike.hazard_notes.trim() !== "/" && (
                    <div className="p-3 bg-brand-50 border border-brand-100 rounded-xl">
                      <p className="font-medium text-brand-700 mb-1">{TOUR_ICONS.hazard} Achtung</p>
                      <ExpandableText
                        text={hike.hazard_notes.trim()}
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
                        src={resolveHikeImageUrl(photo, { width: 1000, quality: 82 })}
                        alt={`Photo ${index + 1}`}
                        loading="lazy"
                        decoding="async"
                        onError={() => markPhotoAsFailed(photo)}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                      />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {(updatedAtLabel || detailAuthorName) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.41 }}
              >
                <div className="space-y-1">
                  {updatedAtLabel && (
                    <p className="text-xs text-slate-400">
                      Zuletzt aktualisiert: {updatedAtLabel}
                    </p>
                  )}
                  {hike?._source === "sheets" && hike?._user_id && (publicSubmitterDisplayLine || publicSubmitterName) ? (
                    <div className="inline-flex items-center gap-2 rounded-full border border-brand-100/80 bg-white/80 px-3 py-1.5 text-xs text-slate-500 shadow-sm">
                      <img
                        src={publicSubmitterDisplayPhoto}
                        alt={primaryPublicSubmitterDog?.name || publicSubmitterHandle || publicSubmitterName || "DogTrails-Mitglied"}
                        className="h-7 w-7 rounded-full object-cover"
                      />
                      <span className="font-medium text-slate-700">
                        {publicSubmitterDisplayLine || publicSubmitterName}
                        {publicSubmitterHandle ? ` · ${publicSubmitterHandle}` : ""}
                      </span>
                    </div>
                  ) : detailAuthorName ? (
                    <p className="text-xs text-slate-400">
                      Verfasst von: {detailAuthorName}
                    </p>
                  ) : null}
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

      {/* Ähnliche Wanderungen */}
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

      {!showPremiumPreviewOnly &&
        hike?._source === "sheets" &&
        hike?._user_id &&
        (publicSubmitterName || publicSubmitterDogs.length > 0) && (
          <div className="mx-auto max-w-5xl px-4 pb-12 sm:px-6 lg:px-8">
            <div className="doghike-glass-card p-6">
              <h2 className="doghike-card-title mb-3">Aus der Community eingereicht</h2>
              {publicSubmitterName && (
                <p className="text-sm leading-relaxed text-slate-600">
                  Diese Wanderung wurde von {publicSubmitterName} mit der Community geteilt und stammt aus einer echten DogTrails-Runde.
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-3">
                <div className="doghike-soft-panel flex items-center gap-3 p-3">
                  <img
                    src={getDisplayImageUrl(publicSubmitterProfile?.avatar_url, { width: 96, quality: 76 }) || getAvatarDataUrl(hike._user_id)}
                    alt={publicSubmitterName || "DogTrails-Mitglied"}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium text-slate-900">{publicSubmitterName || "DogTrails-Mitglied"}</p>
                    <p className="text-sm text-slate-500">Wanderung eingereicht</p>
                  </div>
                </div>

                {publicSubmitterDogs.map((dog) => (
                  <div key={dog.id} className="doghike-soft-panel flex items-center gap-3 p-3">
                    <img
                      src={getDisplayImageUrl(dog.photo_url, { width: 96, quality: 76 }) || getAvatarDataUrl(dog.name)}
                      alt={dog.name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium text-slate-900">{dog.name}</p>
                      <p className="text-sm text-slate-500">{dog.breed || "Mit dabei"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      {/* Lightbox */}
      <AnimatePresence>
        {!showPremiumPreviewOnly && lightboxOpen && photos.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95"
          >
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute left-4 z-30 rounded-full bg-white/12 p-2 text-white/80 backdrop-blur-sm hover:bg-white/20 hover:text-white"
              style={{ top: "max(1rem, env(safe-area-inset-top))" }}
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
                  key={index}
                  className="flex h-full w-screen flex-none snap-center items-center justify-center px-4 py-16 sm:px-8"
                >
                  <img
                    src={resolveHikeImageUrl(photo, { width: 1800, quality: 84 })}
                    alt={`Photo ${index + 1}`}
                    draggable={false}
                    onError={() => {
                      markPhotoAsFailed(photo);
                      setCurrentPhotoIndex((index) => Math.max(0, Math.min(index, photos.length - 2)));
                    }}
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

