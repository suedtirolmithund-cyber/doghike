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
import { formatDurationHours } from "@/lib/duration";
import { matchesTextSearch } from "@/lib/hikeSearch";

const PAGE_SIZE = 20;

const COUNTRY_ALIASES = [
  { label: "Italien", aliases: ["italien", "italy", "südtirol", "suedtirol", "dolomiten", "trentino", "alto adige"] },
  { label: "Österreich", aliases: ["österreich", "oesterreich", "austria", "tirol", "osttirol", "salzburg"] },
  { label: "Deutschland", aliases: ["deutschland", "germany", "bayern", "bavaria"] },
  { label: "Schweiz", aliases: ["schweiz", "switzerland", "suisse", "svizzera"] },
  { label: "Frankreich", aliases: ["frankreich", "france"] },
  { label: "Spanien", aliases: ["spanien", "spain", "espana", "españa"] },
  { label: "Kroatien", aliases: ["kroatien", "croatia", "hrvatska"] },
  { label: "Slowenien", aliases: ["slowenien", "slovenia", "slovenija"] },
];

function getJournalCountry(entry) {
  const explicitCountry = typeof entry?.country === "string" ? entry.country.trim() : "";
  const source = explicitCountry || entry?.location || "";
  const normalized = source
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const matchedCountry = COUNTRY_ALIASES.find(({ aliases }) =>
    aliases.some((alias) =>
      normalized.includes(alias.normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
    )
  );

  return matchedCountry?.label || explicitCountry || null;
}

function VisibilityStatusBadge({ visibility, status }) {
  if (visibility === "public") {
    if (status === "approved") {
      return (
        <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-brand-200 bg-brand-100 px-3 py-1 text-sm font-semibold text-brand-600 md:text-xs">
          <Globe className="w-3 h-3" />
          Öffentlich sichtbar
        </span>
      );
    }

    if (status === "rejected") {
      return (
        <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-brand-100 bg-brand-100 px-3 py-1 text-sm font-semibold text-brand-500 md:text-xs">
          <Globe className="w-3 h-3" />
          Abgelehnt
        </span>
      );
    }

    return (
      <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-brand-100 bg-brand-100 px-3 py-1 text-sm font-semibold text-brand-600 md:text-xs">
        <Globe className="w-3 h-3" />
        Wartet auf Prüfung
      </span>
    );
  }

  if (visibility === "friends") {
    return (
      <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700 md:text-xs">
        <Users className="w-3 h-3" />
        Mit Freunden geteilt
      </span>
    );
  }

  return (
    <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-brand-100 bg-brand-100/80 px-3 py-1 text-sm font-semibold text-slate-500 md:text-xs">
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
          className={`w-3.5 h-3.5 ${star <= rating ? "fill-brand-100 text-brand-100" : "text-slate-300"}`}
        />
      ))}
    </div>
  );
}

