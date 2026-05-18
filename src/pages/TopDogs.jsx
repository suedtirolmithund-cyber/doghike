import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import {
  Trophy, TrendingUp, Ruler,
  Loader2, Dog, Sparkles,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TOUR_ICONS } from "@/lib/difficultyConfig";
import { getAvatarDataUrl } from "@/lib/fallbackImages";

// Badge-Definitionen
const BADGE_DEFS = {
  champion:    { emoji: "🏆", label: "Champion",        desc: "Platz 1 im Ranking" },
  veteran:     { emoji: "🏅", label: "Veteran",         desc: "50+ Touren" },
  explorer:    { emoji: "🧭", label: "Entdecker",       desc: "10+ Touren" },
  ultra:       { emoji: "⚡", label: "Ultra-Läufer",    desc: "500+ km" },
  marathoner:  { emoji: "🏃", label: "Kilometerfresser", desc: "100+ km" },
  mountaineer: { emoji: TOUR_ICONS.elevation, label: "Gipfelstürmer",   desc: "1.000+ Höhenmeter" },
  popular:     { emoji: "⭐", label: "Liebling",        desc: "Ø 4,5 Sterne (3+ Bewertungen)" },
};

function getBadges(s, isChampion) {
  const b = [];
  if (isChampion)             b.push("champion");
  if (s.tourCount >= 50)      b.push("veteran");
  else if (s.tourCount >= 10) b.push("explorer");
  if (s.totalDistance >= 500) b.push("ultra");
  else if (s.totalDistance >= 100) b.push("marathoner");
  if (s.totalElevation >= 1000)    b.push("mountaineer");
  if (s.avgRating >= 4.5 && s.ratingCount >= 3) b.push("popular");
  return b;
}

// Daten laden
async function loadLeaderboard() {
  // 1. Alle Tour-Einträge mit dog_id
  const { data: entries, error: eErr } = await supabase
    .from("journal_entries")
    .select("dog_id, distance_km, elevation_m, rating, date")
    .not("dog_id", "is", null);
  if (eErr) throw eErr;
  if (!entries?.length) return [];

  // 2. Unique dog IDs
  const dogIds = [...new Set(entries.map((e) => e.dog_id))];

  // 3. Hunde-Daten
  const { data: dogs, error: dErr } = await supabase
    .from("dogs")
    .select("id, name, breed, photo_url, user_id")
    .in("id", dogIds);
  if (dErr) throw dErr;

  // 4. Besitzer-Profile
  const ownerIds = [...new Set((dogs ?? []).map((d) => d.user_id))];
  const { data: profiles } = ownerIds.length
    ? await supabase
        .from("profiles")
        .select("user_id, username, full_name, avatar_url")
        .in("user_id", ownerIds)
    : { data: [] };

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.user_id, p]));
  const dogMap     = Object.fromEntries((dogs ?? []).map((d) => [d.id, d]));

  // 5. Aggregieren
  const statsMap = {};
  for (const e of entries) {
    if (!statsMap[e.dog_id]) {
      statsMap[e.dog_id] = {
        totalDistance: 0, totalElevation: 0,
        tourCount: 0, ratingSum: 0, ratingCount: 0,
      };
    }
    const s = statsMap[e.dog_id];
    s.tourCount      += 1;
    s.totalDistance  += e.distance_km  ?? 0;
    s.totalElevation += e.elevation_m  ?? 0;
    if (e.rating) { s.ratingSum += e.rating; s.ratingCount += 1; }
  }

  return dogIds
    .map((id) => {
      const dog     = dogMap[id];
      const profile = dog ? profileMap[dog.user_id] : null;
      const s       = statsMap[id];
      return {
        dog,
        profile,
        tourCount:      s.tourCount,
        totalDistance:  +s.totalDistance.toFixed(1),
        totalElevation: Math.round(s.totalElevation),
        avgRating:      s.ratingCount ? +(s.ratingSum / s.ratingCount).toFixed(1) : 0,
        ratingCount:    s.ratingCount,
      };
    })
    .filter((r) => r.dog);
}

// Hilfsfunktionen UI
const RANK_STYLE = [
  { ring: "ring-2 ring-brand-300", bg: "bg-gradient-to-br from-brand-100 to-[#A8003C]/12", border: "border-brand-300", medal: "🥇", num: "text-brand-700" },
  { ring: "ring-2 ring-brand-100",  bg: "bg-gradient-to-br from-white/80 to-brand-50",  border: "border-brand-100",  medal: "🥈", num: "text-slate-600"  },
  { ring: "ring-2 ring-brand-200", bg: "bg-gradient-to-br from-brand-50 to-brand-50", border: "border-brand-100", medal: "🥉", num: "text-brand-400" },
];

