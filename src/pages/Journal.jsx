import { useEffect, useState } from "react";
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
  Search,
  User,
  Users,
  Globe,
  LayoutGrid,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionLoadingState } from "@/components/ui/AppState";
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
import DifficultyScaleChip from "@/components/difficulty/DifficultyScale";
import { getWaterBadgeClass, getWaterLabel, TOUR_ICONS } from "@/lib/difficultyConfig";
import { formatDurationHours } from "@/lib/duration";
import { matchesTextSearch } from "@/lib/hikeSearch";
import { getDisplayImageUrl } from "@/lib/imageProxy";
import { getJournalCountryLabel } from "@/lib/countries";

const MOBILE_PAGE_SIZE = 8;
const DESKTOP_PAGE_SIZE = 10;

function VisibilityStatusBadge({ visibility, status }) {
  if (visibility === "public") {
    if (status === "approved") {
      return (
        <span className="inline-flex min-h-8 max-w-full min-w-0 flex-wrap items-center justify-center gap-1.5 rounded-full border border-brand-200 bg-brand-100 px-3 py-1 text-center text-sm font-semibold leading-tight text-brand-600 whitespace-normal break-words md:text-xs">
          <Globe className="w-3 h-3" />
          Öffentlich sichtbar
        </span>
      );
    }

    if (status === "rejected") {
      return (
        <span className="inline-flex min-h-8 max-w-full min-w-0 flex-wrap items-center justify-center gap-1.5 rounded-full border border-brand-100 bg-brand-100 px-3 py-1 text-center text-sm font-semibold leading-tight text-brand-500 whitespace-normal break-words md:text-xs">
          <Globe className="w-3 h-3" />
          Abgelehnt
        </span>
      );
    }

    return (
      <span className="inline-flex min-h-8 max-w-full min-w-0 flex-wrap items-center justify-center gap-1.5 rounded-full border border-brand-100 bg-brand-100 px-3 py-1 text-center text-sm font-semibold leading-tight text-brand-600 whitespace-normal break-words md:text-xs">
        <Globe className="w-3 h-3" />
        Wartet auf Prüfung
      </span>
    );
  }

  if (visibility === "friends") {
    return (
      <span className="inline-flex min-h-8 max-w-full min-w-0 flex-wrap items-center justify-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-center text-sm font-semibold leading-tight text-brand-700 whitespace-normal break-words md:text-xs">
        <Users className="w-3 h-3" />
        Mit Freunden geteilt
      </span>
    );
  }

  return (
    <span className="inline-flex min-h-8 max-w-full min-w-0 flex-wrap items-center justify-center gap-1.5 rounded-full border border-brand-100 bg-brand-100/80 px-3 py-1 text-center text-sm font-semibold leading-tight text-slate-500 whitespace-normal break-words md:text-xs">
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
          className={`w-3.5 h-3.5 ${star <= rating ? "fill-brand-400 text-brand-400" : "text-slate-300"}`}
        />
      ))}
    </div>
  );
}

function StatsChip({ icon, value, unit, color = "text-[#C07820]" }) {
  if (!value) return null;

  return (
    <div className={`flex min-h-8 w-full min-w-0 max-w-full flex-wrap items-center justify-center gap-1 rounded-full bg-brand-50/70 px-1.5 py-1 text-center text-xs leading-tight whitespace-normal break-words sm:w-auto sm:px-2 sm:text-sm ${color}`}>
      <span className="text-sm leading-none shrink-0">{icon}</span>
      <span className="min-w-0 max-w-full break-words font-medium">{value}</span>
      {unit && <span className="min-w-0 max-w-full break-words text-[#C07820]/75">{unit}</span>}
    </div>
  );
}

