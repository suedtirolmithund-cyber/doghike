import { getAllHikes } from "@/api/sheetsClient";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CircleHelp, List, Mountain, PawPrint, RotateCcw, Search, LayoutGrid } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import HikeCard from "@/components/hikes/HikeCard";
import HikeMap from "@/components/map/HikeMap";
import PawLoadingTrail from "@/components/PawLoadingTrail";
import WaterIcon from "@/components/icons/WaterIcon";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  DIFFICULTY_APP_EXPLANATIONS,
  DIFFICULTY_GUIDE_NOTE,
  DIFFICULTY_LEVELS,
  DOG_DIFFICULTY_GUIDE,
  HUMAN_DIFFICULTY_GUIDE,
  SEASON_LEVELS,
  TOUR_ICONS,
  WATER_APP_EXPLANATION,
  WATER_GUIDE,
  WATER_GUIDE_NOTE,
  WATER_LEVELS,
  getDifficultyLabel,
  getSeasonIcon,
  getSeasonLabel,
  normalizeSeasonValues,
} from "@/lib/difficultyConfig";
import { useHikeFilters } from "@/hooks/useHikeFilters";
import { formatDurationHours } from "@/lib/duration";
import { getDisplayImageUrl } from "@/lib/imageProxy";

const HIKES_PAGE_SIZE = 15;