function dogPhoto(dog) {
  return dog?.photo_url || getAvatarDataUrl(dog?.name ?? "dog");
}

// Podium (Top 3)
function Podium({ top3, metric }) {
  if (!top3.length) return null;
  const order = [top3[1], top3[0], top3[2]]; // 2-1-3 Reihenfolge
  const heights = ["h-24", "h-32", "h-20"];
  const origIdx = [1, 0, 2];

  return (
    <div className="mb-6 flex items-end justify-center gap-2 px-1 sm:gap-3 sm:px-4">
      {order.map((entry, i) => {
        if (!entry) return null;
        const style  = RANK_STYLE[origIdx[i]];
        const isFirst = origIdx[i] === 0;
        return (
          <motion.div
            key={entry.dog.id}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 + 0.2 }}
            className="flex max-w-[108px] flex-1 flex-col items-center gap-1 sm:max-w-[110px]"
          >
            {/* Dog avatar */}
            <div className={`relative ${isFirst ? "h-16 w-16 sm:h-20 sm:w-20" : "h-12 w-12 sm:h-14 sm:w-14"}`}>
              <img
                src={dogPhoto(entry.dog)}
                alt={entry.dog.name}
                loading="lazy"
                decoding="async"
                className={`w-full h-full rounded-full object-cover border-4 border-white shadow-md ${style.ring}`}
              />
              <span className="absolute -top-2 -right-1 text-xl leading-none">{style.medal}</span>
            </div>

            {/* Name */}
            <p className={`max-w-full px-1 text-center font-bold leading-tight text-slate-900 ${isFirst ? "text-xs sm:text-sm" : "text-[11px] sm:text-xs"} line-clamp-2`}>
              {entry.dog.name}
            </p>
            {entry.dog.breed && (
              <p className="line-clamp-1 text-center text-[10px] text-slate-400">{entry.dog.breed}</p>
            )}

            {/* Value */}
            <p className={`font-extrabold leading-tight ${isFirst ? "text-xl sm:text-2xl" : "text-base sm:text-lg"} ${style.num}`}>
              {metric === "tours"     && entry.tourCount}
              {metric === "distance"  && `${entry.totalDistance}`}
              {metric === "elevation" && entry.totalElevation.toLocaleString()}
            </p>
            <p className="text-xs font-semibold leading-tight text-slate-500">
              {metric === "tours" ? "Touren" : metric === "distance" ? "km" : "Hm"}
            </p>

            {/* Podium block */}
            <div className={`w-full ${heights[i]} ${style.bg} border-t-2 ${style.border} rounded-t-xl`} />
          </motion.div>
        );
      })}
    </div>
  );
}

