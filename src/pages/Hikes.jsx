import { useState } from "react";
import { getAllHikes } from "@/api/sheetsClient";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import HikeCard from "@/components/hikes/HikeCard";
import HikeMap from "@/components/map/HikeMap";
import { DIFFICULTY_LEVELS } from "@/lib/difficultyConfig";

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

  const { data: hikes = [], isLoading } = useQuery({
    queryKey: ["allHikes"],
    queryFn: getAllHikes,
    staleTime: 5 * 60 * 1000,
  });

  const getCurrentSeason = () => {
    const month = new Date().getMonth() + 1;
    if (month >= 12 || month <= 2) return "winter";
    if (month >= 3 && month <= 5) return "spring";
    if (month >= 6 && month <= 8) return "summer";
    return "autumn";
  };

  const currentSeason = getCurrentSeason();

  const filteredHikes = hikes
    .filter((hike) => {
      const matchesSearch = hike.trail_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hike.location?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (humanDifficultyFilter !== "all" && hike.difficulty !== humanDifficultyFilter) return false;
      if (dogDifficultyFilter !== "all" && hike.dog_difficulty !== dogDifficultyFilter) return false;
      if (distanceMin && (hike.distance_km || 0) < parseFloat(distanceMin)) return false;
      if (distanceMax && (hike.distance_km || 0) > parseFloat(distanceMax)) return false;
      if (elevationMin && (hike.elevation_gain_m || 0) < parseFloat(elevationMin)) return false;
      if (elevationMax && (hike.elevation_gain_m || 0) > parseFloat(elevationMax)) return false;
      if (seasonFilter !== "all" && hike.season !== seasonFilter && hike.season !== "all_year") return false;
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
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-slate-50 pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-stone-800">Alle Wanderungen</h1>
            <p className="text-stone-600 mt-1">{hikes.length} hundefreundliche Touren</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 border border-stone-200/50 shadow-sm mb-8"
        >
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input
                placeholder="Tour oder Ort suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-stone-700 mb-2 block">👤 Schwierigkeit Mensch</label>
                <Select value={humanDifficultyFilter} onValueChange={setHumanDifficultyFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    {DIFFICULTY_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.short} · {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-stone-700 mb-2 block">🐕 Schwierigkeit Hund</label>
                <Select value={dogDifficultyFilter} onValueChange={setDogDifficultyFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    {DIFFICULTY_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.short} · {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-stone-700 mb-2 block">🌤️ Jahreszeit</label>
                <Select value={seasonFilter} onValueChange={setSeasonFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    <SelectItem value="spring">🌸 Frühling</SelectItem>
                    <SelectItem value="summer">☀️ Sommer</SelectItem>
                    <SelectItem value="autumn">🍂 Herbst</SelectItem>
                    <SelectItem value="winter">❄️ Winter</SelectItem>
                    <SelectItem value="all_year">🔄 Ganzjährig</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-stone-700 mb-2 block">📏 Distanz (km)</label>
                <div className="flex gap-2">
                  <Input type="number" placeholder="Min" value={distanceMin} onChange={(e) => setDistanceMin(e.target.value)} className="w-full" />
                  <Input type="number" placeholder="Max" value={distanceMax} onChange={(e) => setDistanceMax(e.target.value)} className="w-full" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-stone-700 mb-2 block">⛰️ Höhenmeter (m)</label>
                <div className="flex gap-2">
                  <Input type="number" placeholder="Min" value={elevationMin} onChange={(e) => setElevationMin(e.target.value)} className="w-full" />
                  <Input type="number" placeholder="Max" value={elevationMax} onChange={(e) => setElevationMax(e.target.value)} className="w-full" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-stone-700 mb-2 block">💧 Wasser unterwegs</label>
                <Select value={waterFilter} onValueChange={setWaterFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    <SelectItem value="none">🚫 Kein Wasser</SelectItem>
                    <SelectItem value="little">💧 Wenig Wasser</SelectItem>
                    <SelectItem value="moderate">💧💧 Etwas Wasser</SelectItem>
                    <SelectItem value="plenty">💧💧💧 Viel Wasser</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-stone-700 mb-2 block">🔄 Sortieren</label>
                <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setLevelFilter("all"); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Neueste zuerst" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">🕐 Neueste zuerst</SelectItem>
                    <SelectItem value="difficulty">👤 Schwierigkeit Mensch</SelectItem>
                    <SelectItem value="dog_difficulty">🐕 Schwierigkeit Hund</SelectItem>
                    <SelectItem value="distance">📏 Kilometer</SelectItem>
                    <SelectItem value="elevation">⛰️ Höhenmeter</SelectItem>
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
            <h2 className="text-xl font-semibold text-stone-800 mb-4">📍 Touren auf der Karte</h2>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHikes.map((hike, index) => (
              <HikeCard key={`${hike._source ?? "sheets"}-${hike.id}`} hike={hike} index={index} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-stone-500">Keine Touren gefunden</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