function JournalEntryActions({ entry, onDelete }) {
  return (
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
              onClick={() => onDelete(entry.id)}
              className="bg-brand-400 hover:bg-brand-500"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function JournalEntryMeta({ entry, compact = false }) {
  return (
    <>
      <div className={`${compact ? "mb-3" : "my-3"} grid grid-cols-2 gap-2 sm:flex sm:flex-wrap`}>
        <StatsChip icon={TOUR_ICONS.distance} value={entry.distance_km} unit="km" />
        <StatsChip icon={TOUR_ICONS.elevation} value={entry.elevation_m} unit="Hm" color="text-brand-500" />
        <StatsChip
          icon={TOUR_ICONS.duration}
          value={formatDurationHours(entry.duration_minutes)}
          unit=""
          color="text-brand-600"
        />
        {entry.difficulty && (
          <DifficultyScaleChip level={entry.difficulty} type="human" className={compact ? "w-full" : "w-full sm:w-auto"} />
        )}
        {entry.dog_difficulty && (
          <DifficultyScaleChip
            level={entry.dog_difficulty}
            type="dog"
            className={compact ? "col-span-2 w-full" : "w-full sm:w-auto"}
          />
        )}
      </div>

      <div className={`mb-2 ${compact ? "flex flex-wrap" : "grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"} gap-2`}>
        {entry.dog_suitable && (
          <Badge variant="secondary" className={`${compact ? "" : "w-full sm:w-auto"} min-h-8 border-brand-200 bg-brand-50 px-2 py-1 text-sm text-brand-600 md:px-3 md:text-xs`}>
            Hundefreundlich
          </Badge>
        )}
        {entry.water_available !== null && entry.water_available !== undefined && (
          <Badge
            variant="secondary"
            className={`${compact ? "" : "w-full sm:w-auto"} min-h-8 border px-2 py-1 text-sm md:px-3 md:text-xs ${getWaterBadgeClass(entry.water_available)}`}
          >
            <WaterIcon value={entry.water_available} /> {getWaterLabel(entry.water_available) ?? getWaterLabel(0)}
          </Badge>
        )}
        {entry.gpx_url && (
          <Badge variant="secondary" className={`${compact ? "" : "w-full sm:w-auto"} min-h-8 bg-brand-100/80 px-2 py-1 text-sm text-slate-600 md:px-3 md:text-xs`}>
            GPX
          </Badge>
        )}
      </div>
    </>
  );
}

function JournalGridCard({ entry, index, onDelete }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ delay: index * 0.04 }}
      className="doghike-glass-card-hover overflow-hidden"
    >
      <Link to={`${createPageUrl("JournalDetail")}?id=${entry.id}`} className="block">
        {entry.photos?.[0] && (
          <div className="h-48 w-full overflow-hidden">
            <img
              src={getDisplayImageUrl(entry.photos[0], { width: 1000, quality: 82 })}
              alt={entry.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="p-4 md:p-5">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="doghike-card-title line-clamp-2">{entry.title}</h3>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400">
                  {format(new Date(entry.date), "d. MMMM yyyy", { locale: de })}
                </span>
                {entry.location && <span className="text-xs text-slate-500">{entry.location}</span>}
              </div>
            </div>
            {entry.rating && <StarRating rating={entry.rating} />}
          </div>

          <div className="mb-3">
            <VisibilityStatusBadge
              visibility={entry.visibility ?? "private"}
              status={entry.status ?? "draft"}
            />
          </div>

          <JournalEntryMeta entry={entry} compact />

          {entry.description && (
            <p className="line-clamp-3 text-sm leading-5 text-[#C07820]">{entry.description}</p>
          )}
        </div>
      </Link>
      <div className="px-4 pb-4 md:px-5 md:pb-5">
        <JournalEntryActions entry={entry} onDelete={onDelete} />
      </div>
    </motion.div>
  );
}

function JournalListRow({ entry, index, onDelete }) {
  return (
    <motion.div
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
                src={getDisplayImageUrl(entry.photos[0], { width: 1000, quality: 82 })}
                alt={entry.title}
                className="w-full h-full object-cover"
                style={{ minHeight: "120px", maxHeight: "180px" }}
              />
            </div>
          )}

          <div className="flex-1 p-4 md:p-5 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="min-w-0 flex-1">
                <h3 className="doghike-card-title truncate">{entry.title}</h3>
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

            <JournalEntryMeta entry={entry} />

            {entry.description && (
              <p className="line-clamp-3 text-sm leading-5 text-[#C07820]">{entry.description}</p>
            )}
          </div>
        </div>
      </Link>
      <div className="px-4 md:px-5 pb-4 md:pb-5">
        <JournalEntryActions entry={entry} onDelete={onDelete} />
      </div>
    </motion.div>
  );
}

