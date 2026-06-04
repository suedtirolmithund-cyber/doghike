import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { normalizeSelectedSeasonValues } from "@/lib/difficultyConfig";
import { supabase } from "@/lib/supabaseClient";
import HikeCard from "./HikeCard";

function tokenizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 3);
}

function getUniqueTokens(...values) {
  return Array.from(new Set(values.flatMap((value) => tokenizeText(value))));
}

function getOverlapScore(leftTokens, rightTokens, pointsPerToken) {
  if (!leftTokens.length || !rightTokens.length) return 0;

  const rightSet = new Set(rightTokens);
  return leftTokens.reduce(
    (score, token) => (rightSet.has(token) ? score + pointsPerToken : score),
    0,
  );
}

function getAreaLabel(hike) {
  return hike?.location?.trim() || hike?.country?.trim() || "";
}

function hasCoordinates(hike) {
  return Number.isFinite(Number(hike?.latitude)) && Number.isFinite(Number(hike?.longitude));
}

function getDistanceInKm(left, right) {
  if (!hasCoordinates(left) || !hasCoordinates(right)) return Number.POSITIVE_INFINITY;

  const leftLat = Number(left.latitude) * (Math.PI / 180);
  const rightLat = Number(right.latitude) * (Math.PI / 180);
  const latDiff = rightLat - leftLat;
  const lngDiff = (Number(right.longitude) - Number(left.longitude)) * (Math.PI / 180);
  const haversine =
    Math.sin(latDiff / 2) ** 2 +
    Math.cos(leftLat) * Math.cos(rightLat) * Math.sin(lngDiff / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function normalizeCompareText(value) {
  return String(value ?? "").trim().toLowerCase();
}

export default function SmartRecommendations({ allHikes = [], currentHike = null }) {
  const { user } = useAuth();

  const { data: myEntries = [] } = useQuery({
    queryKey: ["myJournalEntries", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("distance_km, elevation_m, difficulty")
        .eq("user_id", user.id)
        .limit(50);

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  const recommendations = useMemo(() => {
    if (!allHikes.length) return [];

    const avgDistance = myEntries.length
      ? myEntries.reduce((sum, entry) => sum + (entry.distance_km || 0), 0) / myEntries.length
      : null;

    const diffCounts = {};
    myEntries.forEach((entry) => {
      if (entry.difficulty) {
        diffCounts[entry.difficulty] = (diffCounts[entry.difficulty] || 0) + 1;
      }
    });

    const preferredDiff = Object.entries(diffCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const currentLocationTokens = getUniqueTokens(currentHike?.location, currentHike?.country);
    const currentTagTokens = getUniqueTokens(currentHike?.tags);
    const currentSeasonValues = normalizeSelectedSeasonValues(currentHike?.seasons, currentHike?.season);
    const currentTrailName = normalizeCompareText(currentHike?.trail_name);
    const currentLocationName = normalizeCompareText(currentHike?.location);

    const scoredRecommendations = allHikes
      .filter((hike) => {
        if (hike?.id === currentHike?.id) return false;

        const sameTrailName = normalizeCompareText(hike?.trail_name) === currentTrailName;
        const sameLocationName = normalizeCompareText(hike?.location) === currentLocationName;

        if (sameTrailName && sameLocationName) return false;

        return true;
      })
      .map((hike) => {
        const hikeLocationTokens = getUniqueTokens(hike.location, hike.country);
        const hikeTagTokens = getUniqueTokens(hike.tags);
        const hikeSeasonValues = normalizeSelectedSeasonValues(hike.seasons, hike.season);
        const distanceInKm = getDistanceInKm(currentHike, hike);
        const hasExactLocationMatch =
          currentHike?.location &&
          hike.location &&
          String(currentHike.location).trim().toLowerCase() === String(hike.location).trim().toLowerCase();
        const hasExactCountryMatch =
          currentHike?.country &&
          hike.country &&
          String(currentHike.country).trim().toLowerCase() === String(hike.country).trim().toLowerCase();

        let areaScore = 0;

        if (hasExactLocationMatch) areaScore += 16;
        else if (hasExactCountryMatch) areaScore += 4;

        areaScore += getOverlapScore(currentLocationTokens, hikeLocationTokens, 3);
        areaScore += getOverlapScore(currentTagTokens, hikeTagTokens, 2);
        areaScore += getOverlapScore(currentSeasonValues, hikeSeasonValues, 1);

        let score = areaScore;

        if (Number.isFinite(distanceInKm)) {
          if (distanceInKm <= 10) score += 12;
          else if (distanceInKm <= 25) score += 9;
          else if (distanceInKm <= 50) score += 6;
          else if (distanceInKm <= 100) score += 3;
        }

        if (preferredDiff && String(hike.difficulty) === String(preferredDiff)) {
          score += 3;
        }

        if (avgDistance !== null) {
          const distDiff = Math.abs((hike.distance_km || 0) - avgDistance);
          if (distDiff < 2) score += 3;
          else if (distDiff < 5) score += 1;
        }

        if (hike.photos?.length > 0) {
          score += 1;
        }

        return {
          ...hike,
          _distanceInKm: distanceInKm,
          _hasExactLocationMatch: hasExactLocationMatch,
          _areaScore: areaScore,
          _score: score,
        };
      })
      .sort((a, b) => {
        if (a._hasExactLocationMatch !== b._hasExactLocationMatch) {
          return a._hasExactLocationMatch ? -1 : 1;
        }
        if (a._distanceInKm !== b._distanceInKm) {
          return a._distanceInKm - b._distanceInKm;
        }
        if (b._areaScore !== a._areaScore) return b._areaScore - a._areaScore;
        return b._score - a._score;
      });

    const nearbyRecommendations = scoredRecommendations.filter(
      (hike) => Number.isFinite(hike._distanceInKm) && hike._distanceInKm <= 30
    );

    return nearbyRecommendations.slice(0, 3);
  }, [allHikes, currentHike, myEntries]);

  if (!recommendations.length) return null;

  const isPersonalized = !!user && myEntries.length > 0;
  const areaLabel = getAreaLabel(currentHike);
  const hasAreaMatches = recommendations.some((hike) => hike._areaScore > 0);

  return (
    <section className="mb-12 space-y-5 rounded-[28px] border border-brand-100/70 bg-white/72 px-4 py-5 shadow-[0_12px_28px_rgba(168,0,60,0.06)] backdrop-blur-sm sm:px-6 sm:py-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="doghike-section-title">Weitere spannende Wanderungen in dieser Region</h2>
          {isPersonalized && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-100/80 px-2 py-1 text-xs text-slate-500">
              <Sparkles className="h-3 w-3" /> passend zu deinen Wanderungen
            </span>
          )}
        </div>
        <p className="text-sm leading-relaxed text-[#C07820]">
          {hasAreaMatches && areaLabel
            ? `Diese Vorschläge liegen im Umkreis von 30 km rund um ${areaLabel}.`
            : "Hier findest du weitere spannende Wanderungen im Umkreis von 30 km."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {recommendations.map((hike, index) => (
          <HikeCard key={`${hike._source ?? "sheets"}-${hike.id}`} hike={hike} index={index} />
        ))}
      </div>
    </section>
  );
}