// Einzelner Rang-Eintrag
function RankRow({ entry, rank, metric, isMyDog }) {
  const style  = RANK_STYLE[rank - 1];
  const badges = getBadges(entry, rank === 1);

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: (rank - 4) * 0.04 }}
      className={`flex flex-wrap items-center gap-3 rounded-xl border p-3 ${
        isMyDog ? "border-brand-300 bg-brand-50/60 shadow-sm" : "border-white/70 bg-white/70 shadow-sm backdrop-blur-xl"
      }`}
    >
      {/* Rang */}
      <span className="w-7 text-center text-sm font-bold text-slate-500 shrink-0">#{rank}</span>

      {/* Avatar */}
      <img
        src={dogPhoto(entry.dog)}
        alt={entry.dog.name}
        loading="lazy"
        decoding="async"
        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="font-semibold text-slate-900 text-sm truncate">{entry.dog.name}</p>
          {isMyDog && <span className="text-[10px] bg-brand-100 text-brand-600 px-1.5 py-0.5 rounded-full font-medium shrink-0">Dein Hund</span>}
        </div>
        {entry.dog.breed && <p className="text-xs text-slate-400 truncate">{entry.dog.breed}</p>}
        {/* Badges */}
        {badges.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-0.5">
            {badges.map((b) => (
              <span key={b} title={`${BADGE_DEFS[b].label}: ${BADGE_DEFS[b].desc}`}
                className="text-sm leading-none cursor-default">
                {BADGE_DEFS[b].emoji}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Wert */}
      <div className="ml-auto text-right shrink-0">
        <p className="text-lg font-bold leading-tight text-slate-900">
          {metric === "tours"     && entry.tourCount}
          {metric === "distance"  && entry.totalDistance}
          {metric === "elevation" && entry.totalElevation.toLocaleString()}
        </p>
        <p className="text-xs font-semibold leading-tight text-slate-500">
          {metric === "tours" ? "Touren" : metric === "distance" ? "km" : "Hm"}
        </p>
      </div>
    </motion.div>
  );
}

function CompactRankRow({ entry, rank, metric, isMyDog }) {
  const badges = getBadges(entry, false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 + (rank - 4) * 0.05 }}
      className={`rounded-2xl border p-3 ${
        isMyDog ? "border-brand-300 bg-brand-50/70 shadow-sm" : "border-white/70 bg-white/78 shadow-sm backdrop-blur-xl"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="w-7 shrink-0 text-center text-sm font-bold text-slate-500">#{rank}</span>
        <img
          src={dogPhoto(entry.dog)}
          alt={entry.dog.name}
          loading="lazy"
          decoding="async"
          className="h-11 w-11 shrink-0 rounded-full border-2 border-white object-cover shadow-sm"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="truncate text-sm font-semibold text-slate-900">{entry.dog.name}</p>
            {isMyDog && (
              <span className="shrink-0 rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-medium text-brand-600">
                Dein Hund
              </span>
            )}
          </div>
          {entry.dog.breed && <p className="truncate text-[11px] text-slate-400">{entry.dog.breed}</p>}
          {badges.length > 0 && (
            <div className="mt-0.5 flex flex-wrap gap-1">
              {badges.map((badgeKey) => (
                <span
                  key={badgeKey}
                  title={`${BADGE_DEFS[badgeKey].label}: ${BADGE_DEFS[badgeKey].desc}`}
                  className="cursor-default text-sm leading-none"
                >
                  {BADGE_DEFS[badgeKey].emoji}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-base font-bold leading-tight text-slate-900">
            {metric === "tours" && entry.tourCount}
            {metric === "distance" && entry.totalDistance}
            {metric === "elevation" && entry.totalElevation.toLocaleString()}
          </p>
          <p className="text-xs font-semibold leading-tight text-slate-500">
            {metric === "tours" ? "Touren" : metric === "distance" ? "km" : "Hm"}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// Dein Hund - falls nicht in Top 10
function MyDogCard({ entry, rank, metric }) {
  if (!entry) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl border-2 border-brand-300 bg-brand-50/70 p-4 shadow-sm backdrop-blur-xl"
    >
      <img src={dogPhoto(entry.dog)} alt={entry.dog.name}
        loading="lazy"
        decoding="async"
        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow" />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-900">{entry.dog.name}</p>
        <p className="text-xs text-slate-500">Aktuell Platz <strong>#{rank}</strong> in dieser Kategorie</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xl font-extrabold leading-tight text-brand-600">
          {metric === "tours"     && entry.tourCount}
          {metric === "distance"  && entry.totalDistance}
          {metric === "elevation" && entry.totalElevation.toLocaleString()}
        </p>
        <p className="text-sm font-semibold leading-tight text-slate-500">
          {metric === "tours" ? "Touren" : metric === "distance" ? "km" : "Hm"}
        </p>
      </div>
    </motion.div>
  );
}

// Community-Stats
function CommunityStats({ rows }) {
  const totalTours = rows.reduce((s, r) => s + r.tourCount, 0);
  const totalKm    = rows.reduce((s, r) => s + r.totalDistance, 0);
  const totalHm    = rows.reduce((s, r) => s + r.totalElevation, 0);

  return (
    <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-3">
      {[
        { icon: Dog,       value: rows.length, label: "Hunde", color: "border-brand-100 bg-white/78 text-[#A8003C]" },
        { icon: Ruler,     value: totalKm.toFixed(0), label: "km", color: "border-[#F9C030]/80 bg-[#FDF0E8]/82 text-[#7C3020]" },
        { icon: TrendingUp,value: `${(totalHm/1000).toFixed(1)}k`, label: "Höhenmeter", color: "border-[#F07030]/45 bg-white/78 text-[#7C3020]" },
      ].map(({ icon: Icon, value, label, color }) => (
        <div key={label} className={`min-w-0 rounded-2xl border px-2 py-3 text-center shadow-[0_10px_24px_rgba(168,0,60,0.07)] ${color}`}>
          <Icon className="mx-auto mb-1 h-4 w-4 opacity-80" />
          <p className="break-words text-lg font-extrabold leading-tight sm:text-xl">{value}</p>
          <p className="break-words text-[11px] font-bold leading-tight opacity-80 sm:text-xs">{label}</p>
        </div>
      ))}
    </div>
  );
}

// Legende der Badges
function BadgeLegend() {
  return (
    <details className="doghike-glass-card mt-6 rounded-xl overflow-hidden">
      <summary className="px-4 py-3 text-sm font-semibold text-slate-600 cursor-pointer flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-brand-500" /> Abzeichen-Legende
      </summary>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-4 pt-2">
        {Object.values(BADGE_DEFS).map((b) => (
          <div key={b.label} className="flex items-center gap-2 text-sm text-slate-600">
            <span className="text-lg">{b.emoji}</span>
            <span><strong>{b.label}</strong> – {b.desc}</span>
          </div>
        ))}
      </div>
    </details>
  );
}

// Ranking-Tab-Inhalt
function RankingTab({ rows, metric, myDogIds }) {
  const sorted = useMemo(() => {
    const key = metric === "tours" ? "tourCount" : metric === "distance" ? "totalDistance" : "totalElevation";
    return [...rows].sort((a, b) => b[key] - a[key]);
  }, [rows, metric]);

  const top3 = sorted.slice(0, 3);
  const nextTwo = sorted.slice(3, 5);
  const rest  = sorted.slice(5, 10);
  const ownDogIdSet = new Set(myDogIds ?? []);
  const myIdx = sorted.findIndex((r) => ownDogIdSet.has(r.dog?.id));
  const myEntry = myIdx >= 0 ? sorted[myIdx] : null;
  const myInTop10 = myIdx >= 0 && myIdx < 10;

  if (!sorted.length) {
    return (
      <div className="doghike-empty-state">
        <Dog className="doghike-empty-icon" />
        <p className="text-slate-600 font-medium">Noch kein Gipfelmoment</p>
        <p className="mx-auto mt-1 max-w-xs text-sm text-slate-500">
          Trage die erste Wanderung mit deinem Hund ein. Dann steht ihr hier.
        </p>
      </div>
    );
  }

  return (
    <div>
      <Podium top3={top3} metric={metric} />
      {nextTwo.length > 0 && (
        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {nextTwo.map((entry, index) => (
            <CompactRankRow
              key={entry.dog.id}
              entry={entry}
              rank={index + 4}
              metric={metric}
              isMyDog={ownDogIdSet.has(entry.dog?.id)}
            />
          ))}
        </div>
      )}
      <div className="space-y-2">
        {rest.map((entry, i) => (
          <RankRow
            key={entry.dog.id}
            entry={entry}
            rank={i + 6}
            metric={metric}
            isMyDog={ownDogIdSet.has(entry.dog?.id)}
          />
        ))}
      </div>
      {/* Dein Hund falls außerhalb Top 10 */}
      {myEntry && !myInTop10 && (
        <MyDogCard entry={myEntry} rank={myIdx + 1} metric={metric} />
      )}
    </div>
  );
}

// Main Page
export default function TopDogs() {
  const { user } = useAuth();

  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ["topDogs"],
    queryFn:  loadLeaderboard,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Mein erster Hund (für Highlight)
  const { data: myDogs = [] } = useQuery({
    queryKey: ["dogs", user?.id],
    queryFn:  async () => {
      const { getDogs } = await import("@/lib/profilesApi");
      return getDogs(user.id);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const myDogIds = myDogs.map((dog) => dog.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50/20 pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 md:py-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="doghike-page-header">
          <div className="doghike-page-icon">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <h1 className="doghike-page-title">Top Dogs</h1>
            <p className="doghike-page-subtitle">Die fleißigsten Wanderhunde der Community</p>
          </div>
        </motion.div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20 gap-2 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm">Lade Ranking...</span>
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="text-center py-16 text-brand-500 text-sm">
            Die Rangliste konnte gerade nicht geladen werden. Bitte versuche es noch einmal.
          </div>
        )}

        {/* Content */}
        {!isLoading && !error && (
          <>
            {rows.length > 0 && <CommunityStats rows={rows} />}

            <Tabs defaultValue="tours">
              <TabsList className="grid w-full grid-cols-3 border border-white/70 bg-white/65 backdrop-blur-xl mb-4">
                <TabsTrigger value="tours" className="text-[13px] font-bold md:text-lg">
                  🎯 <span className="hidden sm:inline ml-1">Meiste</span> Touren
                </TabsTrigger>
                <TabsTrigger value="distance" className="text-[13px] font-bold md:text-lg">
                  {TOUR_ICONS.distance} <span className="hidden sm:inline ml-1">Meiste</span> km
                </TabsTrigger>
                <TabsTrigger value="elevation" className="text-[13px] font-bold md:text-lg">
                  {TOUR_ICONS.elevation} <span className="hidden sm:inline ml-1">Meiste</span> Hm
                </TabsTrigger>
              </TabsList>

              <TabsContent value="tours">
                <RankingTab rows={rows} metric="tours" myDogIds={myDogIds} />
              </TabsContent>
              <TabsContent value="distance">
                <RankingTab rows={rows} metric="distance" myDogIds={myDogIds} />
              </TabsContent>
              <TabsContent value="elevation">
                <RankingTab rows={rows} metric="elevation" myDogIds={myDogIds} />
              </TabsContent>
            </Tabs>

            <BadgeLegend />
          </>
        )}
      </div>
    </div>
  );
}

