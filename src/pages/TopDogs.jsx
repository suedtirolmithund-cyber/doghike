import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { getHikes } from "@/api/sheetsClient";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Trophy, Medal, Award } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TopDogs() {
  const { data: dogs = [] } = useQuery({
    queryKey: ["allDogs"],
    queryFn: async () => { const r = await base44.entities.Dog.list(); return Array.isArray(r) ? r : []; }
  });

  const { data: hikes = [] } = useQuery({
    queryKey: ["allHikes"],
    queryFn: getHikes
  });

  const getDogStats = (dogId) => {
    const dogHikes = hikes.filter(h => h.dogs?.includes(dogId));
    const totalDistance = dogHikes.reduce((sum, h) => sum + (h.distance_km || 0), 0);
    const totalElevation = dogHikes.reduce((sum, h) => sum + (h.elevation_gain_m || 0), 0);
    return { hikeCount: dogHikes.length, totalDistance, totalElevation };
  };

  const dogsWithStats = dogs.map(dog => ({
    ...dog,
    stats: getDogStats(dog.id)
  })).filter(dog => dog.stats.hikeCount > 0);

  const topByHikes = [...dogsWithStats].sort((a, b) => b.stats.hikeCount - a.stats.hikeCount).slice(0, 10);
  const topByDistance = [...dogsWithStats].sort((a, b) => b.stats.totalDistance - a.stats.totalDistance).slice(0, 10);
  const topByElevation = [...dogsWithStats].sort((a, b) => b.stats.totalElevation - a.stats.totalElevation).slice(0, 10);

  const getMedalIcon = (position) => {
    if (position === 0) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (position === 1) return <Medal className="w-6 h-6 text-gray-400" />;
    if (position === 2) return <Award className="w-6 h-6 text-amber-700" />;
    return <span className="w-6 h-6 flex items-center justify-center text-stone-500 font-semibold">#{position + 1}</span>;
  };

  const DogLeaderboardItem = ({ dog, index, metric }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl ${
        index < 3 ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200' : 'bg-white border border-stone-200'
      }`}
    >
      <div className="flex-shrink-0">
        {getMedalIcon(index)}
      </div>
      <img
        src={dog.photo_url || `https://api.dicebear.com/7.x/thumbs/svg?seed=${dog.name}`}
        alt={dog.name}
        className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover"
      />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-stone-800 text-sm md:text-base truncate">{dog.name}</p>
        {dog.breed && <p className="text-xs text-stone-500 truncate">{dog.breed}</p>}
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-lg md:text-xl font-bold text-stone-800">
          {metric === 'hikes' && dog.stats.hikeCount}
          {metric === 'distance' && `${dog.stats.totalDistance.toFixed(1)}`}
          {metric === 'elevation' && `${Math.round(dog.stats.totalElevation).toLocaleString()}`}
        </p>
        <p className="text-xs text-stone-500">
          {metric === 'hikes' && 'Touren'}
          {metric === 'distance' && 'km'}
          {metric === 'elevation' && 'Hm'}
        </p>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-slate-50 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-2xl mb-4">
            <Trophy className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-3xl font-bold text-stone-800 mb-2">Top Dogs</h1>
          <p className="text-stone-600">Die fleißigsten Wanderhunde unserer Community</p>
        </motion.div>

        <Tabs defaultValue="hikes" className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white border border-stone-200 h-auto">
            <TabsTrigger value="hikes" className="text-xs md:text-sm py-2 md:py-2.5">
              <span className="hidden md:inline">🎯 Meiste Touren</span>
              <span className="md:hidden">🎯 Touren</span>
            </TabsTrigger>
            <TabsTrigger value="distance" className="text-xs md:text-sm py-2 md:py-2.5">
              <span className="hidden md:inline">📏 Längste Strecke</span>
              <span className="md:hidden">📏 km</span>
            </TabsTrigger>
            <TabsTrigger value="elevation" className="text-xs md:text-sm py-2 md:py-2.5">
              <span className="hidden md:inline">⛰️ Meiste Höhenmeter</span>
              <span className="md:hidden">⛰️ Hm</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hikes" className="space-y-3">
            {topByHikes.length > 0 ? (
              topByHikes.map((dog, index) => (
                <DogLeaderboardItem key={dog.id} dog={dog} index={index} metric="hikes" />
              ))
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl border border-stone-200">
                <p className="text-stone-500">Noch keine Daten verfügbar</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="distance" className="space-y-3">
            {topByDistance.length > 0 ? (
              topByDistance.map((dog, index) => (
                <DogLeaderboardItem key={dog.id} dog={dog} index={index} metric="distance" />
              ))
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl border border-stone-200">
                <p className="text-stone-500">Noch keine Daten verfügbar</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="elevation" className="space-y-3">
            {topByElevation.length > 0 ? (
              topByElevation.map((dog, index) => (
                <DogLeaderboardItem key={dog.id} dog={dog} index={index} metric="elevation" />
              ))
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl border border-stone-200">
                <p className="text-stone-500">Noch keine Daten verfügbar</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}