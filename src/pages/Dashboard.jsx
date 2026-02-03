import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Mountain, Route, Clock, TrendingUp, Plus, Map, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatsCard from "@/components/stats/StatsCard";
import HikeCard from "@/components/hikes/HikeCard";
import DogAvatar from "@/components/dogs/DogAvatar";
import HikeMap from "@/components/map/HikeMap";

export default function Dashboard() {
  const { data: hikes = [], isLoading: hikesLoading } = useQuery({
    queryKey: ["hikes"],
    queryFn: () => base44.entities.Hike.filter({ status: "approved" }, "-date", 50)
  });

  const { data: dogs = [], isLoading: dogsLoading } = useQuery({
    queryKey: ["dogs"],
    queryFn: () => base44.entities.Dog.list()
  });

  const totalDistance = hikes.reduce((sum, h) => sum + (h.distance_km || 0), 0);
  const totalElevation = hikes.reduce((sum, h) => sum + (h.elevation_gain_m || 0), 0);
  const totalTime = hikes.reduce((sum, h) => sum + (h.duration_minutes || 0), 0);

  const recentHikes = hikes.slice(0, 4);
  const hikesWithCoords = hikes.filter(h => h.latitude && h.longitude);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-slate-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/50 to-stone-50" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-light text-white mb-4 tracking-tight">
              Hundefreundliche Wanderungen
            </h1>
            <p className="text-lg text-white/70 mb-8 max-w-2xl mx-auto">
              Entdecke die schönsten Wanderungen in den Dolomiten – getestet mit unseren Vierbeinern 🐕
            </p>
            
            {/* Dogs Row */}
            {dogs.length > 0 && (
              <div className="flex items-center justify-center gap-6 mb-8">
                {dogs.map((dog) => (
                  <Link key={dog.id} to={createPageUrl("Dogs")}>
                    <DogAvatar dog={dog} size="lg" />
                  </Link>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-4 justify-center">
              <Link to={createPageUrl("Hikes")}>
                <Button size="lg" className="bg-white text-slate-800 hover:bg-white/90 shadow-lg">
                  <Mountain className="w-5 h-5 mr-2" />
                  Alle Touren entdecken
                </Button>
              </Link>
              <Link to={createPageUrl("SubmitHike")}>
                <Button size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                  Tour einreichen
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10 pb-20">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <StatsCard
            icon={Route}
            label="Wanderungen"
            value={hikes.length}
            delay={0}
          />
          <StatsCard
            icon={Mountain}
            label="Gesamtstrecke"
            value={totalDistance.toFixed(1)}
            unit="km"
            delay={0.1}
          />
          <StatsCard
            icon={TrendingUp}
            label="Höhenmeter"
            value={Math.round(totalElevation).toLocaleString()}
            unit="m"
            delay={0.2}
          />
          <StatsCard
            icon={Clock}
            label="Gehzeit gesamt"
            value={Math.round(totalTime / 60)}
            unit="Std"
            delay={0.3}
          />
        </div>

        {/* Map Section */}
        {hikesWithCoords.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mb-12"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-light text-stone-800">Übersichtskarte</h2>
              <Link to={createPageUrl("MapView")}>
                <Button variant="ghost" className="text-stone-600 hover:text-stone-800">
                  <Map className="w-4 h-4 mr-2" />
                  Große Karte
                </Button>
              </Link>
            </div>
            <HikeMap hikes={hikesWithCoords} height="350px" />
          </motion.div>
        )}

        {/* Recent Hikes */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-light text-stone-800">Neueste Touren</h2>
            <Link to={createPageUrl("Hikes")}>
              <Button variant="ghost" className="text-stone-600 hover:text-stone-800">
                Alle anzeigen
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          
          {recentHikes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recentHikes.map((hike, index) => (
                <HikeCard key={hike.id} hike={hike} dogs={dogs} index={index} />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 bg-white rounded-2xl border border-stone-200/50"
            >
              <Mountain className="w-16 h-16 text-stone-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-stone-700 mb-2">Noch keine Touren</h3>
              <p className="text-stone-500 mb-6">Bald findest du hier tolle Wanderungen!</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}