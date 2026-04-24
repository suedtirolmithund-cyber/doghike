import { useState } from "react";
import { getAllHikes } from "@/api/sheetsClient";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Mountain, Route, Map, ArrowRight, Search, LogIn, UserPlus, ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StatsCard from "@/components/stats/StatsCard";
import HikeCard from "@/components/hikes/HikeCard";
import HikeMap from "@/components/map/HikeMap";

const PAGE_SIZE = 10;

function getCurrentSeason() {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5) return "spring";
  if (m >= 6 && m <= 8) return "summer";
  if (m >= 9 && m <= 11) return "autumn";
  return "winter";
}

function sortBySeason(hikes, season) {
  return [...hikes].sort((a, b) => {
    const score = (h) =>
      h.season === season ? 3 : h.season === "all_year" ? 2 : h.season ? 1 : 0;
    return score(b) - score(a);
  });
}

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { isAuthenticated } = useAuth();

  const { data: hikes = [], isLoading } = useQuery({
    queryKey: ["allHikes"],
    queryFn: getAllHikes,
    staleTime: 5 * 60 * 1000,
  });

  const season = getCurrentSeason();

  const filteredHikes = sortBySeason(
    hikes.filter((h) => {
      if (!searchQuery) return true;
      return (
        h.trail_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }),
    season
  );

  const visibleHikes   = filteredHikes.slice(0, visibleCount);
  const hasMore        = visibleCount < filteredHikes.length;
  const hikesWithCoords = filteredHikes.filter((h) => h.latitude && h.longitude);

  const seasonLabel = { spring: "Frühling", summer: "Sommer", autumn: "Herbst", winter: "Winter" }[season];

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-slate-50 pb-24 md:pb-8">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover"
          style={{
            backgroundImage: "url('/splash/autumn-hero.jpg')",
            backgroundPosition: "60% 75%",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/50 to-stone-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="text-center">
            <h1 className="text-4xl md:text-6xl font-light text-white mb-4 tracking-tight">
              Hundefreundliche Wanderungen
            </h1>
            <p className="text-lg text-white/70 mb-8 max-w-2xl mx-auto">
              Entdecke die schönsten Wanderungen in den Bergen zusammen mit deinem Vierbeinern.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to={createPageUrl("Hikes")}>
                <Button size="lg" className="bg-white text-slate-800 hover:bg-white/90 shadow-lg">
                  <Mountain className="w-5 h-5 mr-2" /> Alle Touren entdecken
                </Button>
              </Link>
              <Link to={createPageUrl("AddJournalEntry")}>
                <Button size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                  <Plus className="w-5 h-5 mr-2" /> Tour einreichen
                </Button>
              </Link>
              {!isAuthenticated && (
                <Link to={createPageUrl("Login")}>
                  <Button size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                    <UserPlus className="w-5 h-5 mr-2" /> Registrieren
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10 pb-20">
        {/* Search */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <Input
              placeholder="Tour oder Ort suchen..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(PAGE_SIZE); }}
              className="pl-12 h-14 text-lg bg-white shadow-md border-stone-200"
            />
          </div>
        </motion.div>

        {/* Stats */}
        <div className="mb-12 text-center">
          <StatsCard icon={Route} label="Wanderungen" value={filteredHikes.length} delay={0} />
        </div>

        {/* Map */}
        {hikesWithCoords.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-light text-stone-800">Übersichtskarte</h2>
              <Link to={createPageUrl("MapView")}>
                <Button variant="ghost" className="text-stone-600 hover:text-stone-800">
                  <Map className="w-4 h-4 mr-2" /> Große Karte
                </Button>
              </Link>
            </div>
            <HikeMap hikes={hikesWithCoords} height="350px" showLegend center={[46.5, 11.9]} zoom={9} />
          </motion.div>
        )}

        {/* Hike list */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-light text-stone-800">
                {searchQuery ? "Suchergebnisse" : "Unsere Wandertipps für dich"}
              </h2>
              {!searchQuery && (
                <p className="text-sm text-stone-400 mt-0.5">
                  Passend zur aktuellen Jahreszeit – {seasonLabel} & Ganzjährig
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {!isAuthenticated && (
                <Link to={createPageUrl("Login")}>
                  <Button variant="outline" className="text-stone-700 border-stone-300">
                    <LogIn className="w-4 h-4 mr-2" /> Anmelden
                  </Button>
                </Link>
              )}
              <Link to={createPageUrl("Hikes")}>
                <Button variant="ghost" className="text-stone-600 hover:text-stone-800">
                  Alle anzeigen <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-72 bg-stone-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : visibleHikes.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {visibleHikes.map((hike, i) => (
                  <HikeCard key={`${hike._source ?? "sheets"}-${hike.id}`} hike={hike} index={i} />
                ))}
              </div>

              {hasMore && (
                <div className="mt-8 text-center">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                    className="gap-2 border-stone-300 text-stone-700 hover:bg-stone-50"
                  >
                    <ChevronDown className="w-4 h-4" />
                    10 weitere laden ({filteredHikes.length - visibleCount} übrig)
                  </Button>
                </div>
              )}
            </>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-20 bg-white rounded-2xl border border-stone-200/50">
              <Mountain className="w-16 h-16 text-stone-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-stone-700 mb-2">
                {searchQuery ? "Keine Touren gefunden" : "Noch keine Touren"}
              </h3>
              {searchQuery && (
                <Button variant="ghost" onClick={() => setSearchQuery("")} className="mt-2">
                  Suche zurücksetzen
                </Button>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
