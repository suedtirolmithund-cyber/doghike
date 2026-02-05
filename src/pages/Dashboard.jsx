import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Mountain, Route, Clock, TrendingUp, Plus, Map, ArrowRight, Search, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StatsCard from "@/components/stats/StatsCard";
import HikeCard from "@/components/hikes/HikeCard";
import DogAvatar from "@/components/dogs/DogAvatar";
import HikeMap from "@/components/map/HikeMap";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status
  base44.auth.isAuthenticated().then(setIsAuthenticated);

  const { data: hikes = [], isLoading: hikesLoading } = useQuery({
    queryKey: ["hikes"],
    queryFn: () => base44.entities.Hike.filter({ status: "approved" }, "-date", 1000)
  });

  const { data: dogs = [], isLoading: dogsLoading } = useQuery({
    queryKey: ["dogs"],
    queryFn: () => base44.entities.Dog.list()
  });

  const filteredHikes = hikes.filter((hike) => {
    if (!searchQuery) return true;
    return hike.trail_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hike.location?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const recentHikes = filteredHikes.slice(0, 6);
  const hikesWithCoords = filteredHikes.filter((h) => h.latitude && h.longitude);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-slate-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&q=80')"
          }} />

        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/50 to-stone-50" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center">

            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
              Wandern in Südtirol mit Hund
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Entdecke hundefreundliche Wanderungen in den Dolomiten – getestet und bewertet von Hundebesitzern
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to={createPageUrl("Hikes")}>
                <Button size="lg" className="bg-slate-800 text-white hover:bg-slate-900 shadow-xl text-base px-8 py-6">
                  <Mountain className="w-5 h-5 mr-2" />
                  Touren durchsuchen
                </Button>
              </Link>
              <Link to={createPageUrl("MapView")}>
                <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur-sm border-2 border-white/40 text-white hover:bg-white/20 text-base px-8 py-6">
                  <Map className="w-5 h-5 mr-2" />
                  Zur Karte
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10 pb-20">
        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 max-w-2xl mx-auto">

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <Input
              placeholder="Tour oder Ort suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-lg bg-white shadow-md border-stone-200" />

          </div>
        </motion.div>

        {/* Stats - Only Count */}
        <div className="mb-12 text-center">
          <StatsCard
            icon={Route}
            label="Wanderungen"
            value={filteredHikes.length}
            delay={0} />

        </div>

        {/* Map Section */}
        {hikesWithCoords.length > 0 &&
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mb-12">

            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-stone-800">Alle Touren auf der Karte</h2>
                <p className="text-sm text-stone-500 mt-1">Überblick über Wanderungen in der Region</p>
              </div>
              <Link to={createPageUrl("MapView")}>
                <Button className="bg-slate-800 hover:bg-slate-900 text-white">
                  <Map className="w-4 h-4 mr-2" />
                  Vollbildkarte
                </Button>
              </Link>
            </div>
            <HikeMap hikes={hikesWithCoords} height="350px" showLegend={true} center={[46.5, 11.9]} zoom={9} />
          </motion.div>
        }

        {/* Recent Hikes */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-stone-800">Neueste Touren</h2>
              <p className="text-sm text-stone-500 mt-1">Frisch hinzugefügte Wanderungen</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!isAuthenticated &&
              <>
                  <Button
                  variant="outline"
                  onClick={() => base44.auth.redirectToLogin(window.location.href)}
                  className="text-stone-700 border-stone-300 hover:bg-stone-50">

                    <LogIn className="w-4 h-4 mr-2" />
                    Anmelden
                  </Button>
                  <Button
                  onClick={() => base44.auth.redirectToLogin(window.location.href)}
                  className="bg-slate-800 hover:bg-slate-900 text-white shadow-md">

                    <UserPlus className="w-4 h-4 mr-2" />
                    Registrieren
                  </Button>
                </>
              }
              <Link to={createPageUrl("Hikes")}>
                <Button className="bg-slate-800 hover:bg-slate-900 text-white">
                  Alle Touren
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
          
          {recentHikes.length > 0 ?
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recentHikes.map((hike, index) =>
            <HikeCard key={hike.id} hike={hike} dogs={dogs} index={index} />
            )}
            </div> :

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-white rounded-2xl border border-stone-200/50">

              <Mountain className="w-16 h-16 text-stone-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-stone-700 mb-2">Noch keine Touren</h3>
              <p className="text-stone-500 mb-6">Bald findest du hier tolle Wanderungen!</p>
            </motion.div>
          }
        </div>
      </div>
    </div>);

}