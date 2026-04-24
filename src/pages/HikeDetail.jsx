import { useState } from "react";
import { getAllHikes } from "@/api/sheetsClient";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, MapPin, Calendar, Clock, Mountain, Route, Edit, Trash2, ChevronLeft, ChevronRight, X, Globe, Share2, Check
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

const waterConfig = {
  none: { label: "Kein Wasser unterwegs", color: "bg-red-100 text-red-700", icon: "🚫" },
  little: { label: "Wenig Wasser", color: "bg-orange-100 text-orange-700", icon: "💧" },
  moderate: { label: "Etwas Wasser", color: "bg-blue-100 text-blue-600", icon: "💧💧" },
  plenty: { label: "Viel Wasser", color: "bg-blue-100 text-blue-700", icon: "💧💧💧" }
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

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: hike?.trail_name, url });
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const { data: hike, isLoading } = useQuery({
    queryKey: ["hike", hikeSource, hikeId],
    queryFn: async () => {
      const hikes = await getAllHikes();
      return hikes.find((h) => h.id === hikeId && (h._source ?? "sheets") === hikeSource);
    },
    enabled: !!hikeId
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
        .single();

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
      navigate(createPageUrl("Hikes"));
    },
  });

  if (isLoading || !hike) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-pulse text-stone-400">Lädt...</div>
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
            {isOwnJournalHike && (
              <>
                <Link to={createPageUrl("AddJournalEntry") + `?id=${hike?._journal_id}`}>
                  <Button variant="ghost" className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20">
                    <Edit className="w-4 h-4 mr-1" />
                    Bearbeiten
                  </Button>
                </Link>
                <AlertDialog>
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
                </AlertDialog>
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
            <div className="flex items-center gap-3 text-white/80">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
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
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
        >
          {country && (
            <div className="bg-white rounded-2xl p-5 border border-stone-200/50 text-center">
              <Globe className="w-5 h-5 text-stone-400 mx-auto mb-2" />
              <p className="text-lg font-medium text-stone-800">{country}</p>
              <p className="text-sm text-stone-500">Land</p>
            </div>
          )}
          <div className="bg-white rounded-2xl p-5 border border-stone-200/50 text-center">
            <Calendar className="w-5 h-5 text-stone-400 mx-auto mb-2" />
            <p className="text-lg font-medium text-stone-800">
              {hike.date && format(new Date(hike.date), "dd.MM.yyyy")}
            </p>
            <p className="text-sm text-stone-500">Datum</p>
          </div>
          {hike.distance_km && (
            <div className="bg-white rounded-2xl p-5 border border-stone-200/50 text-center">
              <Route className="w-5 h-5 text-stone-400 mx-auto mb-2" />
              <p className="text-lg font-medium text-stone-800">{hike.distance_km} km</p>
              <p className="text-sm text-stone-500">Strecke</p>
            </div>
          )}
          {hike.elevation_gain_m && (
            <div className="bg-white rounded-2xl p-5 border border-stone-200/50 text-center">
              <Mountain className="w-5 h-5 text-stone-400 mx-auto mb-2" />
              <p className="text-lg font-medium text-stone-800">{hike.elevation_gain_m} m</p>
              <p className="text-sm text-stone-500">Höhenmeter</p>
            </div>
          )}
          {hike.duration_minutes && (
            <div className="bg-white rounded-2xl p-5 border border-stone-200/50 text-center">
              <Clock className="w-5 h-5 text-stone-400 mx-auto mb-2" />
              <p className="text-lg font-medium text-stone-800">
                {(hike.duration_minutes / 60).toFixed(1)} Std
              </p>
              <p className="text-sm text-stone-500">Gehzeit</p>
            </div>
          )}
          {hike.difficulty && (
            <div className="bg-white rounded-2xl p-5 border border-stone-200/50 text-center">
              <Mountain className="w-5 h-5 text-stone-400 mx-auto mb-2" />
              <p className="text-lg font-medium text-stone-800">
                {"⬛".repeat(Number(hike.difficulty))}{"⬜".repeat(5 - Number(hike.difficulty))}
              </p>
              <p className="text-sm text-stone-500">Stufe {hike.difficulty} / Mensch</p>
            </div>
          )}
          {hike.dog_difficulty && (
            <div className="bg-white rounded-2xl p-5 border border-stone-200/50 text-center">
              <span className="text-xl block mb-1">🦴</span>
              <p className="text-lg font-medium text-stone-800">
                {"🦴".repeat(Number(hike.dog_difficulty))}
              </p>
              <p className="text-sm text-stone-500">Stufe {hike.dog_difficulty} / Hund</p>
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
                {hike.water_availability && waterConfig[hike.water_availability] ? (
                  <div className={`flex items-center gap-3 p-3 rounded-xl ${waterConfig[hike.water_availability].color}`}>
                    <span className="text-lg">{waterConfig[hike.water_availability].icon}</span>
                    <div>
                      <p className="font-medium">Wasser unterwegs</p>
                      <p className="text-sm opacity-80">{waterConfig[hike.water_availability].label}</p>
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