function DifficultyInfoDialog({ icon, title, description, levels }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-brand-200 bg-white/80 text-brand-500 shadow-sm transition hover:border-brand-300 hover:text-brand-600"
          aria-label={`${title} erklären`}
        >
          <CircleHelp className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="grid-rows-[auto,minmax(0,1fr)] max-h-[85vh] overflow-hidden border-white/80 bg-white/95 p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-brand-100/80 px-6 pb-3 pt-6">
          <DialogTitle className="flex items-center gap-2 text-left text-slate-800">
            {icon}
            {title}
          </DialogTitle>
          <DialogDescription className="text-left text-slate-500">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 space-y-3 overflow-y-auto px-6 pb-6 pr-5">
          <div className="doghike-info-box">
            <div className="space-y-2">
              {DIFFICULTY_APP_EXPLANATIONS.map((item) => (
                <div key={item.key}>
                  <div className="doghike-info-subtitle">{item.title}</div>
                  <p className="doghike-info-text">{item.description}</p>
                </div>
              ))}
            </div>
            <p className="doghike-info-note">
              {DIFFICULTY_GUIDE_NOTE}
            </p>
          </div>
          {levels.map((level) => (
            <div key={level.stufe} className={`rounded-2xl border p-4 shadow-sm ${level.color}`}>
              <div className="mb-2 flex items-center gap-3">
                <span className={`rounded-full px-2 py-1 text-xs font-bold text-white ${level.badge}`}>
                  {level.level}
                </span>
                <div>
                  <div className="font-semibold">{level.title}</div>
                  <div className="text-xs opacity-75">{level.stufe}</div>
                </div>
              </div>
              <p className="mb-2 text-sm">{level.desc}</p>
              <div className="grid gap-1.5 text-xs opacity-85">
                <div><span className="font-medium">Beispiele:</span> {level.examples}</div>
                <div><span className="font-medium">Gelände:</span> {level.terrain}</div>
                <div><span className="font-medium">{level.fitness ? "Einordnung" : "Hinweis"}:</span> {level.fitness ?? level.note}</div>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WaterInfoDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-brand-200 bg-white/80 text-brand-500 shadow-sm transition hover:border-brand-300 hover:text-brand-600"
          aria-label="Wasser erklären"
        >
          <CircleHelp className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="grid-rows-[auto,minmax(0,1fr)] max-h-[85vh] overflow-hidden border-white/80 bg-white/95 p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-brand-100/80 px-6 pb-3 pt-6">
          <DialogTitle className="flex items-center gap-2 text-left text-slate-800">
            <WaterIcon value="little" className="text-base text-brand-500" />
            Wasser unterwegs
          </DialogTitle>
          <DialogDescription className="text-left text-slate-500">
            So ist die Wasserverfügbarkeit entlang der Route eingeordnet.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 space-y-3 overflow-y-auto px-6 pb-6 pr-5">
          <div className="doghike-info-box">
            <p className="doghike-info-text">{WATER_APP_EXPLANATION}</p>
            <p className="doghike-info-note">
              {WATER_GUIDE_NOTE}
            </p>
          </div>
          {WATER_GUIDE.map((level) => (
            <div key={level.value} className={`rounded-2xl border p-4 shadow-sm ${level.color}`}>
              <div className="mb-2 flex items-center gap-3">
                <WaterIcon value={level.value} className="text-xl" />
                <div className="font-semibold">{level.label}</div>
              </div>
              <p className="mb-2 text-sm">{level.desc}</p>
              <div className="grid gap-1.5 text-xs opacity-85">
                <div><span className="font-medium">Beispiele:</span> {level.examples}</div>
                <div><span className="font-medium">Tipp:</span> {level.tip}</div>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Hikes() {
  const [viewMode, setViewMode] = useState("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const { data: hikes = [], isLoading } = useQuery({
    queryKey: ["allHikes"],
    queryFn: getAllHikes,
    staleTime: 5 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
  const {
    searchQuery,
    setSearchQuery,
    activeSearchQuery,
    sortBy,
    setSortBy,
    levelFilter,
    setLevelFilter,
    activeLevelFilter,
    humanDifficultyFilter,
    setHumanDifficultyFilter,
    dogDifficultyFilter,
    setDogDifficultyFilter,
    distanceMin,
    setDistanceMin,
    distanceMax,
    setDistanceMax,
    elevationMin,
    setElevationMin,
    elevationMax,
    setElevationMax,
    seasonFilter,
    setSeasonFilter,
    waterFilter,
    setWaterFilter,
    premiumFilter,
    setPremiumFilter,
    hasPendingChanges,
    applyFilters,
    resetFilters,
    filteredHikes,
  } = useHikeFilters(hikes);
  const isHikesLoading = isLoading && hikes.length === 0;
  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    levelFilter !== "all" ||
    humanDifficultyFilter !== "all" ||
    dogDifficultyFilter !== "all" ||
    distanceMin !== "" ||
    distanceMax !== "" ||
    elevationMin !== "" ||
    elevationMax !== "" ||
    seasonFilter !== "all" ||
    waterFilter !== "all" ||
    premiumFilter !== "all";
  const totalPages = Math.max(1, Math.ceil(filteredHikes.length / HIKES_PAGE_SIZE));
  const visibleHikes = filteredHikes.slice(
    (currentPage - 1) * HIKES_PAGE_SIZE,
    currentPage * HIKES_PAGE_SIZE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredHikes]);

  return (
    <div className="doghike-page-shell">
      <div className="doghike-content-shell pb-32 md:pb-10">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="doghike-page-header"
        >
          <div className="doghike-page-icon">
            <Mountain className="h-5 w-5" />
          </div>
          <div>
            <h1 className="doghike-page-title">Alle Wanderungen</h1>
            <p className="doghike-page-subtitle">{hikes.length} hundefreundliche Touren</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="doghike-filter-panel mb-7"
        >
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Tour oder Ort suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    applyFilters();
                  }
                }}
                className="border-brand-100 bg-white/78 pl-10 shadow-sm"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <div className="mb-1 flex items-center gap-1.5">
                  <label className="doghike-filter-label mb-0">{TOUR_ICONS.human} Mensch</label>
                  <DifficultyInfoDialog
                    icon={<Mountain className="h-4 w-4 text-brand-500" />}
                    title="Schwierigkeit Mensch"
                    description="So sind die Touren für Menschen von Stufe 1 bis Stufe 5 eingeordnet."
                    levels={HUMAN_DIFFICULTY_GUIDE}
                  />
                </div>
                <Select value={humanDifficultyFilter} onValueChange={setHumanDifficultyFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    {DIFFICULTY_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.short} - {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="mb-1 flex items-center gap-1.5">
                  <label className="doghike-filter-label mb-0">{TOUR_ICONS.dog} Hund</label>
                  <DifficultyInfoDialog
                    icon={<PawPrint className="h-4 w-4 text-brand-500" />}
                    title="Schwierigkeit Hund"
                    description="So sind die Touren für Hunde von Stufe 1 bis Stufe 5 eingeordnet."
                    levels={DOG_DIFFICULTY_GUIDE}
                  />
                </div>
                <Select value={dogDifficultyFilter} onValueChange={setDogDifficultyFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    {DIFFICULTY_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.short} - {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="doghike-filter-label">{TOUR_ICONS.season} Jahreszeit</label>
                <Select value={seasonFilter} onValueChange={setSeasonFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    {SEASON_LEVELS.map((season) => (
                      <SelectItem key={season.value} value={season.value}>
                        {season.icon} {season.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="mb-1 flex items-center gap-1.5">
                  <label className="doghike-filter-label mb-0">
                    <WaterIcon value="little" /> Wasser
                  </label>
                  <WaterInfoDialog />
                </div>
                <Select value={waterFilter} onValueChange={setWaterFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    {WATER_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        <span className="inline-flex items-center gap-1">
                          <WaterIcon value={level.value} /> {level.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="doghike-filter-label">Premium</label>
                <Select value={premiumFilter} onValueChange={setPremiumFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    <SelectItem value="free">Keine Premium</SelectItem>
                    <SelectItem value="premium">Nur Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="doghike-filter-label">{TOUR_ICONS.distance} Distanz (km)</label>
                <div className="flex gap-2">
                  <Input type="number" placeholder="Min" value={distanceMin} onChange={(e) => setDistanceMin(e.target.value)} />
                  <Input type="number" placeholder="Max" value={distanceMax} onChange={(e) => setDistanceMax(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="doghike-filter-label">{TOUR_ICONS.elevation} Höhenmeter (m)</label>
                <div className="flex gap-2">
                  <Input type="number" placeholder="Min" value={elevationMin} onChange={(e) => setElevationMin(e.target.value)} />
                  <Input type="number" placeholder="Max" value={elevationMax} onChange={(e) => setElevationMax(e.target.value)} />
                </div>
              </div>

              <div className="sm:col-span-2 lg:col-span-1">
                <label className="doghike-filter-label">Sortieren</label>
                <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setLevelFilter("all"); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Neueste zuerst" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Neueste zuerst</SelectItem>
                    <SelectItem value="difficulty">{TOUR_ICONS.human} Schwierigkeit Mensch</SelectItem>
                    <SelectItem value="dog_difficulty">{TOUR_ICONS.dog} Schwierigkeit Hund</SelectItem>
                    <SelectItem value="distance">{TOUR_ICONS.distance} Kilometer</SelectItem>
                    <SelectItem value="elevation">{TOUR_ICONS.elevation} Höhenmeter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-brand-100/80 pt-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-5 text-[#C07820]">
                {hasPendingChanges
                  ? "Du hast Filter geändert. Tippe auf „Filter anwenden“, um die Ergebnisse zu aktualisieren."
                  : hasActiveFilters
                    ? `${filteredHikes.length} Tour${filteredHikes.length === 1 ? "" : "en"} aktiv gefiltert. Seite ${currentPage} von ${totalPages}.`
                    : `${filteredHikes.length} Tour${filteredHikes.length === 1 ? "" : "en"} verfügbar. Seite ${currentPage} von ${totalPages}.`}
              </p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={resetFilters}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Zurücksetzen
                </Button>
                <Button type="button" onClick={applyFilters} className="bg-brand-500 text-white hover:bg-brand-600">
                  Filter anwenden
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {!isHikesLoading && filteredHikes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-10"
          >
            <div className="doghike-section-header">
              <div>
                <h2 className="doghike-section-title">Touren auf der Karte</h2>
                <p className="doghike-section-subtitle">Alle passenden Wanderungen mit Startpunkt.</p>
              </div>
            </div>
            <HikeMap
              hikes={filteredHikes}
              height="500px"
              fitBounds={true}
              showLegend={true}
              zoom={activeSearchQuery || activeLevelFilter !== "all" ? 10 : 8}
              useCluster={true}
            />
          </motion.div>
        )}

        {!isHikesLoading && filteredHikes.length > 0 && (
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

        {isHikesLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="doghike-glass-card flex flex-col items-center justify-center gap-3 rounded-3xl px-6 py-12 text-center"
          >
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#C07820]">
              Lädt...
            </div>
            <PawLoadingTrail />
            <div className="space-y-1">
              <p className="text-lg font-semibold text-slate-800">Wanderungen werden aktualisiert</p>
              <p className="max-w-md text-sm text-slate-500">
                Wir sortieren gerade die passenden Wege für dich.
              </p>
            </div>
          </motion.div>
        ) : filteredHikes.length > 0 ? (
          viewMode === "grid" ? (
          <div className="doghike-card-grid pb-20 md:pb-0">
            {visibleHikes.map((hike, index) => (
              <HikeCard key={`${hike._source ?? "sheets"}-${hike.id}`} hike={hike} index={index} />
            ))}
          </div>
          ) : (
            <div className="space-y-3 pb-20 md:pb-0">
              {visibleHikes.map((hike, index) => {
                const hikeSource = hike._source ?? "sheets";
                const detailId =
                  hikeSource === "sheets" && hike._public_hike_id
                    ? hike.route_id || String(hike._public_hike_id)
                    : hike.id;
                const seasonValues = normalizeSeasonValues(hike.seasons, hike.season);
                const seasonIcon = seasonValues[0] ? getSeasonIcon(seasonValues[0]) : null;
                const seasonLabel = seasonValues[0] ? getSeasonLabel(seasonValues[0]) : null;
                const coverPhoto =
                  getDisplayImageUrl(
                    Array.isArray(hike.photos) && hike.photos.length > 0
                      ? hike.photos[0]
                      : hike.image,
                    { width: 1000, quality: 82 }
                  ) ||
                  (Array.isArray(hike.photos) && hike.photos.length > 0 ? hike.photos[0] : hike.image) ||
                  "/splash/autumn-hero.jpg";

                return (
                  <motion.div
                    key={`${hikeSource}-${hike.id}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04, duration: 0.28 }}
                  >
                    <Link
                      to={createPageUrl("HikeDetail") + `?id=${encodeURIComponent(detailId)}&source=${hikeSource}`}
                      state={{ hike }}
                      className="block"
                    >
                      <div className="overflow-hidden rounded-[22px] border border-brand-100/80 bg-white/82 shadow-[0_10px_24px_rgba(168,0,60,0.08)] transition hover:shadow-[0_14px_30px_rgba(240,112,48,0.12)]">
                        <div className="flex flex-col sm:flex-row">
                          <div className="relative h-36 w-full shrink-0 overflow-hidden bg-brand-50 sm:h-auto sm:w-48">
                            <img
                              src={coverPhoto}
                              alt={hike.trail_name}
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-cover"
                            />
                            {seasonIcon && (
                              <span className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/80 text-xl shadow-sm">
                                {seasonIcon}
                              </span>
                            )}
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:p-5">
                            <div className="min-w-0">
                              <h3 className="line-clamp-2 text-lg font-semibold leading-tight text-[#7C3020]">
                                {hike.trail_name}
                              </h3>
                              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#C07820]">
                                <span className="inline-flex items-center gap-1">
                                  <span>{TOUR_ICONS.location}</span>
                                  <span>{hike.location || "Dolomites"}</span>
                                </span>
                                {seasonLabel && (
                                  <span className="inline-flex items-center gap-1">
                                    <span>{seasonIcon}</span>
                                    <span>{seasonLabel}</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 text-sm text-[#7C3020]">
                              {hike.distance_km ? <span className="rounded-full border border-brand-100 bg-brand-50/70 px-2.5 py-1">{TOUR_ICONS.distance} {hike.distance_km} km</span> : null}
                              {hike.elevation_gain_m || hike.elevation_m ? <span className="rounded-full border border-brand-100 bg-brand-50/70 px-2.5 py-1">{TOUR_ICONS.elevation} {hike.elevation_gain_m ?? hike.elevation_m} Hm</span> : null}
                              {hike.duration_minutes ? <span className="rounded-full border border-brand-100 bg-brand-50/70 px-2.5 py-1">{TOUR_ICONS.duration} {formatDurationHours(hike.duration_minutes)}</span> : null}
                              {hike.difficulty ? <span className="rounded-full border border-brand-100 bg-brand-50/70 px-2.5 py-1">{TOUR_ICONS.human} {getDifficultyLabel(hike.difficulty)}</span> : null}
                              {hike.dog_difficulty ? <span className="rounded-full border border-brand-100 bg-brand-50/70 px-2.5 py-1">{TOUR_ICONS.dog} {getDifficultyLabel(hike.dog_difficulty)}</span> : null}
                            </div>

                            {hike.notes && (
                              <p className="line-clamp-2 text-sm leading-relaxed text-[#A56A46]">
                                {hike.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="doghike-empty-state"
          >
            <Mountain className="doghike-empty-icon" />
            <h3 className="doghike-empty-title">Da passt gerade nichts</h3>
            <p className="mx-auto max-w-xs text-sm text-slate-500">
              Stell die Suche etwas weiter. Dann tauchen neue Wege auf.
            </p>
          </motion.div>
        )}

        {!isHikesLoading && filteredHikes.length > HIKES_PAGE_SIZE && (
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