export default function Journal() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [pageSize, setPageSize] = useState(MOBILE_PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["journal", user?.id],
    queryFn: () => getJournalEntriesForDisplay(user.id),
    enabled: !!user?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteJournalEntry,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["journal", user?.id] });
      const previous = queryClient.getQueryData(["journal", user?.id]);
      queryClient.setQueryData(["journal", user?.id], (old) =>
        Array.isArray(old) ? old.filter((e) => e.id !== id) : old
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(["journal", user?.id], context?.previous);
      toast.error("Das Löschen hat gerade nicht geklappt.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allHikes"] });
      queryClient.invalidateQueries({ queryKey: ["journalEntry"] });
      queryClient.invalidateQueries({ queryKey: ["savedHikes", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
      toast.success("Der Eintrag ist weg.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["journal", user?.id] });
    },
  });

  const totalDistance = entries.reduce((sum, entry) => sum + (Number(entry.distance_km) || 0), 0);
  const totalElevation = entries.reduce((sum, entry) => sum + (entry.elevation_m || 0), 0);
  const countryCount = new Set(entries.map(getJournalCountryLabel).filter(Boolean)).size;
  const statsItems = [
    { icon: TOUR_ICONS.map, value: entries.length, label: "Wanderungen", color: "text-brand-400" },
    { icon: TOUR_ICONS.distance, value: `${totalDistance.toFixed(0)} km`, label: "Gesamt", color: "text-brand-600" },
    { icon: TOUR_ICONS.elevation, value: `${Math.round(totalElevation).toLocaleString()} Hm`, label: "Aufstieg", color: "text-brand-500" },
    ...(countryCount >= 2
      ? [{ icon: TOUR_ICONS.country, value: countryCount, label: "Länder", color: "text-brand-500" }]
      : []),
  ];

  const filtered = entries.filter((entry) =>
    matchesTextSearch(
      [entry.title, entry.location, entry.description, entry.visibility],
      search
    )
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visibleEntries = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const updatePageSize = () => {
      setPageSize(mediaQuery.matches ? DESKTOP_PAGE_SIZE : MOBILE_PAGE_SIZE);
    };

    updatePageSize();
    mediaQuery.addEventListener("change", updatePageSize);
    return () => mediaQuery.removeEventListener("change", updatePageSize);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 to-brand-50/20 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="doghike-glass-card p-8 text-center max-w-md w-full"
        >
          <BookOpen className="w-12 h-12 text-brand-400 mx-auto mb-4" />
          <h2 className="doghike-section-title mb-2">Wandertagebuch</h2>
          <p className="doghike-section-subtitle mb-6">
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
                className="doghike-glass-card min-w-0 overflow-hidden rounded-xl border-brand-100/90 bg-gradient-to-br from-white/88 to-brand-50/45 px-2 py-3 md:px-3 md:py-2.5"
              >
                <div className="flex min-w-0 flex-col items-center justify-center gap-1 text-center sm:flex-row sm:gap-2.5 sm:text-left">
                  {typeof icon === "string" ? (
                    <span className={`block shrink-0 text-sm leading-none ${color} md:text-base`}>{icon}</span>
                  ) : (
                    <Mountain className={`h-4 w-4 shrink-0 ${color}`} />
                  )}
                  <div className="min-w-0 max-w-full">
                    <p className="max-w-full truncate text-base font-bold leading-tight text-[#7C3020] md:text-lg">{value}</p>
                    <p className="max-w-full truncate text-[11px] leading-tight text-[#C07820] sm:text-xs">{label}</p>
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

        {filtered.length > 0 && (
          <div className="mb-5 flex justify-end">
            <div className="inline-flex rounded-2xl border border-brand-100 bg-white/85 p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  viewMode === "grid"
                    ? "bg-brand-500 text-white shadow-sm"
                    : "text-[#7C3020] hover:bg-brand-50"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
                Kacheln
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  viewMode === "list"
                    ? "bg-brand-500 text-white shadow-sm"
                    : "text-[#7C3020] hover:bg-brand-50"
                }`}
              >
                <List className="h-4 w-4" />
                Liste
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <SectionLoadingState message="Wanderungen laden..." className="py-16" />
        ) : filtered.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence>
                {visibleEntries.map((entry, index) => (
                  <JournalGridCard
                    key={entry.id}
                    entry={entry}
                    index={index}
                    onDelete={(id) => deleteMutation.mutate(id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {visibleEntries.map((entry, index) => (
                  <JournalListRow
                    key={entry.id}
                    entry={entry}
                    index={index}
                    onDelete={(id) => deleteMutation.mutate(id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )
        ) : entries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="doghike-empty-state py-24"
          >
            <BookOpen className="doghike-empty-icon" />
            <h3 className="doghike-empty-title">Noch keine Wanderungen</h3>
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
            <h3 className="doghike-empty-title">Nichts Passendes gefunden</h3>
            <p className="text-slate-400 text-sm mb-4">Für „{search}“ wurde nichts gefunden.</p>
            <Button variant="outline" onClick={() => setSearch("")}>
              Suche zurücksetzen
            </Button>
          </div>
        )}

        {!isLoading && filtered.length > pageSize && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 pb-20 md:pb-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
            >
              Zurück
            </Button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`inline-flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-medium transition ${
                  page === currentPage
                    ? "border-brand-500 bg-brand-500 text-white"
                    : "border-brand-100 bg-white/85 text-[#7C3020] hover:bg-brand-50"
                }`}
              >
                {page}
              </button>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
            >
              Weiter
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
