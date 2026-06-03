import { TOUR_ICONS } from "@/lib/difficultyConfig";
import { getAvatarDataUrl } from "@/lib/fallbackImages";
import { supabase } from "@/lib/supabaseClient";

export const BADGE_DEFS = {
  champion: { emoji: "🏆", label: "Champion", desc: "Platz 1 im Ranking" },
  veteran: { emoji: "🏅", label: "Veteran", desc: "50+ Wanderungen", threshold: { field: "tourCount", min: 50 } },
  explorer: { emoji: "🧭", label: "Entdecker", desc: "10+ Wanderungen", threshold: { field: "tourCount", min: 10 } },
  ultra: { emoji: "⚡", label: "Ultra-Läufer", desc: "500+ km", threshold: { field: "totalDistance", min: 500 } },
  marathoner: { emoji: "🏃", label: "Kilometerfresser", desc: "100+ km", threshold: { field: "totalDistance", min: 100 } },
  mountaineer: { emoji: TOUR_ICONS.elevation, label: "Gipfelstürmer", desc: "1.000+ Höhenmeter", threshold: { field: "totalElevation", min: 1000 } },
  popular: { emoji: "⭐", label: "Liebling", desc: "Ø 4,5 Sterne (3+ Bewertungen)" },
};

export function getBadges(stats, isChampion = false) {
  const badges = [];
  if (isChampion) badges.push("champion");
  if (stats.tourCount >= BADGE_DEFS.veteran.threshold.min) badges.push("veteran");
  else if (stats.tourCount >= BADGE_DEFS.explorer.threshold.min) badges.push("explorer");
  if (stats.totalDistance >= BADGE_DEFS.ultra.threshold.min) badges.push("ultra");
  else if (stats.totalDistance >= BADGE_DEFS.marathoner.threshold.min) badges.push("marathoner");
  if (stats.totalElevation >= BADGE_DEFS.mountaineer.threshold.min) badges.push("mountaineer");
  if (stats.avgRating >= 4.5 && stats.ratingCount >= 3) badges.push("popular");
  return badges;
}

function getEntryDogIds(entry) {
  const legacyDogId = entry?.dog_id ? [entry.dog_id] : [];
  const multiDogIds = Array.isArray(entry?.dog_ids) ? entry.dog_ids.filter(Boolean) : [];
  return [...new Set([...multiDogIds, ...legacyDogId])];
}

function getEntryDate(entry) {
  const rawDate = entry?.date || entry?.created_at;
  if (!rawDate) return null;
  const parsed = new Date(rawDate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function matchesTimeframe(entry, timeframe) {
  if (timeframe === "overall") return true;

  const entryDate = getEntryDate(entry);
  if (!entryDate) return false;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (timeframe === "week") {
    const weekday = today.getDay();
    const mondayOffset = weekday === 0 ? 6 : weekday - 1;
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - mondayOffset);
    return entryDate >= startOfWeek;
  }

  if (timeframe === "month") {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return entryDate >= startOfMonth;
  }

  return true;
}

function createEmptyStats() {
  return {
    totalDistance: 0,
    totalElevation: 0,
    tourCount: 0,
    ratingSum: 0,
    ratingCount: 0,
  };
}

function accumulateDogStats(stats, entry, { elevationField = "elevation_m", includeRating = true } = {}) {
  stats.tourCount += 1;
  stats.totalDistance += Number(entry?.distance_km || 0);
  stats.totalElevation += Number(entry?.[elevationField] || 0);

  if (includeRating && entry?.rating) {
    stats.ratingSum += Number(entry.rating);
    stats.ratingCount += 1;
  }
}

function isMissingColumnError(error, columnName) {
  const message = String(error?.message || "");
  return (
    message.includes(`Could not find the '${columnName}' column`) ||
    message.includes(`column ${columnName} does not exist`)
  );
}

function isAccessError(error) {
  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("permission denied") ||
    message.includes("not allowed") ||
    message.includes("jwt") ||
    message.includes("row-level security") ||
    message.includes("violates row-level security")
  );
}

async function fetchJournalEntriesForLeaderboard() {
  let result = await supabase
    .from("journal_entries")
    .select("dog_id, dog_ids, distance_km, elevation_m, rating, date, created_at, visibility, status");

  if (result.error && isMissingColumnError(result.error, "dog_ids")) {
    result = await supabase
      .from("journal_entries")
      .select("dog_id, distance_km, elevation_m, rating, date, created_at, visibility, status");
  }

  return result;
}

async function fetchApprovedPublicHikesForLeaderboard() {
  let result = await supabase
    .from("public_hikes")
    .select("dog_id, dog_ids, distance_km, elevation_gain_m, date, created_at, status")
    .eq("status", "approved");

  if (result.error && isMissingColumnError(result.error, "dog_ids")) {
    result = await supabase
      .from("public_hikes")
      .select("dog_id, distance_km, elevation_gain_m, date, created_at, status")
      .eq("status", "approved");
  }

  return result;
}

