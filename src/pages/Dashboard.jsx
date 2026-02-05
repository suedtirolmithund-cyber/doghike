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

            <h1 className="text-4xl md:text-6xl font-light text-white mb-4 tracking-tight">
              Hundefreundliche Wanderungen
            </h1>
            <p className="text-lg text-white/70 mb-8 max-w-2xl mx-auto">Entdecke die schönsten Wanderungen in Südtirol, den Dolomiten. 
Getestet mit unseren Vierbeinern 
            </p>

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

        {/* Stats & Auth */}
        <div className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-4 items-center max-w-4xl mx-auto">
          <StatsCard
            icon={Route}
            label="Wanderungen"
            value={filteredHikes.length}
            delay={0} />

          {!isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-stone-200/50 shadow-sm"
            >
              <h3 className="text-lg font-medium text-stone-800 mb-2">Jetzt registrieren</h3>
              <p className="text-sm text-stone-500 mb-4">Erstelle dein Wandertagebuch und teile deine Erlebnisse</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={() => base44.auth.redirectToLogin(window.location.href)}
                  className="bg-slate-800 hover:bg-slate-900 flex-1"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Registrieren
                </Button>
                <Button
                  variant="outline"
                  onClick={() => base44.auth.redirectToLogin(window.location.href)}
                  className="flex-1"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Anmelden
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Map Section */}
        {hikesWithCoords.length > 0 &&
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mb-12">

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-light text-stone-800">Übersichtskarte</h2>
              <Link to={createPageUrl("MapView")}>
                <Button variant="ghost" className="text-stone-600 hover:text-stone-800">
                  <Map className="w-4 h-4 mr-2" />
                  Große Karte
                </Button>
              </Link>
            </div>
            <HikeMap hikes={hikesWithCoords} height="350px" showLegend={true} center={[46.5, 11.9]} zoom={9} />
          </motion.div>
        }

        {/* Recent Hikes */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-light text-stone-800">Neueste Touren</h2>
            <Link to={createPageUrl("Hikes")}>
              <Button variant="ghost" className="text-stone-600 hover:text-stone-800">
                Alle anzeigen
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
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