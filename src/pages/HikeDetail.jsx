import { useState } from "react";
import { getAllHikes } from "@/api/sheetsClient";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, MapPin, Edit, Trash2, ChevronLeft, ChevronRight, X, Share2, Check
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
import CommentSection from "@/components/community/CommentSection";
import RatingSection from "@/components/community/RatingSection";
import ExpandableText from "@/components/ExpandableText";
import PremiumGate from "@/components/hikes/PremiumGate";
import { supabase } from "@/lib/supabaseClient";
import { getWaterBadgeClass, getWaterIcon, getWaterLabel } from "@/lib/difficultyConfig";
import { toast } from "sonner";

const difficultyColors = {
  "1": "bg-brand-100 text-brand-600",
  "2": "bg-lime-100 text-lime-700",
  "3": "bg-amber-100 text-amber-700",
  "4": "bg-orange-100 text-orange-700",
  "5": "bg-red-100 text-red-700"
};

const seasonConfig = {
  spring: { emoji: "🌸", label: "Frühling", color: "bg-pink-100 text-pink-700" },
  summer: { emoji: "☀️", label: "Sommer", color: "bg-red-100 text-red-700" },
  autumn: { emoji: "🍂", label: "Herbst", color: "bg-orange-100 text-orange-700" },
  winter: { emoji: "❄️", label: "Winter", color: "bg-blue-100 text-blue-700" },
  all_year: { emoji: "🍃", label: "Ganzjährig", color: "bg-brand-100 text-brand-600" }
};

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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const normalizedHikeId = hikeId ? String(hikeId) : null;

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
    queryFn: async () => {
      const hikes = await getAllHikes();
      return hikes.find((h) => String(h.id) === normalizedHikeId && (h._source ?? "sheets") === hikeSource);
    },
    enabled: !!normalizedHikeId
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
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-pulse text-stone-400">Lädt...</div>
      </div>
    );
  }


  if (!hike) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-xl text-stone-700 mb-4">Tour nicht gefunden</p>
          <Link to={createPageUrl("Hikes")}>
            <Button>Zurück zu den Touren</Button>
          </Link>
        </div>
      </div>
    );
  }
  // Premium gate: block non-premium users from admin-created premium hikes
  const isPremiumHike = hike.is_premium && !isAdmin && !isOwnHike;
  const userHasPremium = currentProfile?.is_premium === true;
  if (isPremiumHike && !userHasPremium) {
    const coverPhoto = hike.photos?.[0] || "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80";
    return <PremiumGate hikeName={hike.trail_name} coverPhoto={coverPhoto} />;
  }

  const hikeDogs = dogs.filter(d => hike.dogs?.includes(d.id));
  const photos = hike.photos || [];
  const coverPhoto = photos[0] || "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80";
  
  // Extract country from location
  const country = hike.location ? hike.location.split(',').map(p => p.trim()).pop() : null;

  const nextPhoto = () => setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  const prevPhoto = () => setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  const canComment = hike?._source === "sheets" || hike?.visibility === "public";

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-slate-50 pb-24 md:pb-8">
      {/* Hero Image */}
      <div className="relative h-[50vh] overflow-hidden">
        <img
          src={coverPhoto}
          alt={hike.trail_name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
          <Link to={createPageUrl("Hikes")}>
            <Button variant="ghost" className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück
            </Button>
          </Link>
          <div className="flex gap-2 flex-wrap">
            {(isOwnJournalHike || (isAdmin && hike?._source === "sheets" && hike?._public_hike_id)) && (
              <>
                <Link
                  to={
                    isOwnJournalHike
                      ? createPageUrl("AddJournalEntry") + `?id=${hike?._journal_id}`
                      : createPageUrl("EditPublicHike") + `?id=${encodeURIComponent(hike?.id ?? "")}`
                  }
                >
                  <Button variant="ghost" className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20">
                    <Edit className="w-4 h-4 mr-1" />
                    Bearbeiten
                  </Button>
                </Link>
                {isOwnJournalHike && <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" className="bg-red-500/20 backdrop-blur-sm text-white hover:bg-red-500/40">
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
                        className="bg-red-600 hover:bg-red-700"
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

        <div className="absolute bottom-8 left-8 right-8">
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
              {hike.season && seasonConfig[hike.season] && (
                <Badge className={seasonConfig[hike.season].color}>
                  {seasonConfig[hike.season].emoji} {seasonConfig[hike.season].label}
                </Badge>
              )}
              {hike.difficulty && (
                <Badge className={difficultyColors[hike.difficulty]}>
                  👤 Stufe {hike.difficulty}
                </Badge>
              )}
              {hike.dog_difficulty && (
                <Badge className={difficultyColors[hike.dog_difficulty]}>
                  🐕 Stufe {hike.dog_difficulty}
                </Badge>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-light text-white mb-2">{hike.trail_name}</h1>
            <div className="flex items-center gap-3 text-white/85">
              <div className="flex items-center gap-2 text-base md:text-lg font-medium">
                <MapPin className="w-4 h-4 md:w-5 md:h-5" />
                <span>{hike.location || "Dolomites"}</span>
              </div>
              <SaveButton
                hikeId={hikeId}
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
              {hike.country && (
                <span className="ml-2">
                  {hike.country === "italy" && "🇮🇹 Italien"}
                  {hike.country === "austria" && "🇦🇹 Österreich"}
                  {hike.country === "germany" && "🇩🇪 Deutschland"}
                  {hike.country === "switzerland" && "🇨🇭 Schweiz"}
                  {hike.country === "other" && "🌍"}
                </span>
              )}
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
            <h2 className="text-2xl font-semibold text-stone-800 mb-4">
              {hike.route_coordinates?.length > 0 ? "🗺️ Interaktive Karte & Routenverlauf" : "📍 Ausgangspunkt"}
            </h2>
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
          className="flex flex-wrap gap-2 mb-10"
        >
          {country && (
            <div className="flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-full px-4 py-2">
              <span className="text-base">🌍</span>
              <div>
                <div className="text-sm font-bold text-stone-900 leading-tight">{country}</div>
                <div className="text-xs text-stone-400">Land</div>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-full px-4 py-2">
            <span className="text-base">📅</span>
            <div>
              <div className="text-sm font-bold text-stone-900 leading-tight">
                {hike.date && format(new Date(hike.date), "dd.MM.yyyy")}
              </div>
              <div className="text-xs text-stone-400">Datum</div>
            </div>
          </div>
          {hike.distance_km && (
            <div className="flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-full px-4 py-2">
              <span className="text-base">📏</span>
              <div>
                <div className="text-sm font-bold text-stone-900 leading-tight">{hike.distance_km} km</div>
                <div className="text-xs text-stone-400">Strecke</div>
              </div>
            </div>
          )}
          {hike.elevation_gain_m && (
            <div className="flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-full px-4 py-2">
              <span className="text-base">⛰️</span>
              <div>
                <div className="text-sm font-bold text-stone-900 leading-tight">{hike.elevation_gain_m} m</div>
                <div className="text-xs text-stone-400">Höhenmeter</div>
              </div>
            </div>
          )}
          {hike.duration_minutes && (
            <div className="flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-full px-4 py-2">
              <span className="text-base">⏱️</span>
              <div>
                <div className="text-sm font-bold text-stone-900 leading-tight">
                  {(hike.duration_minutes / 60).toFixed(1)} Std
                </div>
                <div className="text-xs text-stone-400">Gehzeit</div>
              </div>
            </div>
          )}
          {hike.difficulty && (
            <div className="flex items-center gap-2 bg-brand-100 border border-brand-400 rounded-full px-4 py-2">
              <span className="text-base">🧗</span>
              <div>
                <div className="flex gap-0.5 mb-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={`inline-block w-2 h-2 rounded-full ${i < Number(hike.difficulty) ? 'bg-brand-400' : 'bg-brand-200'}`} />
                  ))}
                </div>
                <div className="text-xs text-stone-400">Mensch</div>
              </div>
            </div>
          )}
          {hike.dog_difficulty && (
            <div className="flex items-center gap-2 bg-brand-100 border border-brand-400 rounded-full px-4 py-2">
              <span className="text-base">🐕</span>
              <div>
                <div className="flex gap-0.5 mb-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={`inline-block w-2 h-2 rounded-full ${i < Number(hike.dog_difficulty) ? 'bg-brand-600' : 'bg-brand-200'}`} />
                  ))}
                </div>
                <div className="text-xs text-stone-400">Hund</div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Route Profile - Full Width */}
        {hike.route_coordinates && hike.route_coordinates.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mb-10"
          >
            <RouteProfile hike={hike} />
          </motion.div>
        )}

        {/* Weather Info - Full Width */}
        {hike.latitude && hike.longitude && (
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Parking & Starting Point */}
            {hike.parking_info && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white rounded-2xl p-6 border border-stone-200/50"
              >
                <h2 className="text-lg font-medium text-stone-800 mb-3 flex items-center gap-2">
                  🅿️ Ausgangspunkt & Parken
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
                className="bg-white rounded-2xl p-6 border border-stone-200/50"
              >
                <h2 className="text-lg font-medium text-stone-800 mb-3 flex items-center gap-2">
                  🍽️ Einkehrmöglichkeiten
                </h2>
                <ExpandableText text={hike.restaurant_info} />
              </motion.div>
            )}

            {/* Water & Hazards Info — always shown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.17 }}
              className="bg-white rounded-2xl p-6 border border-stone-200/50"
            >
              <h2 className="text-lg font-medium text-stone-800 mb-4">🐕 Infos für Hundebesitzer</h2>
              <div className="space-y-4">
                {/* Wasser: immer anzeigen */}
                {hike.water_availability ? (
                  <div className={`flex items-center gap-3 p-3 rounded-xl ${getWaterBadgeClass(hike.water_availability)}`}>
                    <span className="text-lg">{getWaterIcon(hike.water_availability)}</span>
                    <div>
                      <p className="font-medium">Wasser unterwegs</p>
                      <p className="text-sm opacity-80">{getWaterLabel(hike.water_availability)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200">
                    <span className="text-lg">💧</span>
                    <div>
                      <p className="font-medium text-stone-700">Wasser unterwegs</p>
                      <p className="text-sm text-stone-400">Keine Angabe – Wasser mitnehmen empfohlen</p>
                    </div>
                  </div>
                )}
                  {hike.hazard_notes && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="font-medium text-amber-800 mb-1">⚠️ Achtung</p>
                      <ExpandableText
                        text={hike.hazard_notes}
                        lines={3}
                        minChars={200}
                        className="text-sm text-amber-700 whitespace-pre-wrap"
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
                className="bg-white rounded-2xl p-6 border border-stone-200/50"
              >
                <h2 className="text-lg font-medium text-stone-800 mb-4">🐕 Mit dabei</h2>
                <div className="flex flex-wrap gap-4">
                  {hikeDogs.map((dog) => (
                    <div key={dog.id} className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
                      <img
                        src={dog.photo_url || `https://api.dicebear.com/7.x/thumbs/svg?seed=${dog.name}`}
                        alt={dog.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium text-stone-800">{dog.name}</p>
                        {dog.breed && <p className="text-sm text-stone-500">{dog.breed}</p>}
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
                className="bg-white rounded-2xl p-6 border border-stone-200/50"
              >
                <h2 className="text-lg font-medium text-stone-800 mb-4">Beschreibung & Tipps</h2>
                <ExpandableText text={hike.notes} lines={3} minChars={150} />
              </motion.div>
            )}

            {/* Photo Gallery */}
            {photos.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl p-6 border border-stone-200/50"
              >
                <h2 className="text-lg font-medium text-stone-800 mb-4">Fotos</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {photos.map((photo, index) => (
                    <div
                      key={index}
                      className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:ring-2 ring-slate-400 transition-all"
                      onClick={() => {
                        setCurrentPhotoIndex(index);
                        setLightboxOpen(true);
                      }}
                    >
                      <img
                        src={photo}
                        alt={`Photo ${index + 1}`}
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
                hikeId={hikeId}
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
                hikeId={hikeId}
                hikeSource={hike?._source === "journal" ? "journal" : "sheets"}
                canComment={canComment}
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && photos.length > 0 && (
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
