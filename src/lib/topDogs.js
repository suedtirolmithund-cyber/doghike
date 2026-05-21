import { TOUR_ICONS } from "@/lib/difficultyConfig";
import { getAvatarDataUrl } from "@/lib/fallbackImages";
import { supabase } from "@/lib/supabaseClient";

export const BADGE_DEFS = {
  champion:    { emoji: "🏆", label: "Champion",         desc: "Platz 1 im Ranking" },
  veteran:     { emoji: "🏅", label: "Veteran",          desc: "50+ Touren",          threshold: { field: "tourCount",      min: 50   } },
  explorer:    { emoji: "🧭", label: "Entdecker",        desc: "10+ Touren",          threshold: { field: "tourCount",      min: 10   } },
  ultra:       { emoji: "⚡", label: "Ultra-Läufer",     desc: "500+ km",             threshold: { field: "totalDistance",  min: 500  } },
  marathoner:  { emoji: "🏃", label: "Kilometerfresser", desc: "100+ km",             threshold: { field: "totalDistance",  min: 100  } },
  mountaineer: { emoji: TOUR_ICONS.elevation, label: "Gipfelstürmer", desc: "1.000+ Höhenmeter", threshold: { field: "totalElevation", min: 1000 } },
  popular:     { emoji: "⭐", label: "Liebling",         desc: "Ø 4,5 Sterne (3+ Bewertungen)" },
};

export function getBadges(stats, isChampion = false) {
  const badges = [];
  if (isChampion) badges.push("champion");
  if (stats.tourCount >= BADGE_DEFS.veteran.threshold.min)          badges.push("veteran");
  else if (stats.tourCount >= BADGE_DEFS.explorer.threshold.min)    badges.push("explorer");
  if (stats.totalDistance >= BADGE_DEFS.ultra.threshold.min)        badges.push("ultra");
  else if (stats.totalDistance >= BADGE_DEFS.marathoner.threshold.min) badges.push("marathoner");
  if (stats.totalElevation >= BADGE_DEFS.mountaineer.threshold.min) badges.push("mountaineer");
  if (stats.avgRating >= 4.5 && stats.ratingCount >= 3)             badges.push("popular");
  return badges;
}

export async function loadLeaderboard() {
  const { data: entries, error: entriesError } = await supabase
    .from("journal_entries")
    .select("dog_id, distance_km, elevation_m, rating, date")
    .not("dog_id", "is", null);

  if (entriesError) throw entriesError;
  if (!entries?.length) return [];

  const dogIds = [...new Set(entries.map((entry) => entry.dog_id))];

  const { data: dogs, error: dogsError } = await supabase
    .from("dogs")
    .select("id, name, breed, photo_url, user_id")
    .in("id", dogIds);

  if (dogsError) throw dogsError;

  const ownerIds = [...new Set((dogs ?? []).map((dog) => dog.user_id))];
  const { data: profiles } = ownerIds.length
    ? await supabase
        .from("profiles")
        .select("user_id, username, full_name, avatar_url")
        .in("user_id", ownerIds)
    : { data: [] };

  const profileMap = Object.fromEntries((profiles ?? []).map((profile) => [profile.user_id, profile]));
  const dogMap = Object.fromEntries((dogs ?? []).map((dog) => [dog.id, dog]));

  const statsMap = {};
  for (const entry of entries) {
    if (!statsMap[entry.dog_id]) {
      statsMap[entry.dog_id] = {
        totalDistance: 0,
        totalElevation: 0,
        tourCount: 0,
        ratingSum: 0,
        ratingCount: 0,
      };
    }

    const stats = statsMap[entry.dog_id];
    stats.tourCount += 1;
    stats.totalDistance += entry.distance_km ?? 0;
    stats.totalElevation += entry.elevation_m ?? 0;
    if (entry.rating) {
      stats.ratingSum += entry.rating;
      stats.ratingCount += 1;
    }
  }

  return dogIds
    .map((id) => {
      const dog = dogMap[id];
      const profile = dog ? profileMap[dog.user_id] : null;
      const stats = statsMap[id];

      return {
        dog,
        profile,
        tourCount: stats.tourCount,
        totalDistance: +stats.totalDistance.toFixed(1),
        totalElevation: Math.round(stats.totalElevation),
        avgRating: stats.ratingCount ? +(stats.ratingSum / stats.ratingCount).toFixed(1) : 0,
        ratingCount: stats.ratingCount,
      };
    })
    .filter((row) => row.dog);
}
