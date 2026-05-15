import { useEffect, useMemo, useState } from "react";
import { getAllHikes } from "@/api/sheetsClient";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Mountain, Route, Map, ArrowRight, Search, LogIn, UserPlus, ChevronDown, Plus, Globe, Dog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StatsCard from "@/components/stats/StatsCard";
import HikeCard from "@/components/hikes/HikeCard";
import HikeMap from "@/components/map/HikeMap";
import { getDogProfileCount, getDogs } from "@/lib/profilesApi";
import { matchesHikeSearch } from "@/lib/hikeSearch";
import { hasSeenDogNudgeThisSession, markDogNudgeSeenThisSession } from "@/lib/dogNudgeSession";

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
    const score = (h) => {
      const seasons = Array.isArray(h.seasons) && h.seasons.length > 0
        ? h.seasons
        : h.season ? [h.season] : [];

      return seasons.includes(season) ? 3 : seasons.includes("all_year") ? 2 : seasons.length > 0 ? 1 : 0;
    };
    return score(b) - score(a);
  });
}

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { isAuthenticated, user, isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const submitHikeUrl = isAuthenticated
    ? createPageUrl("AddJournalEntry")
    : createPageUrl("Login");

  const { data: hikes = [], isLoading } = useQuery({
    queryKey: ["allHikes"],
    queryFn: getAllHikes,
    staleTime: 5 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const { data: dogs = [], isLoading: isLoadingDogs } = useQuery({
    queryKey: ["dogs", user?.id],
    queryFn: () => getDogs(user.id),
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const { data: dogProfileCount = 0 } = useQuery({
    queryKey: ["dogProfileCount"],
    queryFn: getDogProfileCount,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (isLoadingAuth || isLoadingDogs) return;
    if (!isAuthenticated || !user?.id) return;
    if (dogs.length > 0) return;
    if (hasSeenDogNudgeThisSession(user.id)) return;

    markDogNudgeSeenThisSession(user.id);
    navigate(createPageUrl("Dogs"), { replace: true });
  }, [dogs.length, isAuthenticated, isLoadingAuth, isLoadingDogs, navigate, user?.id]);

  const season = getCurrentSeason();

  const filteredHikes = sortBySeason(
    hikes.filter((h) => matchesHikeSearch(h, searchQuery)),
    season
  );

  const countryCount = useMemo(() => {
    const uniqueCountries = new Set(
      hikes
        .map((hike) => hike.country)
        .filter(Boolean)
        .map((country) => String(country).trim().toLowerCase())
    );
    return uniqueCountries.size;
  }, [hikes]);

  const safeDogProfileCount = Number.isFinite(dogProfileCount) ? dogProfileCount : 0;

  const visibleHikes   = filteredHikes.slice(0, visibleCount);
  const hasMore        = visibleCount < filteredHikes.length;
  const hikesWithCoords = filteredHikes.filter((h) => h.latitude && h.longitude);

  const seasonLabel = { spring: "Frühling", summer: "Sommer", autumn: "Herbst", winter: "Winter" }[season];

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50/20 pb-24 md:pb-8">
      {/* Hero */}
      <div className="relative h-[520px] overflow-hidden bg-gradient-to-br from-[#d8c6b7] via-[#b9a48f] to-[#6f8583] sm:h-[560px] md:h-[507px]">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/splash/autumn-hero.jpg')",
            backgroundPosition: "center 38%",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/65 md:hidden" />
        <div className="relative z-10 flex h-full flex-col items-center justify-end px-4 pb-8 text-center md:hidden">
          <h1 className="max-w-[340px] text-[38px] font-light leading-[42px] text-white">
            Hundefreundliche Wanderungen
          </h1>
          <p className="mt-4 max-w-[330px] text-[16px] leading-[24px] text-white">
            Entdecke die schönsten Wanderungen in den Bergen, zusammen mit deinem Vierbeiner.
          </p>

          <div className="mt-6 grid w-full max-w-[343px] gap-3">
            <Link to={createPageUrl("Hikes")}>
              <Button size="lg" variant="outline" className="h-[46px] w-full border !border-[#F9C030] !bg-[#FDF0E8] !text-[#7C3020] shadow-[0_12px_26px_rgba(249,192,48,0.2)] hover:!bg-[#FDF0E8] hover:!text-[#7C3020]">
                <Mountain className="h-[18px] w-[18px] text-[#F07030]" /> Alle Touren entdecken
              </Button>
            </Link>
            <Link to={submitHikeUrl}>
              <Button size="lg" variant="outline" className="h-[46px] w-full border !border-[#F9C030] !bg-[#FDF0E8] !text-[#7C3020] shadow-[0_12px_26px_rgba(249,192,48,0.2)] hover:!bg-[#FDF0E8] hover:!text-[#7C3020]">
                <Plus className="h-[18px] w-[18px] text-[#F07030]" /> Tour einreichen
              </Button>
            </Link>
            {!isAuthenticated && (
              <Link to={createPageUrl("Login")}>
                  <Button size="lg" variant="outline" className="h-[46px] w-full border !border-[#F9C030] !bg-[#FDF0E8] !text-[#7C3020] shadow-[0_12px_26px_rgba(249,192,48,0.2)] hover:!bg-[#FDF0E8] hover:!text-[#7C3020]">
                    <UserPlus className="h-[18px] w-[18px] text-[#F07030]" /> Registrieren
                </Button>
              </Link>
            )}
          </div>

          <div className="relative mt-5 h-[52px] w-full max-w-[343px]">
            <Search className="absolute left-[16px] top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-[#F07030]" />
            <Input
              placeholder="Tour oder Ort suchen..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(PAGE_SIZE); }}
              className="h-[52px] w-full rounded-xl border border-[#F9C030] bg-[#FDF0E8]/92 pl-12 pr-4 text-sm font-bold text-[#7C3020] shadow-[0_10px_26px_rgba(249,192,48,0.2)] placeholder:text-[#7C3020]/75"
            />
          </div>
        </div>

        <div className="absolute left-1/2 top-0 hidden h-[507px] w-full max-w-[1280px] -translate-x-1/2 md:block">
          <div className="absolute left-[-14.19px] top-[403.95px] h-[159.45px] w-[1333.01px] -rotate-[0.07deg] bg-white/30 opacity-70 blur-[8.25px]" />
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="absolute left-[24px] top-[78.2px] h-[63px] w-[1232px] text-center text-[60px] font-light leading-[63px] tracking-[-1.2px] text-white">
              Hundefreundliche Wanderungen
            </h1>
            <p className="absolute left-[300px] top-[162.4px] h-[60px] w-[680px] text-center text-[18px] font-normal leading-[30px] text-white">
              Entdecke die schönsten Wanderungen in den Bergen,<br />
              zusammen mit deinem Vierbeiner.
            </p>
            <div className="absolute left-1/2 top-[281px] flex h-[46px] -translate-x-1/2 items-center justify-center gap-2">
              <Link to={createPageUrl("Hikes")}>
                <Button size="lg" variant="outline" className="h-[46px] w-[224.19px] border !border-[#F9C030] !bg-[#FDF0E8] px-0 text-[16px] font-bold leading-[19px] !text-[#7C3020] shadow-[0_12px_26px_rgba(249,192,48,0.2)] hover:!bg-[#FDF0E8] hover:!text-[#7C3020]">
                  <Mountain className="mr-0 h-[18px] w-[18px] text-[#F07030]" /> Alle Touren entdecken
                </Button>
              </Link>
              <Link to={submitHikeUrl}>
                <Button size="lg" variant="outline" className="h-[46px] w-[177.56px] border !border-[#F9C030] !bg-[#FDF0E8] px-0 text-[16px] font-bold leading-[19px] !text-[#7C3020] shadow-[0_12px_26px_rgba(249,192,48,0.2)] hover:!bg-[#FDF0E8] hover:!text-[#7C3020]">
                  <Plus className="mr-0 h-[18px] w-[18px] text-[#F07030]" /> Tour einreichen
                </Button>
              </Link>
              {!isAuthenticated && (
                <Link to={createPageUrl("Login")}>
                    <Button size="lg" variant="outline" className="h-[46px] w-[153.64px] border !border-[#F9C030] !bg-[#FDF0E8] px-0 text-[16px] font-bold leading-[19px] !text-[#7C3020] shadow-[0_12px_26px_rgba(249,192,48,0.2)] hover:!bg-[#FDF0E8] hover:!text-[#7C3020]">
                      <UserPlus className="mr-0 h-[18px] w-[18px] text-[#F07030]" /> Registrieren
                  </Button>
                </Link>
              )}
            </div>

            <div className="absolute left-1/2 top-[386px] h-[56px] w-[672px] -translate-x-1/2">
              <Search className="absolute left-[16px] top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-[#F07030]" />
              <Input
                placeholder="Tour oder Ort suchen..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(PAGE_SIZE); }}
                className="h-[56px] w-[672px] rounded-xl border border-[#F9C030] bg-[#FDF0E8]/92 pl-12 pr-[18px] text-sm font-bold leading-[24px] text-[#7C3020] shadow-[0_10px_28px_rgba(249,192,48,0.2)] placeholder:text-[#7C3020]/75"
              />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-32 pt-8 sm:px-6 sm:pt-10 md:pb-20 lg:px-8">
        {/* Stats */}
        <div className="mb-12 grid grid-cols-1 gap-4 text-center md:grid-cols-3">
          <StatsCard icon={Route} label="Wanderungen" value={hikes.length} delay={0} />
          <StatsCard icon={Globe} label="Länder" value={countryCount} delay={0.08} />
          <StatsCard
            icon={Dog}
            label="Wanderbuddies"
            value={safeDogProfileCount}
            delay={0.16}
          />
        </div>

        {/* Map */}
        {hikesWithCoords.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-light text-slate-900">Übersichtskarte</h2>
              <Link to={createPageUrl("MapView")}>
                <Button variant="ghost" className="text-slate-600 hover:text-slate-900">
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
              <h2 className="text-2xl font-light text-slate-900">
                {searchQuery ? "Suchergebnisse" : "Unsere Wandertipps für dich"}
              </h2>
              {!searchQuery && (
                <p className="text-sm text-slate-400 mt-0.5">
                  Passend zur aktuellen Jahreszeit - {seasonLabel} & Ganzjährig
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {!isAuthenticated && (
                <Link to={createPageUrl("Login")}>
                  <Button variant="outline" className="text-slate-700 border-brand-100">
                    <LogIn className="w-4 h-4 mr-2" /> Anmelden
                  </Button>
                </Link>
              )}
              <Link to={createPageUrl("Hikes")}>
                <Button variant="ghost" className="text-slate-600 hover:text-slate-900">
                  Alle anzeigen <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-72 bg-brand-100/80 rounded-2xl animate-pulse" />
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
                    className="gap-2 border-brand-100 text-slate-700 hover:bg-brand-50/70"
                  >
                    <ChevronDown className="w-4 h-4" />
                    10 weitere laden ({filteredHikes.length - visibleCount} übrig)
                  </Button>
                </div>
              )}
            </>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="doghike-empty-state">
              <Mountain className="doghike-empty-icon" />
              <h3 className="text-xl font-medium text-slate-700 mb-2">
                {searchQuery ? "Da ist noch nicht der richtige Weg dabei" : "Noch keine Touren"}
              </h3>
              <p className="mx-auto max-w-xs text-sm text-slate-500">
                {searchQuery ? "Ändere die Suche ein wenig. Vielleicht wartet der passende Weg gleich daneben." : "Sobald Touren verfügbar sind, erscheinen sie hier."}
              </p>
              {searchQuery && (
                <Button variant="outline" onClick={() => setSearchQuery("")} className="doghike-secondary-action mt-4">
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
