import { useMemo, useState } from "react";
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
import HikeWeatherInfo from "@/components/weather/HikeWeatherInfo";
import InteractiveHikeMap from "@/components/hikes/InteractiveHikeMap";
import SaveButton from "@/components/hikes/SaveButton";
import OfflineDownload from "@/components/hikes/OfflineDownload";
import CommentSection from "@/components/community/CommentSection";
import RatingSection from "@/components/community/RatingSection";
import ExpandableText from "@/components/ExpandableText";
import PawLoadingTrail from "@/components/PawLoadingTrail";
import PremiumGate from "@/components/hikes/PremiumGate";
import WaterIcon from "@/components/icons/WaterIcon";
import { supabase } from "@/lib/supabaseClient";
import { TOUR_ICONS, getSeasonBadgeClass, getSeasonIcon, getSeasonLabel, getWaterBadgeClass, getWaterLabel } from "@/lib/difficultyConfig";
import { PREMIUM_FEATURES_ENABLED } from "@/lib/premiumConfig";
import { formatDurationHours } from "@/lib/duration";
import { getAvatarDataUrl } from "@/lib/fallbackImages";
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

const difficultyColors = {
  "1": "bg-brand-100 text-brand-600",
  "2": "bg-brand-100 text-brand-600",
  "3": "bg-brand-100 text-brand-600",
  "4": "bg-brand-100 text-brand-400",
  "5": "bg-brand-100 text-brand-500"
};

const humanDifficultyChipClass =
  "border-[#F07030]/55 bg-[#F9C030]/22 text-[#7C4A00]";
const dogDifficultyChipClass =
  "border-[#F07030]/55 bg-[#F9C030]/22 text-[#7C4A00]";