function StatsChip({ icon, value, unit, color = "text-[#C07820]" }) {
  if (!value) return null;

  return (
    <div className={`flex min-h-8 w-full min-w-0 items-center justify-center gap-1 rounded-full bg-brand-50/70 px-2 py-1 text-center text-sm leading-tight ${color}`}>
      <span className="text-sm leading-none shrink-0">{icon}</span>
      <span className="min-w-0 break-words font-medium">{value}</span>
      {unit && <span className="shrink-0 text-[#C07820]/75">{unit}</span>}
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
      toast.success("Der Eintrag ist weg.");
    },
    onError: () => {
      toast.error("Das Löschen hat gerade nicht geklappt.");
    },
  });

  const totalDistance = entries.reduce((sum, entry) => sum + (Number(entry.distance_km) || 0), 0);
  const totalElevation = entries.reduce((sum, entry) => sum + (entry.elevation_m || 0), 0);
  const countryCount = new Set(entries.map(getJournalCountry).filter(Boolean)).size;
  const statsItems = [
    { icon: TOUR_ICONS.map, value: entries.length, label: "Wanderungen", color: "text-brand-400" },
    { icon: TOUR_ICONS.distance, value: `${totalDistance.toFixed(0)} km`, label: "Gesamt", color: "text-brand-600" },
    { icon: TOUR_ICONS.elevation, value: `${Math.round(totalElevation).toLocaleString()} Hm`, label: "Aufstieg", color: "text-brand-500" },
    ...(countryCount >= 2
      ? [{ icon: TOUR_ICONS.country, value: countryCount, label: "Länder", color: "text-brand-500" }]
      : []),
  ];

  const filtered = entries.filter((entry) => {
    return matchesTextSearch(
      [
        entry.title,
        entry.location,
        entry.description,
        entry.visibility,
      ],
      search
    );
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 to-brand-50/20 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="doghike-glass-card p-8 text-center max-w-md w-full"
        >
          <BookOpen className="w-12 h-12 text-brand-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Wandertagebuch</h2>
          <p className="text-slate-500 mb-6 text-sm">
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
    <div className="doghike-page-shell">
      <div className="mx-auto w-full max-w-5xl px-4 pb-32 pt-6 sm:px-6 md:py-10 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 md:mb-8"
        >
          <div className="doghike-page-header mb-0">
            <div className="doghike-page-icon">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="doghike-page-title">Wandertagebuch</h1>
              <p className="doghike-page-subtitle">Deine persönlichen Wandererlebnisse</p>
              {entries.length > 0 && (
                <Link to={createPageUrl("AddJournalEntry")} className="mt-3 inline-flex">
                  <Button className="doghike-primary-action doghike-compact-action">
                    <Plus className="w-4 h-4 mr-2" />
                    Wanderung
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </motion.div>

        {entries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className={`mb-5 grid gap-2.5 md:mb-7 md:gap-4 ${
              countryCount >= 2 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"
            }`}
          >
            {statsItems.map(({ icon, value, label, color }) => (
              <div
                key={label}
                className="doghike-glass-card rounded-xl border-brand-100/90 bg-gradient-to-br from-white/88 to-brand-50/45 px-3 py-3 md:px-3 md:py-2.5"
              >
                <div className="flex items-center justify-center gap-2.5">
                  {typeof icon === "string" ? (
                    <span className={`block text-sm leading-none ${color} md:text-base`}>{icon}</span>
                  ) : (
                    <Mountain className={`h-4 w-4 ${color}`} />
                  )}
                  <div className="min-w-0 text-left">
                    <p className="text-lg font-bold leading-tight text-[#7C3020] md:text-lg">{value}</p>
                    <p className="text-xs leading-tight text-[#C07820]">{label}</p>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {entries.length > 3 && (
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Suche nach Titel oder Ort..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="border-brand-100 bg-white/75 pl-9 shadow-sm"
            />
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
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
                  className="doghike-glass-card-hover overflow-hidden"
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
                            <h3 className="font-semibold text-slate-900 text-base md:text-lg truncate">{entry.title}</h3>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-xs text-slate-400">
                                {format(new Date(entry.date), "d. MMMM yyyy", { locale: de })}
                              </span>
                              {entry.location && (
                                <span className="text-xs text-slate-500 truncate">{entry.location}</span>
                              )}
                              <VisibilityStatusBadge
                                visibility={entry.visibility ?? "private"}
                                status={entry.status ?? "draft"}
                              />
                            </div>
                          </div>
                          {entry.rating && <StarRating rating={entry.rating} />}
                        </div>

                        <div className="my-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                          <StatsChip icon={TOUR_ICONS.distance} value={entry.distance_km} unit="km" />
                          <StatsChip icon={TOUR_ICONS.elevation} value={entry.elevation_m} unit="Hm" color="text-brand-500" />
                          <StatsChip
                            icon={TOUR_ICONS.duration}
                            value={formatDurationHours(entry.duration_minutes)}
                            unit=""
                            color="text-brand-600"
                          />
                          {entry.difficulty && (
                            <span className={`inline-flex min-h-8 w-full max-w-full min-w-0 flex-wrap items-center justify-center gap-1 rounded-full bg-brand-50/70 px-2 py-1 text-center text-sm font-medium leading-tight whitespace-normal break-words sm:w-auto sm:px-2.5 ${getDifficultyTextColor(entry.difficulty)}`}>
                              {TOUR_ICONS.human} {getDifficultyLabel(entry.difficulty)}
                            </span>
                          )}
                          {entry.dog_difficulty && (
                            <span className={`inline-flex min-h-8 w-full max-w-full min-w-0 flex-wrap items-center justify-center gap-1 rounded-full bg-brand-50/70 px-2 py-1 text-center text-sm font-medium leading-tight whitespace-normal break-words sm:w-auto sm:px-2.5 ${getDifficultyTextColor(entry.dog_difficulty)}`}>
                              {TOUR_ICONS.dog} {getDifficultyLabel(entry.dog_difficulty)}
                            </span>
                          )}
                        </div>

                        <div className="mb-2 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                          {entry.dog_suitable && (
                            <Badge variant="secondary" className="min-h-8 w-full border-brand-200 bg-brand-50 px-2 py-1 text-sm text-brand-600 sm:w-auto md:px-3 md:text-xs">
                              Hundefreundlich
                            </Badge>
                          )}
                          {entry.water_available !== null && entry.water_available !== undefined && (
                              <Badge
                                variant="secondary"
                                className={`min-h-8 w-full border px-2 py-1 text-sm sm:w-auto md:px-3 md:text-xs ${getWaterBadgeClass(entry.water_available)}`}
                              >
                                <WaterIcon value={entry.water_available} /> {getWaterLabel(entry.water_available) ?? getWaterLabel(0)}
                              </Badge>
                          )}
                          {entry.gpx_url && (
                            <Badge variant="secondary" className="min-h-8 w-full bg-brand-100/80 px-2 py-1 text-sm text-slate-600 sm:w-auto md:px-3 md:text-xs">
                              GPX
                            </Badge>
                          )}
                        </div>

                        {entry.description && (
                          <p className="line-clamp-3 text-sm leading-5 text-[#C07820]">{entry.description}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                  <div className="px-4 md:px-5 pb-4 md:pb-5">
                    <div className="mt-3 flex gap-2">
                      <Link to={`${createPageUrl("AddJournalEntry")}?id=${entry.id}`}>
                        <Button size="sm" variant="outline" className="doghike-secondary-action rounded-xl">
                          Bearbeiten
                        </Button>
                      </Link>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="min-h-10 text-sm text-brand-500 hover:bg-brand-50 hover:text-brand-400 md:min-h-9"
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
                              className="bg-brand-400 hover:bg-brand-500"
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
            className="doghike-empty-state py-24"
          >
            <BookOpen className="doghike-empty-icon" />
            <h3 className="text-xl font-medium text-slate-700 mb-2">Noch keine Wanderungen</h3>
            <p className="text-slate-500 mb-6 text-sm max-w-xs mx-auto">
              Halte den ersten Tag mit deinem Hund fest. Fotos, Strecke, Gefühl.
            </p>
            <Link to={createPageUrl("AddJournalEntry")}>
              <Button className="bg-brand-400 hover:bg-brand-600">
                <Plus className="w-4 h-4 mr-2" /> Erste Wanderung
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="doghike-empty-state">
            <Search className="doghike-empty-icon" />
            <p className="text-slate-600 font-medium mb-1">Nichts Passendes gefunden</p>
            <p className="text-slate-400 text-sm mb-4">Für „{search}“ wurde nichts gefunden.</p>
            <Button variant="outline" onClick={() => setSearch("")}>
              Suche zurücksetzen
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}


