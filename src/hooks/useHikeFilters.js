import { useMemo, useState } from "react";
import { matchesHikeSearch } from "@/lib/hikeSearch";

const INITIAL_FILTERS = {
  searchQuery: "",
  sortBy: "none",
  levelFilter: "all",
  humanDifficultyFilter: "all",
  dogDifficultyFilter: "all",
  distanceMin: "",
  distanceMax: "",
  elevationMin: "",
  elevationMax: "",
  seasonFilter: "all",
  waterFilter: "all",
};

function getSeasonValues(hike) {
  if (Array.isArray(hike.seasons) && hike.seasons.length > 0) {
    return hike.seasons;
  }

  return hike.season ? [hike.season] : [];
}

export function useHikeFilters(hikes = []) {
  const [draftFilters, setDraftFilters] = useState(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_FILTERS);

  const setSearchQuery = (value) => setDraftFilters((prev) => ({ ...prev, searchQuery: value }));
  const setSortBy = (value) => setDraftFilters((prev) => ({ ...prev, sortBy: value }));
  const setLevelFilter = (value) => setDraftFilters((prev) => ({ ...prev, levelFilter: value }));
  const setHumanDifficultyFilter = (value) => setDraftFilters((prev) => ({ ...prev, humanDifficultyFilter: value }));
  const setDogDifficultyFilter = (value) => setDraftFilters((prev) => ({ ...prev, dogDifficultyFilter: value }));
  const setDistanceMin = (value) => setDraftFilters((prev) => ({ ...prev, distanceMin: value }));
  const setDistanceMax = (value) => setDraftFilters((prev) => ({ ...prev, distanceMax: value }));
  const setElevationMin = (value) => setDraftFilters((prev) => ({ ...prev, elevationMin: value }));
  const setElevationMax = (value) => setDraftFilters((prev) => ({ ...prev, elevationMax: value }));
  const setSeasonFilter = (value) => setDraftFilters((prev) => ({ ...prev, seasonFilter: value }));
  const setWaterFilter = (value) => setDraftFilters((prev) => ({ ...prev, waterFilter: value }));

  const applyFilters = () => {
    setAppliedFilters(draftFilters);
  };

  const resetFilters = () => {
    setDraftFilters(INITIAL_FILTERS);
    setAppliedFilters(INITIAL_FILTERS);
  };

  const hasPendingChanges = JSON.stringify(draftFilters) !== JSON.stringify(appliedFilters);

  const filteredHikes = useMemo(() => {
    return hikes
      .filter((hike) => {
        const matchesSearch = matchesHikeSearch(hike, appliedFilters.searchQuery);
        if (!matchesSearch) return false;

        if (appliedFilters.humanDifficultyFilter !== "all" && hike.difficulty !== appliedFilters.humanDifficultyFilter) return false;
        if (appliedFilters.dogDifficultyFilter !== "all" && hike.dog_difficulty !== appliedFilters.dogDifficultyFilter) return false;
        if (appliedFilters.distanceMin && (hike.distance_km || 0) < parseFloat(appliedFilters.distanceMin)) return false;
        if (appliedFilters.distanceMax && (hike.distance_km || 0) > parseFloat(appliedFilters.distanceMax)) return false;
        if (appliedFilters.elevationMin && (hike.elevation_gain_m || 0) < parseFloat(appliedFilters.elevationMin)) return false;
        if (appliedFilters.elevationMax && (hike.elevation_gain_m || 0) > parseFloat(appliedFilters.elevationMax)) return false;
        if (appliedFilters.seasonFilter !== "all") {
          const seasons = getSeasonValues(hike);
          if (!seasons.includes(appliedFilters.seasonFilter) && !seasons.includes("all_year")) return false;
        }
        if (appliedFilters.waterFilter !== "all" && hike.water_availability !== appliedFilters.waterFilter) return false;

        if (appliedFilters.levelFilter === "all") return true;
        if (appliedFilters.sortBy === "difficulty") return hike.difficulty === appliedFilters.levelFilter;
        if (appliedFilters.sortBy === "dog_difficulty") return hike.dog_difficulty === appliedFilters.levelFilter;
        return true;
      })
      .sort((a, b) => {
        if (appliedFilters.sortBy === "difficulty") return (a.difficulty || "9").localeCompare(b.difficulty || "9");
        if (appliedFilters.sortBy === "dog_difficulty") return (a.dog_difficulty || "9").localeCompare(b.dog_difficulty || "9");
        if (appliedFilters.sortBy === "distance") return (b.distance_km || 0) - (a.distance_km || 0);
        if (appliedFilters.sortBy === "elevation") return (b.elevation_gain_m || 0) - (a.elevation_gain_m || 0);
        const bTime = b.date ? new Date(b.date).getTime() : 0;
        const aTime = a.date ? new Date(a.date).getTime() : 0;
        return bTime - aTime || (a.trail_name || "").localeCompare(b.trail_name || "");
      });
  }, [hikes, appliedFilters]);

  return {
    searchQuery: draftFilters.searchQuery,
    setSearchQuery,
    activeSearchQuery: appliedFilters.searchQuery,
    sortBy: draftFilters.sortBy,
    setSortBy,
    activeSortBy: appliedFilters.sortBy,
    levelFilter: draftFilters.levelFilter,
    setLevelFilter,
    activeLevelFilter: appliedFilters.levelFilter,
    humanDifficultyFilter: draftFilters.humanDifficultyFilter,
    setHumanDifficultyFilter,
    dogDifficultyFilter: draftFilters.dogDifficultyFilter,
    setDogDifficultyFilter,
    distanceMin: draftFilters.distanceMin,
    setDistanceMin,
    distanceMax: draftFilters.distanceMax,
    setDistanceMax,
    elevationMin: draftFilters.elevationMin,
    setElevationMin,
    elevationMax: draftFilters.elevationMax,
    setElevationMax,
    seasonFilter: draftFilters.seasonFilter,
    setSeasonFilter,
    waterFilter: draftFilters.waterFilter,
    setWaterFilter,
    hasPendingChanges,
    applyFilters,
    resetFilters,
    filteredHikes,
  };
}
