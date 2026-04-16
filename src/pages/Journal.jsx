import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  Plus, Mountain, Clock, Ruler, TrendingUp, Star, Trash2,
  BookOpen, LogIn, Loader2, Search, Filter, Dog
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { getJournalEntries, deleteJournalEntry } from "@/lib/journalApi";

const DIFFICULTY_LABEL = ["", "Sehr leicht", "Leicht", "Mittel", "Schwer", "Sehr schwer"];
const DIFFICULTY_COLOR = ["", "text-emerald-600", "text-green-600", "text-yellow-600", "text-orange-600", "text-red-600"];

function VisibilityStatusBadge({ visibility, status }) {
  // Public entries: show review status
  if (visibility === "public") {
    if (status === "approved") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
          ✅ Öffentlich
        </span>
      );
    }
    if (status === "rejected") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
          ❌ Abgelehnt
        </span>
      );
    }
    // pending or draft with public visibility
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">
        ⏳ Wartet auf Prüfung
      </span>
    );
  }
  if (visibility === "friends") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
        👥 Freunde
      </span>
    );
  }
  // private (default)
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 border border-stone-200">
      🔒 Privat
    </span>
  );
}

function StarRating({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-3.5 h-3.5 ${s <= rating ? "fill-yellow-400 text-yellow-400" : "text-stone-300"}`} />
      ))}
    </div>
  );
}

function StatsChip({ icon: Icon, value, unit, color = "text-stone-600" }) {
  if (!value) return null;
  return (
    <div className={`flex items-center gap-1 text-xs ${color}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span className="font-medium">{value}</span>
      {unit && <span className="text-stone-400">{unit}</span>}
    </div>
  );
}

export default function Journal() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["journal", user?.id],
    queryFn: () => getJournalEntries(user.id),
    enabled: !!user?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteJournalEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal", user?.id] });
      toast.success("Eintrag gelöscht");
    },
    onError: (e) => toast.error("Fehler: " + e.message),
  });

  // Summary stats
  const totalDistance = entries.reduce((s, e) => s + (Number(e.distance_km) || 0), 0);
  const totalElevation = entries.reduce((s, e) => s + (e.elevation_m || 0), 0);
  const totalHours = entries.reduce((s, e) => s + (e.duration_minutes || 0), 0) / 60;

  const filtered = entries.filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      e.title?.toLowerCase().includes(q) ||
      e.location?.toLowerCase().includes(q)
    );
  });

  // ── Not logged in ────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-emerald-50/20 flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 border border-stone-200/50 shadow-lg text-center max-w-md w-full"
        >
          <BookOpen className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-stone-800 mb-2">Wandertagebuch</h2>
          <p className="text-stone-500 mb-6 text-sm">
            Melde dich an, um deine persönlichen Wandererlebnisse festzuhalten.
          </p>
          <Link to={createPageUrl("Login")}>
            <Button className="bg-emerald-600 hover:bg-emerald-700 w-full">
              <LogIn className="w-4 h-4 mr-2" /> Anmelden
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-emerald-50/10 pb-24 md:pb-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6 md:mb-8 gap-4"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <BookOpen className="w-7 h-7 text-emerald-600" />
              Wandertagebuch
            </h1>
            <p className="text-stone-500 text-sm mt-0.5">Deine persönlichen Wandererlebnisse</p>
          </div>
          <Link to={createPageUrl("AddJournalEntry")}>
            <Button className="bg-emerald-600 hover:bg-emerald-700 shrink-0">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Neue Wanderung</span>
              <span className="sm:hidden">Neu</span>
            </Button>
          </Link>
        </motion.div>

        {/* Summary stats */}
        {entries.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="grid grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8"
          >
            {[
              { icon: Mountain, value: entries.length, label: "Wanderungen", color: "text-emerald-600" },
              { icon: Ruler, value: totalDistance.toFixed(0) + " km", label: "Gesamt", color: "text-blue-600" },
              { icon: TrendingUp, value: Math.round(totalElevation).toLocaleString() + " Hm", label: "Aufstieg", color: "text-orange-600" },
            ].map(({ icon: Icon, value, label, color }) => (
              <div key={label} className="bg-white rounded-xl p-3 md:p-4 border border-stone-200 text-center shadow-sm">
                <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
                <p className="text-lg md:text-xl font-bold text-stone-800">{value}</p>
                <p className="text-xs text-stone-500">{label}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Search */}
        {entries.length > 3 && (
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input
              placeholder="Suche nach Titel oder Ort..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white border-stone-200"
            />
          </div>
        )}

        {/* Entries */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-4">
            <AnimatePresence>
              {filtered.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ delay: index * 0.04 }}
                  className="bg-white rounded-2xl border border-stone-200/60 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className="flex gap-0 md:gap-0">
                    {/* Photo */}
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

                    {/* Content */}
                    <div className="flex-1 p-4 md:p-5 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-stone-800 text-base md:text-lg truncate">{entry.title}</h3>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-xs text-stone-400">
                              {format(new Date(entry.date), "d. MMMM yyyy", { locale: de })}
                            </span>
                            {entry.location && (
                              <span className="text-xs text-stone-500 truncate">📍 {entry.location}</span>
                            )}
                            <VisibilityStatusBadge
                              visibility={entry.visibility ?? "private"}
                              status={entry.status ?? "draft"}
                            />
                          </div>
                        </div>
                        {entry.rating && <StarRating rating={entry.rating} />}
                      </div>

                      {/* Stats row */}
                      <div className="flex flex-wrap gap-3 my-2">
                        <StatsChip icon={Ruler} value={entry.distance_km} unit="km" />
                        <StatsChip icon={TrendingUp} value={entry.elevation_m} unit="Hm" color="text-orange-600" />
                        <StatsChip icon={Clock} value={entry.duration_minutes ? Math.round(entry.duration_minutes / 60 * 10) / 10 : null} unit="Std" color="text-blue-600" />
                        {entry.difficulty && (
                          <span className={`text-xs font-medium ${DIFFICULTY_COLOR[entry.difficulty]}`}>
                            ⚡ {DIFFICULTY_LABEL[entry.difficulty]}
                          </span>
                        )}
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {entry.dog_suitable && (
                          <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                            🐕 Hundefreundlich
                          </Badge>
                        )}
                        {entry.water_available > 0 && (
                          <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            {"💧".repeat(entry.water_available)} Wasser
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

                      {/* Actions */}
                      <div className="flex gap-2 mt-3">
                        <Link to={`${createPageUrl("AddJournalEntry")}?id=${entry.id}`}>
                          <Button size="sm" variant="outline" className="h-7 text-xs">
                            Bearbeiten
                          </Button>
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Eintrag löschen?</AlertDialogTitle>
                              <AlertDialogDescription>
                                „{entry.title}" wird dauerhaft gelöscht. Das kann nicht rückgängig gemacht werden.
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
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : entries.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-24 bg-white rounded-2xl border border-stone-200/50"
          >
            <BookOpen className="w-14 h-14 text-stone-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-stone-700 mb-2">Noch keine Einträge</h3>
            <p className="text-stone-500 mb-6 text-sm max-w-xs mx-auto">
              Halte deine Wanderungen fest — mit Fotos, Stats und persönlichen Notizen.
            </p>
            <Link to={createPageUrl("AddJournalEntry")}>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" /> Erste Wanderung eintragen
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="text-center py-12 text-stone-500 text-sm">
            Keine Ergebnisse für „{search}"
          </div>
        )}
      </div>
    </div>
  );
}