const humanDifficultyDotClass = "bg-[#F07030]";
const dogDifficultyDotClass = "bg-[#F07030]";
const inactiveDifficultyDotClass = "bg-[#F9C030]/45";

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
  const [copied, setCopied] = useState(false);
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
          return String(h._public_hike_id ?? h.route_id ?? "") === normalizedHikeId || String(h.id) === normalizedHikeId;
        }

        return String(h.id) === normalizedHikeId;
      });
    },
    enabled: !!normalizedHikeId,
    staleTime: 5 * 60_000,
  });

  const { user: currentUser, isAdmin } = useAuth();

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
        .select("is_premium")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    },
    enabled: !!currentUser?.id,
  });

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
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-brand-500">Lädt...</div>
          <PawLoadingTrail />
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
  // Premium gate: block non-premium users from admin-created premium hikes
  const isPremiumHike = PREMIUM_FEATURES_ENABLED && hike.is_premium && !isAdmin && !isOwnHike;
  const userHasPremium = currentProfile?.is_premium === true;
  const showPremiumPreviewOnly = isPremiumHike && !userHasPremium;

  const hikeDogs = dogs.filter(d => hike.dogs?.includes(d.id));
  const photos = hike.photos || [];
  const coverPhoto = photos[0] || "/splash/autumn-hero.jpg";
  const detailId = hike?._source === "sheets" && hike?._public_hike_id
    ? hike.route_id || String(hike._public_hike_id)
    : hike.id;
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
  const seasonValue = hike.season || (Array.isArray(hike.seasons) ? hike.seasons[0] : null);

  const nextPhoto = () => setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  const prevPhoto = () => setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  const canComment = hike?._source === "sheets" || hike?.visibility === "public";
  const canDownloadPdf = hike?._source === "sheets" || isOwnJournalHike || hike?.visibility === "public";
  const includePhotosInPdf = hike?._source === "sheets" || isOwnJournalHike;
  const previewNotes = hike.notes
    ? hike.notes.length > 220
      ? `${hike.notes.slice(0, 220).trim()}...`
      : hike.notes
    : null;
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50/20 pb-24 md:pb-8">
      {/* Hero Image */}
      <div className="relative h-[50vh] overflow-hidden">
        <img
          src={coverPhoto}
          alt={hike.trail_name}
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
            {(isOwnJournalHike || (isAdmin && hike?._source === "sheets" && hike?._public_hike_id)) && (
              <>
                <Link
                  to={
                    isOwnJournalHike
                      ? createPageUrl("AddJournalEntry") + `?id=${hike?._journal_id}`
                      : createPageUrl("EditPublicHike") + `?id=${encodeURIComponent(detailId ?? "")}`
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

            <div className="flex flex-wrap items-center gap-2 mb-3">
              {hike.season && getSeasonLabel(hike.season) && (
                <Badge className={getSeasonBadgeClass(hike.season)}>
                  {getSeasonIcon(hike.season)} {getSeasonLabel(hike.season)}
                </Badge>
              )}
              {hike.difficulty && (
                <Badge className={difficultyColors[hike.difficulty]}>
                  {TOUR_ICONS.human} Stufe {hike.difficulty}
                </Badge>
              )}
              {hike.dog_difficulty && (
                <Badge className={difficultyColors[hike.dog_difficulty]}>
                  {TOUR_ICONS.dog} Stufe {hike.dog_difficulty}
                </Badge>
              )}
            </div>
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
                <h2 className="text-2xl font-semibold text-slate-900">
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
          className="mb-10"
        >
          <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap">
          {countryLabel && (
            <div className="doghike-stat-chip min-w-0 justify-start px-3 py-3 sm:min-w-[128px] sm:flex-1 sm:justify-center sm:px-4">
              <span className="text-lg">{TOUR_ICONS.country}</span>
              <div>
                <div className="text-sm font-bold leading-tight text-[#7C3020]">{countryLabel}</div>
                <div className="text-xs text-[#C07820]">Land</div>
              </div>
            </div>
          )}
          {hike.duration_minutes && (
            <div className="doghike-stat-chip min-w-0 justify-start px-3 py-3 sm:min-w-[128px] sm:flex-1 sm:justify-center sm:px-4">
              <span className="text-lg">{TOUR_ICONS.duration}</span>
              <div>
                <div className="text-sm font-bold leading-tight text-[#7C3020]">
                  {formatDurationHours(hike.duration_minutes)}
                </div>
                <div className="text-xs text-[#C07820]">Gehzeit</div>
              </div>
            </div>
          )}
          {hike.distance_km && (
            <div className="doghike-stat-chip min-w-0 justify-start px-3 py-3 sm:min-w-[128px] sm:flex-1 sm:justify-center sm:px-4">
              <span className="text-lg">{TOUR_ICONS.distance}</span>
              <div>
                <div className="text-sm font-bold leading-tight text-[#7C3020]">{hike.distance_km} km</div>
                <div className="text-xs text-[#C07820]">Strecke</div>
              </div>
            </div>
          )}
          {hike.elevation_gain_m && (
            <div className="doghike-stat-chip min-w-0 justify-start px-3 py-3 sm:min-w-[128px] sm:flex-1 sm:justify-center sm:px-4">
              <span className="text-lg">{TOUR_ICONS.elevation}</span>
              <div>
                <div className="text-sm font-bold leading-tight text-[#7C3020]">{hike.elevation_gain_m} Hm</div>
                <div className="text-xs text-[#C07820]">Aufstieg</div>
              </div>
            </div>
          )}
          {hike.difficulty && (
            <div className={`doghike-stat-chip min-w-0 justify-start px-3 py-3 sm:min-w-[128px] sm:flex-1 sm:justify-center sm:px-4 ${humanDifficultyChipClass}`}>
              <span className="text-lg">{TOUR_ICONS.human}</span>
              <div>
                <div className="flex gap-0.5 mb-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className={`inline-block h-2 w-2 rounded-full ${i < Number(hike.difficulty) ? humanDifficultyDotClass : inactiveDifficultyDotClass}`}
                    />
                  ))}
                </div>
                <div className="text-xs font-semibold text-[#7C4A00]">Mensch</div>
              </div>
            </div>
          )}
          {hike.dog_difficulty && (
            <div className={`doghike-stat-chip min-w-0 justify-start px-3 py-3 sm:min-w-[128px] sm:flex-1 sm:justify-center sm:px-4 ${dogDifficultyChipClass}`}>
              <span className="text-lg">{TOUR_ICONS.dog}</span>
              <div>
                <div className="flex gap-0.5 mb-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className={`inline-block h-2 w-2 rounded-full ${i < Number(hike.dog_difficulty) ? dogDifficultyDotClass : inactiveDifficultyDotClass}`}
                    />
                  ))}
                </div>
                <div className="text-xs font-semibold text-[#7C4A00]">Hund</div>
              </div>
            </div>
          )}
          {seasonValue && getSeasonLabel(seasonValue) && (
            <div className="doghike-stat-chip min-w-0 justify-start px-3 py-3 sm:min-w-[128px] sm:flex-1 sm:justify-center sm:px-4">
              <span className="text-lg">{getSeasonIcon(seasonValue)}</span>
              <div>
                <div className="text-sm font-bold leading-tight text-[#7C3020]">{getSeasonLabel(seasonValue)}</div>
                <div className="text-xs text-[#C07820]">Jahreszeit</div>
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
              <h2 className="text-lg font-medium text-slate-900 mb-4">Vorschau</h2>
              <div className="space-y-4">
                {previewNotes ? (
                  <p className="text-slate-600 leading-relaxed">{previewNotes}</p>
                ) : (
                  <p className="text-slate-500">Zu dieser Premium-Tour ist eine Kurzvorschau sichtbar. Die ganzen Details kannst du mit Premium freischalten.</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-brand-100 bg-brand-50/70 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Ort</p>
                    <p className="font-medium text-slate-900">{hike.location || "Nicht angegeben"}</p>
                  </div>
                  <div className="rounded-xl border border-brand-100 bg-brand-50/70 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Land</p>
                    <p className="font-medium text-slate-900">{countryLabel || "Nicht angegeben"}</p>
                  </div>
                </div>
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
                <h2 className="text-lg font-medium text-slate-900 mb-3 flex items-center gap-2">
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
                <h2 className="text-lg font-medium text-slate-900 mb-3 flex items-center gap-2">
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
              <h2 className="text-lg font-medium text-slate-900 mb-4">{TOUR_ICONS.dog} Infos für Hundebesitzer</h2>
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
                <h2 className="text-lg font-medium text-slate-900 mb-4">{TOUR_ICONS.dog} Mit dabei</h2>
                <div className="flex flex-wrap gap-4">
                  {hikeDogs.map((dog) => (
                    <div key={dog.id} className="doghike-soft-panel flex items-center gap-3 p-3">
                      <img
                        src={dog.photo_url || getAvatarDataUrl(dog.name)}
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
                <h2 className="text-lg font-medium text-slate-900 mb-4">Beschreibung & Tipps</h2>
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
                <h2 className="text-lg font-medium text-slate-900 mb-4">Fotos</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {photos.map((photo, index) => (
                    <div
                      key={index}
                      className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:ring-2 ring-brand-300 transition-all"
                      onClick={() => {
                        setCurrentPhotoIndex(index);
                        setLightboxOpen(true);
                      }}
                    >
                      <img
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        loading="lazy"
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                      />
                    </div>
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

      {/* Lightbox */}
      <AnimatePresence>
        {!showPremiumPreviewOnly && lightboxOpen && photos.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 p-2 text-white/70 hover:text-white"
            >
              <X className="w-8 h-8" />
            </button>
            
            {photos.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
                  className="absolute left-4 p-3 bg-white/10 rounded-full text-white hover:bg-white/20"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                  className="absolute right-4 p-3 bg-white/10 rounded-full text-white hover:bg-white/20"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
            
            <img
              src={photos[currentPhotoIndex]}
              alt={`Photo ${currentPhotoIndex + 1}`}
              className="max-w-[90vw] max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            
            <div className="absolute bottom-4 text-white/70">
              {currentPhotoIndex + 1} / {photos.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

