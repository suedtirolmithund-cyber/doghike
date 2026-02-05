import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Plus, Search, Filter, Grid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import HikeCard from "@/components/hikes/HikeCard";
import HikeMap from "@/components/map/HikeMap";

export default function Hikes() {
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [dogDifficultyFilter, setDogDifficultyFilter] = useState("all");
  const [sortBy, setSortBy] = useState("season");

  const { data: hikes = [], isLoading } = useQuery({
    queryKey: ["hikes"],
    queryFn: () => base44.entities.Hike.filter({ status: "approved" }, "-date", 1000)
  });

  const { data: dogs = [] } = useQuery({
    queryKey: ["dogs"],
    queryFn: () => base44.entities.Dog.list()
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
    .filter(hike => {
      const matchesSearch = hike.trail_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           hike.location?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDifficulty = difficultyFilter === "all" || hike.difficulty === difficultyFilter;
      const matchesDogDifficulty = dogDifficultyFilter === "all" || hike.dog_difficulty === dogDifficultyFilter;
      return matchesSearch && matchesDifficulty && matchesDogDifficulty;
    })
    .sort((a, b) => {
      if (sortBy === "season") {
        const aMatchesSeason = a.season === currentSeason || a.season === "all_year";
        const bMatchesSeason = b.season === currentSeason || b.season === "all_year";
        
        if (aMatchesSeason && !bMatchesSeason) return -1;
        if (!aMatchesSeason && bMatchesSeason) return 1;
        return new Date(b.date) - new Date(a.date);
      }
      if (sortBy === "-date") return new Date(b.date) - new Date(a.date);
      if (sortBy === "date") return new Date(a.date) - new Date(b.date);
      if (sortBy === "-distance") return (b.distance_km || 0) - (a.distance_km || 0);
      if (sortBy === "-elevation") return (b.elevation_gain_m || 0) - (a.elevation_gain_m || 0);
      return 0;
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-stone-800">Alle Wanderungen</h1>
            <p className="text-stone-600 mt-1">{hikes.length} hundefreundliche Touren in Südtirol</p>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-4 border border-stone-200/50 shadow-sm mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input
                placeholder="Tour oder Ort suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Schwierigkeit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">👤 Alle Schwierigkeiten</SelectItem>
                <SelectItem value="1">👤 Schwierigkeit 1</SelectItem>
                <SelectItem value="2">👤 Schwierigkeit 2</SelectItem>
                <SelectItem value="3">👤 Schwierigkeit 3</SelectItem>
                <SelectItem value="4">👤 Schwierigkeit 4</SelectItem>
                <SelectItem value="5">👤 Schwierigkeit 5</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dogDifficultyFilter} onValueChange={setDogDifficultyFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Hunde-Schwierigkeit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">🐕 Alle Schwierigkeiten</SelectItem>
                <SelectItem value="1">🐕 Schwierigkeit 1</SelectItem>
                <SelectItem value="2">🐕 Schwierigkeit 2</SelectItem>
                <SelectItem value="3">🐕 Schwierigkeit 3</SelectItem>
                <SelectItem value="4">🐕 Schwierigkeit 4</SelectItem>
                <SelectItem value="5">🐕 Schwierigkeit 5</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Sortieren" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="season">🌍 Nach Jahreszeit</SelectItem>
                <SelectItem value="-date">Neueste zuerst</SelectItem>
                <SelectItem value="date">Älteste zuerst</SelectItem>
                <SelectItem value="-distance">Längste Strecke</SelectItem>
                <SelectItem value="-elevation">Meiste Höhenmeter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Map Overview */}
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
            />
          </motion.div>
        )}

        {/* Hikes Grid */}
        {filteredHikes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHikes.map((hike, index) => (
              <HikeCard key={hike.id} hike={hike} dogs={dogs} index={index} />
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