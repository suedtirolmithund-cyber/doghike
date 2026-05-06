import { getAllHikes } from "@/api/sheetsClient";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Mountain, RotateCcw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import HikeCard from "@/components/hikes/HikeCard";
import HikeMap from "@/components/map/HikeMap";
import WaterIcon from "@/components/icons/WaterIcon";
import { DIFFICULTY_LEVELS, SEASON_LEVELS, TOUR_ICONS, WATER_LEVELS } from "@/lib/difficultyConfig";
import { useHikeFilters } from "@/hooks/useHikeFilters";

export default function Hikes() {
  const { data: hikes = [] } = useQuery({
    queryKey: ["allHikes"],
    queryFn: getAllHikes,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
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
    hasPendingChanges,
    applyFilters,
    resetFilters,
    filteredHikes,
  } = useHikeFilters(hikes);

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
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
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

            <div className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="doghike-filter-label text-xs sm:text-sm">{TOUR_ICONS.human} Mensch</label>
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
                <label className="doghike-filter-label text-xs sm:text-sm">{TOUR_ICONS.dog} Hund</label>
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
                <label className="doghike-filter-label text-xs sm:text-sm">{TOUR_ICONS.season} Jahreszeit</label>
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
                <label className="doghike-filter-label text-xs sm:text-sm">
                  <WaterIcon value="little" /> Wasser
                </label>
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

              <div className="col-span-2 sm:col-span-1">
                <label className="doghike-filter-label text-xs sm:text-sm">{TOUR_ICONS.distance} Distanz (km)</label>
                <div className="flex gap-2">
                  <Input type="number" placeholder="Min" value={distanceMin} onChange={(e) => setDistanceMin(e.target.value)} />
                  <Input type="number" placeholder="Max" value={distanceMax} onChange={(e) => setDistanceMax(e.target.value)} />
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="doghike-filter-label text-xs sm:text-sm">{TOUR_ICONS.elevation} Höhenmeter (m)</label>
                <div className="flex gap-2">
                  <Input type="number" placeholder="Min" value={elevationMin} onChange={(e) => setElevationMin(e.target.value)} />
                  <Input type="number" placeholder="Max" value={elevationMax} onChange={(e) => setElevationMax(e.target.value)} />
                </div>
              </div>

              <div className="col-span-2 lg:col-span-1">
                <label className="doghike-filter-label text-xs sm:text-sm">Sortieren</label>
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

            <div className="flex flex-col gap-3 border-t border-sky-100/80 pt-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                {hasPendingChanges
                  ? "Du hast Filter geändert. Tippe auf „Filter anwenden“, um die Ergebnisse zu aktualisieren."
                  : `${filteredHikes.length} Tour${filteredHikes.length === 1 ? "" : "en"} aktiv gefiltert.`}
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

        {filteredHikes.length > 0 && (
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

        {filteredHikes.length > 0 ? (
          <div className="doghike-card-grid pb-20 md:pb-0">
            {filteredHikes.map((hike, index) => (
              <HikeCard key={`${hike._source ?? "sheets"}-${hike.id}`} hike={hike} index={index} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="doghike-empty-state"
          >
            <Mountain className="doghike-empty-icon" />
            <h3 className="mb-2 text-xl font-medium text-stone-700">Keine Touren gefunden</h3>
            <p className="mx-auto max-w-xs text-sm text-stone-500">
              Passe Suche oder Filter an, um wieder passende Wanderungen zu sehen.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
