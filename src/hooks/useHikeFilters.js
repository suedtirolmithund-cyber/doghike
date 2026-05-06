import { useMemo, useState } from "react";
import { matchesHikeSearch } from "@/lib/hikeSearch";

function getSeasonValues(hike) {
  if (Array.isArray(hike.seasons) && hike.seasons.length > 0) {
    return hike.seasons;
  }

  return hike.season ? [hike.season] : [];
}

export function useHikeFilters(hikes = []) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("none");
  const [levelFilter, setLevelFilter] = useState("all");
  const [humanDifficultyFilter, setHumanDifficultyFilter] = useState("all");
  const [dogDifficultyFilter, setDogDifficultyFilter] = useState("all");
  const [distanceMin, setDistanceMin] = useState("");
  const [distanceMax, setDistanceMax] = useState("");
  const [elevationMin, setElevationMin] = useState("");
  const [elevationMax, setElevationMax] = useState("");
  const [seasonFilter, setSeasonFilter] = useState("all");
  const [waterFilter, setWaterFilter] = useState("all");

  const filteredHikes = useMemo(() => {
    return hikes
      .filter((hike) => {
        const matchesSearch = matchesHikeSearch(hike, searchQuery);
        if (!matchesSearch) return false;

        if (humanDifficultyFilter !== "all" && hike.difficulty !== humanDifficultyFilter) return false;
        if (dogDifficultyFilter !== "all" && hike.dog_difficulty !== dogDifficultyFilter) return false;
        if (distanceMin && (hike.distance_km || 0) < parseFloat(distanceMin)) return false;
        if (distanceMax && (hike.distance_km || 0) > parseFloat(distanceMax)) return false;
        if (elevationMin && (hike.elevation_gain_m || 0) < parseFloat(elevationMin)) return false;
        if (elevationMax && (hike.elevation_gain_m || 0) > parseFloat(elevationMax)) return false;
        if (seasonFilter !== "all") {
          const seasons = getSeasonValues(hike);
          if (!seasons.includes(seasonFilter) && !seasons.includes("all_year")) return false;
        }
        if (waterFilter !== "all" && hike.water_availability !== waterFilter) return false;

        if (levelFilter === "all") return true;
        if (sortBy === "difficulty") return hike.difficulty === levelFilter;
        if (sortBy === "dog_difficulty") return hike.dog_difficulty === levelFilter;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "difficulty") return (a.difficulty || "9").localeCompare(b.difficulty || "9");
        if (sortBy === "dog_difficulty") return (a.dog_difficulty || "9").localeCompare(b.dog_difficulty || "9");
        if (sortBy === "distance") return (b.distance_km || 0) - (a.distance_km || 0);
        if (sortBy === "elevation") return (b.elevation_gain_m || 0) - (a.elevation_gain_m || 0);
        const bTime = b.date ? new Date(b.date).getTime() : 0;
        const aTime = a.date ? new Date(a.date).getTime() : 0;
        return bTime - aTime || (a.trail_name || "").localeCompare(b.trail_name || "");
      });
  }, [
    hikes,
    searchQuery,
    sortBy,
    levelFilter,
    humanDifficultyFilter,
    dogDifficultyFilter,
    distanceMin,
    distanceMax,
    elevationMin,
    elevationMax,
    seasonFilter,
    waterFilter,
  ]);

  return {
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    levelFilter,
    setLevelFilter,
    humanDifficultyFilter,
    setHumanDifficultyFilter,
    dogDifficultyFilter,
    setDogDifficultyFilter,
    distanceMin,
    setDistanceMin,
    distanceMax,
    setDistanceMax,
    elevationMin,
    setElevationMin,
    elevationMax,
    setElevationMax,
    seasonFilter,
    setSeasonFilter,
    waterFilter,
    setWaterFilter,
    filteredHikes,
  };
}
