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
      <div className="relative h-[560px] overflow-hidden bg-black md:h-[507px]">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/splash/autumn-hero.jpg')",
            backgroundPosition: "center 38%",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/65 md:hidden" />
        <div className="relative z-10 flex h-full flex-col items-center justify-end px-4 pb-8 text-center md:hidden">
          <h1 className="max-w-[340px] font-['Inter',sans-serif] text-[38px] font-light leading-[42px] text-white">
            Hundefreundliche Wanderungen
          </h1>
          <p className="mt-4 max-w-[330px] font-['Inter',sans-serif] text-[16px] leading-[24px] text-white">
            Entdecke die schönsten Wanderungen in den Bergen, zusammen mit deinem Vierbeiner.
          </p>

          <div className="mt-6 grid w-full max-w-[343px] gap-3">
            <Link to={createPageUrl("Hikes")}>
              <Button size="lg" variant="outline" className="h-[46px] w-full rounded-[15px] border border-white bg-slate-900/50 text-[16px] font-semibold text-white shadow-[0_12px_24px_rgba(0,0,0,0.14)] hover:bg-slate-900/60 hover:text-white">
                <Mountain className="h-[18px] w-[18px]" /> Alle Touren entdecken
              </Button>
            </Link>
            <Link to={createPageUrl("AddJournalEntry")}>
              <Button size="lg" variant="outline" className="h-[46px] w-full rounded-[15px] border border-white bg-slate-900/50 text-[16px] font-semibold text-white hover:bg-slate-900/60 hover:text-white">
                <Plus className="h-[18px] w-[18px]" /> Tour einreichen
              </Button>
            </Link>
            {!isAuthenticated && (
              <Link to={createPageUrl("Login")}>
                <Button size="lg" variant="outline" className="h-[46px] w-full rounded-[15px] border border-white bg-slate-900/50 text-[16px] font-semibold text-white hover:bg-slate-900/60 hover:text-white">
                  <UserPlus className="h-[18px] w-[18px]" /> Registrieren
                </Button>
              </Link>
            )}
          </div>

          <div className="relative mt-5 h-[52px] w-full max-w-[343px]">
            <Search className="absolute left-[16px] top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-white/75" />
            <Input
              placeholder="Tour oder Ort suchen..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(PAGE_SIZE); }}
              className="h-[52px] w-full rounded-[15px] border border-white bg-stone-800/20 pl-12 pr-4 font-['Inter',sans-serif] text-[16px] text-white placeholder:text-white"
            />
          </div>
        </div>

        <div className="absolute left-1/2 top-0 hidden h-[507px] w-full max-w-[1280px] -translate-x-1/2 md:block">
          <div className="absolute left-[-14.19px] top-[403.95px] h-[159.45px] w-[1333.01px] -rotate-[0.07deg] bg-white/30 opacity-70 blur-[8.25px]" />
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="absolute left-[24px] top-[78.2px] h-[63px] w-[1232px] text-center font-['Inter',sans-serif] text-[60px] font-light leading-[63px] tracking-[-1.2px] text-white">
              Hundefreundliche Wanderungen
            </h1>
            <p className="absolute left-[300px] top-[162.4px] h-[60px] w-[680px] text-center font-['Inter',sans-serif] text-[18px] font-normal leading-[30px] text-white">
              Entdecke die schönsten Wanderungen in den Bergen,<br />
              zusammen mit deinem Vierbeiner.
            </p>
            <div className="absolute left-1/2 top-[281px] flex h-[46px] -translate-x-1/2 items-center justify-center gap-4">
              <Link to={createPageUrl("Hikes")}>
                <Button size="lg" variant="outline" className="h-[46px] w-[224.19px] rounded-[15px] border border-white bg-slate-900/50 px-0 text-[16px] font-semibold leading-[19px] text-white shadow-[0_12px_24px_rgba(0,0,0,0.14)] hover:bg-slate-900/60 hover:text-white">
                  <Mountain className="mr-0 h-[18px] w-[18px]" /> Alle Touren entdecken
                </Button>
              </Link>
              <Link to={createPageUrl("AddJournalEntry")}>
                <Button size="lg" variant="outline" className="h-[46px] w-[177.56px] rounded-[15px] border border-white bg-slate-900/50 px-0 text-[16px] font-semibold leading-[19px] text-white hover:bg-slate-900/60 hover:text-white">
                  <Plus className="mr-0 h-[18px] w-[18px]" /> Tour einreichen
                </Button>
              </Link>
              {!isAuthenticated && (
                <Link to={createPageUrl("Login")}>
                  <Button size="lg" variant="outline" className="h-[46px] w-[153.64px] rounded-[15px] border border-white bg-slate-900/50 px-0 text-[16px] font-semibold leading-[19px] text-white hover:bg-slate-900/60 hover:text-white">
                    <UserPlus className="mr-0 h-[18px] w-[18px]" /> Registrieren
                  </Button>
                </Link>
              )}
            </div>

            <div className="absolute left-1/2 top-[422px] h-[56px] w-[672px] -translate-x-1/2">
              <Search className="absolute left-[16px] top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-white/75" />
              <Input
                placeholder="Tour oder Ort suchen..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(PAGE_SIZE); }}
                className="h-[56px] w-[672px] rounded-[15px] border border-white bg-stone-800/15 pl-12 pr-[18px] font-['Inter',sans-serif] text-[20px] font-normal leading-[24px] text-white shadow-[0_8px_22px_rgba(41,37,36,0.12)] placeholder:text-white [text-shadow:0_4px_4px_rgba(0,0,0,0.25)]"
              />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pb-20 pt-10">
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
