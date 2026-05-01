import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  Plus,
  Mountain,
  Star,
  Trash2,
  BookOpen,
  LogIn,
  Loader2,
  Search,
  User,
  Users,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { getJournalEntriesForDisplay, deleteJournalEntry } from "@/lib/journalApi";
import WaterIcon from "@/components/icons/WaterIcon";
import { getDifficultyLabel, getDifficultyTextColor, getWaterBadgeClass, getWaterLabel, TOUR_ICONS } from "@/lib/difficultyConfig";

const PAGE_SIZE = 20;

function VisibilityStatusBadge({ visibility, status }) {
  if (visibility === "public") {
    if (status === "approved") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-brand-100 text-brand-600 border border-brand-200">
          <Globe className="w-3 h-3" />
          Öffentlich sichtbar
        </span>
      );
    }

    if (status === "rejected") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
          <Globe className="w-3 h-3" />
          Abgelehnt
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">
        <Globe className="w-3 h-3" />
        Wartet auf Prüfung
      </span>
    );
  }

  if (visibility === "friends") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
        <Users className="w-3 h-3" />
        Mit Freunden geteilt
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 border border-stone-200">
      <User className="w-3 h-3" />
      Privat
    </span>
  );
}

function StarRating({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-3.5 h-3.5 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-stone-300"}`}
        />
      ))}
    </div>
  );
}

function StatsChip({ icon, value, unit, color = "text-stone-600" }) {
  if (!value) return null;

  return (
    <div className={`flex items-center gap-1 text-xs ${color}`}>
      <span className="text-sm leading-none shrink-0">{icon}</span>
      <span className="font-medium">{value}</span>
      {unit && <span className="text-stone-400">{unit}</span>}
    </div>
  );
}

