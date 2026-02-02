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

export default function Hikes() {
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [sortBy, setSortBy] = useState("-date");

  const { data: hikes = [], isLoading } = useQuery({
    queryKey: ["hikes"],
    queryFn: () => base44.entities.Hike.list("-date", 100)
  });

  const { data: dogs = [] } = useQuery({
    queryKey: ["dogs"],
    queryFn: () => base44.entities.Dog.list()
  });

  const filteredHikes = hikes
    .filter(hike => {
      const matchesSearch = hike.trail_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           hike.location?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDifficulty = difficultyFilter === "all" || hike.difficulty === difficultyFilter;
      return matchesSearch && matchesDifficulty;
    })
    .sort((a, b) => {
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
            <h1 className="text-3xl font-light text-stone-800">All Hikes</h1>
            <p className="text-stone-500 mt-1">{hikes.length} adventures logged</p>
          </div>
          <Link to={createPageUrl("AddHike")}>
            <Button className="bg-slate-800 hover:bg-slate-900">
              <Plus className="w-4 h-4 mr-2" />
              Add Hike
            </Button>
          </Link>
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
                placeholder="Search trails or locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="challenging">Challenging</SelectItem>
                <SelectItem value="difficult">Difficult</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-date">Newest First</SelectItem>
                <SelectItem value="date">Oldest First</SelectItem>
                <SelectItem value="-distance">Longest Distance</SelectItem>
                <SelectItem value="-elevation">Most Elevation</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

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
            <p className="text-stone-500">No hikes found matching your criteria</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}