export async function loadLeaderboard(timeframe = "overall") {
  const { data: rpcRows, error: rpcError } = await supabase.rpc("get_top_dogs_leaderboard", {
    timeframe_value: timeframe,
  });

  let leaderboard = [];

  if (!rpcError && Array.isArray(rpcRows)) {
    leaderboard = rpcRows
      .map((row) => ({
        dog: {
          id: row.dog_id,
          user_id: row.user_id,
          name: row.dog_name,
          breed: row.dog_breed,
          photo_url: row.dog_photo_url,
        },
        profile: null,
        tourCount: Number(row.tour_count || 0),
        totalDistance: Number(row.total_distance || 0),
        totalElevation: Number(row.total_elevation || 0),
        avgRating: Number(row.avg_rating || 0),
        ratingCount: Number(row.rating_count || 0),
      }))
      .filter((row) => row.dog?.id);
  } else {
    const { data: entries, error: entriesError } = await fetchJournalEntriesForLeaderboard();

    if (entriesError) {
      if (isAccessError(entriesError)) {
        return leaderboard;
      }
      throw entriesError;
    }
    const filteredEntries = (entries ?? []).filter(
      (entry) => getEntryDogIds(entry).length > 0 && matchesTimeframe(entry, timeframe)
    );
    if (filteredEntries.length > 0) {
      const dogIds = [...new Set(filteredEntries.flatMap(getEntryDogIds))];

      const { data: dogs, error: dogsError } = await supabase
        .from("dogs")
        .select("id, name, breed, photo_url, user_id")
        .in("id", dogIds);

      if (dogsError) {
        if (isAccessError(dogsError)) {
          return leaderboard;
        }
        throw dogsError;
      }

      const ownerIds = [...new Set((dogs ?? []).map((dog) => dog.user_id))];
      const { data: profiles } = ownerIds.length
        ? await supabase
            .from("public_profiles")
            .select("user_id, username, full_name, avatar_url")
            .in("user_id", ownerIds)
        : { data: [] };

      const profileMap = Object.fromEntries((profiles ?? []).map((profile) => [profile.user_id, profile]));
      const dogMap = Object.fromEntries((dogs ?? []).map((dog) => [dog.id, dog]));

      const statsMap = {};
      for (const entry of filteredEntries) {
        for (const dogId of getEntryDogIds(entry)) {
          if (!statsMap[dogId]) {
            statsMap[dogId] = createEmptyStats();
          }

          accumulateDogStats(statsMap[dogId], entry);
        }
      }

      leaderboard = dogIds
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
  }

  try {
    const { data: publicHikes, error: publicHikesError } = await fetchApprovedPublicHikesForLeaderboard();

    if (publicHikesError) {
      if (isAccessError(publicHikesError) || isMissingColumnError(publicHikesError, "dog_ids")) {
        return leaderboard;
      }
      throw publicHikesError;
    }

    const relevantPublicHikes = (publicHikes ?? []).filter(
      (entry) => getEntryDogIds(entry).length > 0 && matchesTimeframe(entry, timeframe)
    );

    if (!relevantPublicHikes.length) {
      return leaderboard;
    }

    const leaderboardMap = new Map(
      leaderboard
        .filter((entry) => entry?.dog?.id)
        .map((entry) => [entry.dog.id, { ...entry }])
    );
    const missingDogIds = [...new Set(
      relevantPublicHikes
        .flatMap(getEntryDogIds)
        .filter((dogId) => !leaderboardMap.has(dogId))
    )];

    if (missingDogIds.length > 0) {
      const { data: missingDogs, error: missingDogsError } = await supabase
        .from("dogs")
        .select("id, name, breed, photo_url, user_id")
        .in("id", missingDogIds);

      if (missingDogsError) {
        if (isAccessError(missingDogsError)) {
          return leaderboard;
        }
        throw missingDogsError;
      }

      for (const dog of missingDogs ?? []) {
        leaderboardMap.set(dog.id, {
          dog,
          profile: null,
          tourCount: 0,
          totalDistance: 0,
          totalElevation: 0,
          avgRating: 0,
          ratingCount: 0,
        });
      }
    }

    for (const entry of relevantPublicHikes) {
      for (const dogId of getEntryDogIds(entry)) {
        const leaderboardEntry = leaderboardMap.get(dogId);
        if (!leaderboardEntry?.dog) {
          continue;
        }

        const stats = {
          tourCount: leaderboardEntry.tourCount,
          totalDistance: leaderboardEntry.totalDistance,
          totalElevation: leaderboardEntry.totalElevation,
          ratingSum: leaderboardEntry.avgRating * leaderboardEntry.ratingCount,
          ratingCount: leaderboardEntry.ratingCount,
        };

        accumulateDogStats(stats, entry, { elevationField: "elevation_gain_m", includeRating: false });

        leaderboardMap.set(dogId, {
          ...leaderboardEntry,
          tourCount: stats.tourCount,
          totalDistance: +stats.totalDistance.toFixed(1),
          totalElevation: Math.round(stats.totalElevation),
          avgRating: stats.ratingCount ? +(stats.ratingSum / stats.ratingCount).toFixed(1) : 0,
          ratingCount: stats.ratingCount,
        });
      }
    }

    return [...leaderboardMap.values()].filter((row) => row.dog);
  } catch (error) {
    console.warn("[topDogs] optional public_hikes supplement failed:", error?.message || error);
    return leaderboard;
  }
}