export default function Journal() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["journal", user?.id],
    queryFn: () => getJournalEntriesForDisplay(user.id),
    enabled: !!user?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteJournalEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["allHikes"] });
      queryClient.invalidateQueries({ queryKey: ["journalEntry"] });
      queryClient.invalidateQueries({ queryKey: ["savedHikes", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
      toast.success("Eintrag gelöscht");
    },
    onError: () => {
      toast.error("Der Eintrag konnte gerade nicht gelöscht werden. Bitte versuche es noch einmal.");
    },
  });

  const totalDistance = entries.reduce((sum, entry) => sum + (Number(entry.distance_km) || 0), 0);
  const totalElevation = entries.reduce((sum, entry) => sum + (entry.elevation_m || 0), 0);

  const filtered = entries.filter((entry) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;

    return (
      entry.title?.toLowerCase().includes(query) ||
      entry.location?.toLowerCase().includes(query)
    );
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-brand-50/20 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 border border-stone-200/50 shadow-lg text-center max-w-md w-full"
        >
          <BookOpen className="w-12 h-12 text-brand-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-stone-800 mb-2">Wandertagebuch</h2>
          <p className="text-stone-500 mb-6 text-sm">
            Melde dich an, um deine persönlichen Wandererlebnisse festzuhalten.
          </p>
          <Link to={createPageUrl("Login")}>
            <Button className="bg-brand-400 hover:bg-brand-600 w-full">
              <LogIn className="w-4 h-4 mr-2" /> Anmelden
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-brand-50/10 pb-24 md:pb-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6 md:mb-8 gap-4"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold text-stone-800">Wandertagebuch</h1>
              <p className="mt-1 text-sm text-stone-500">Deine persönlichen Wandererlebnisse</p>
            </div>
          </div>
          <Link to={createPageUrl("AddJournalEntry")}>
            <Button className="bg-brand-400 hover:bg-brand-600 shrink-0">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Neue Wanderung</span>
              <span className="sm:hidden">Neu</span>
            </Button>
          </Link>
        </motion.div>

        {entries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="grid grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8"
          >
            {[
              { icon: Mountain, value: entries.length, label: "Wanderungen", color: "text-brand-400" },
              { icon: TOUR_ICONS.distance, value: `${totalDistance.toFixed(0)} km`, label: "Gesamt", color: "text-blue-600" },
              { icon: TOUR_ICONS.elevation, value: `${Math.round(totalElevation).toLocaleString()} Hm`, label: "Aufstieg", color: "text-orange-600" },
            ].map(({ icon, value, label, color }) => (
              <div key={label} className="bg-white rounded-xl p-3 md:p-4 border border-stone-200 text-center shadow-sm">
                {typeof icon === "string" ? (
                  <span className={`block text-xl ${color} mb-1`}>{icon}</span>
                ) : (
                  <Mountain className={`w-5 h-5 ${color} mx-auto mb-1`} />
                )}
                <p className="text-lg md:text-xl font-bold text-stone-800">{value}</p>
                <p className="text-xs text-stone-500">{label}</p>
              </div>
            ))}
          </motion.div>
        )}

        {entries.length > 3 && (
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input
              placeholder="Suche nach Titel oder Ort..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9 bg-white border-stone-200"
            />
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-4">
            <AnimatePresence>
              {filtered.slice(0, visible).map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ delay: index * 0.04 }}
                  className="bg-white rounded-2xl border border-stone-200/60 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  <Link to={`${createPageUrl("JournalDetail")}?id=${entry.id}`} className="block">
                    <div className="flex gap-0 md:gap-0">
                      {entry.photos?.[0] && (
                        <div className="w-28 md:w-48 shrink-0">
                          <img
                            src={entry.photos[0]}
                            alt={entry.title}
                            className="w-full h-full object-cover"
                            style={{ minHeight: "120px", maxHeight: "180px" }}
                          />
                        </div>
                      )}

                      <div className="flex-1 p-4 md:p-5 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-stone-800 text-base md:text-lg truncate">{entry.title}</h3>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-xs text-stone-400">
                                {format(new Date(entry.date), "d. MMMM yyyy", { locale: de })}
                              </span>
                              {entry.location && (
                                <span className="text-xs text-stone-500 truncate">{entry.location}</span>
                              )}
                              <VisibilityStatusBadge
                                visibility={entry.visibility ?? "private"}
                                status={entry.status ?? "draft"}
                              />
                            </div>
                          </div>
                          {entry.rating && <StarRating rating={entry.rating} />}
                        </div>

                        <div className="flex flex-wrap gap-3 my-2">
                          <StatsChip icon={TOUR_ICONS.distance} value={entry.distance_km} unit="km" />
                          <StatsChip icon={TOUR_ICONS.elevation} value={entry.elevation_m} unit="Hm" color="text-orange-600" />
                          <StatsChip
                            icon={TOUR_ICONS.duration}
                            value={entry.duration_minutes ? Math.round((entry.duration_minutes / 60) * 10) / 10 : null}
                            unit="Std"
                            color="text-blue-600"
                          />
                          {entry.difficulty && (
                            <span className={`text-xs font-medium ${getDifficultyTextColor(entry.difficulty)}`}>
                              {TOUR_ICONS.human} {getDifficultyLabel(entry.difficulty)}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {entry.dog_suitable && (
                            <Badge variant="secondary" className="text-xs bg-brand-50 text-brand-600 border-brand-200">
                              Hundefreundlich
                            </Badge>
                          )}
                          {entry.water_available !== null && entry.water_available !== undefined && (
                              <Badge
                                variant="secondary"
                                className={`text-xs border ${getWaterBadgeClass(entry.water_available)}`}
                              >
                                <WaterIcon value={entry.water_available} /> {getWaterLabel(entry.water_available) ?? getWaterLabel(0)}
                              </Badge>
                          )}
                          {entry.gpx_url && (
                            <Badge variant="secondary" className="text-xs bg-stone-100 text-stone-600">
                              GPX
                            </Badge>
                          )}
                        </div>

                        {entry.description && (
                          <p className="text-xs text-stone-500 line-clamp-2">{entry.description}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                  <div className="px-4 md:px-5 pb-4 md:pb-5">
                    <div className="flex gap-2 mt-3">
                      <Link to={`${createPageUrl("AddJournalEntry")}?id=${entry.id}`}>
                        <Button size="sm" variant="outline" className="h-7 text-xs">
                          Bearbeiten
                        </Button>
                      </Link>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Eintrag löschen?</AlertDialogTitle>
                            <AlertDialogDescription>
                              "{entry.title}" wird dauerhaft gelöscht. Das kann nicht rückgängig gemacht werden.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(entry.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Löschen
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {visible < filtered.length && (
              <div className="text-center pt-2">
                <button
                  onClick={() => setVisible((value) => value + PAGE_SIZE)}
                  className="text-sm text-brand-400 hover:text-brand-600 font-medium px-4 py-2 rounded-xl hover:bg-brand-50 transition-colors"
                >
                  {filtered.length - visible} weitere Einträge laden
                </button>
              </div>
            )}
          </div>
        ) : entries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24 bg-white rounded-2xl border border-stone-200/50"
          >
            <BookOpen className="w-14 h-14 text-stone-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-stone-700 mb-2">Noch keine Einträge</h3>
            <p className="text-stone-500 mb-6 text-sm max-w-xs mx-auto">
              Halte deine Wanderungen fest - mit Fotos, Daten und persönlichen Notizen.
            </p>
            <Link to={createPageUrl("AddJournalEntry")}>
              <Button className="bg-brand-400 hover:bg-brand-600">
                <Plus className="w-4 h-4 mr-2" /> Erste Wanderung eintragen
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="text-center py-12 text-stone-500 text-sm">
            Keine Ergebnisse für "{search}"
          </div>
        )}
      </div>
    </div>
  );
}


