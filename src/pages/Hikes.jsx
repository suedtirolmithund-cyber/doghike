import { useState } from "react";
import { getAllHikes } from "@/api/sheetsClient";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Mountain, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import HikeCard from "@/components/hikes/HikeCard";
import HikeMap from "@/components/map/HikeMap";
import WaterIcon from "@/components/icons/WaterIcon";
import { DIFFICULTY_LEVELS, SEASON_LEVELS, TOUR_ICONS, WATER_LEVELS } from "@/lib/difficultyConfig";

function getSeasonValues(hike) {
  if (Array.isArray(hike.seasons) && hike.seasons.length > 0) {
    return hike.seasons;
  }

  return hike.season ? [hike.season] : [];
}

export default function Hikes() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("none");
  const [levelFilter, setLevelFilter] = useState("all");
  const [humanDifficultyFilter, setHumanDifficultyFilter] = useState("all");
  const [dogDifficultyFilter, setDogDifficultyFilter] = useState("all");
  const [distanceMin, setDistanceMin] = useState("");
  const [distanceMax, setDistanceMax] = useState("");
  const [elevationMin, setElevationMin] = useState("");
  const [elevationMax, setElevationMax] = useState("");
  const [seasonFilter, setSeasonFilter] = useState("all");
  const [waterFilter, setWaterFilter] = useState("all");

  const { data: hikes = [] } = useQuery({
    queryKey: ["allHikes"],
    queryFn: getAllHikes,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const filteredHikes = hikes
    .filter((hike) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch = !query ||
        hike.trail_name?.toLowerCase().includes(query) ||
        hike.location?.toLowerCase().includes(query) ||
        hike.tags?.some((tag) => tag.toLowerCase().includes(query));
      if (!matchesSearch) return false;

      if (humanDifficultyFilter !== "all" && hike.difficulty !== humanDifficultyFilter) return false;
      if (dogDifficultyFilter !== "all" && hike.dog_difficulty !== dogDifficultyFilter) return false;
      if (distanceMin && (hike.distance_km || 0) < parseFloat(distanceMin)) return false;
      if (distanceMax && (hike.distance_km || 0) > parseFloat(distanceMax)) return false;
      if (elevationMin && (hike.elevation_gain_m || 0) < parseFloat(elevationMin)) return false;
      if (elevationMax && (hike.elevation_gain_m || 0) > parseFloat(elevationMax)) return false;
      if (seasonFilter !== "all") {
        const seasons = getSeasonValues(hike);
        if (!seasons.includes(seasonFilter) && !seasons.includes("all_year")) return false;
      }
      if (waterFilter !== "all" && hike.water_availability !== waterFilter) return false;

      if (levelFilter === "all") return true;
      if (sortBy === "difficulty") return hike.difficulty === levelFilter;
      if (sortBy === "dog_difficulty") return hike.dog_difficulty === levelFilter;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "difficulty") return (a.difficulty || "9").localeCompare(b.difficulty || "9");
      if (sortBy === "dog_difficulty") return (a.dog_difficulty || "9").localeCompare(b.dog_difficulty || "9");
      if (sortBy === "distance") return (b.distance_km || 0) - (a.distance_km || 0);
      if (sortBy === "elevation") return (b.elevation_gain_m || 0) - (a.elevation_gain_m || 0);
      const bTime = b.date ? new Date(b.date).getTime() : 0;
      const aTime = a.date ? new Date(a.date).getTime() : 0;
      return bTime - aTime || (a.trail_name || "").localeCompare(b.trail_name || "");
    });

  return (
    <div className="doghike-page-shell">
      <div className="doghike-content-shell">
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
          className="doghike-filter-panel mb-8"
        >
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <Input
                placeholder="Tour oder Ort suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-brand-100 bg-white/78 pl-10 shadow-sm"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="doghike-filter-label">{TOUR_ICONS.human} Schwierigkeit Mensch</label>
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
                <label className="doghike-filter-label">{TOUR_ICONS.dog} Schwierigkeit Hund</label>
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
                <label className="doghike-filter-label">
                  <WaterIcon value="little" /> Wasser unterwegs
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

              <div>
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
          </div>
        </motion.div>

        {filteredHikes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
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
              zoom={searchQuery || levelFilter !== "all" ? 10 : 8}
              useCluster={true}
            />
          </motion.div>
        )}

        {filteredHikes.length > 0 ? (
          <div className="doghike-card-grid">
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
