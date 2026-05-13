const EASY_TERMS = ["leicht", "einfach", "gemuetlich", "gemutlich", "easy"];
const DOG_TERMS = ["hund", "hunde", "mit hund", "hundefreundlich", "dog"];
const WATER_TERMS = ["bach", "wasser", "see", "fluss", "quelle", "teich"];
const SHORT_TERMS = ["nicht zu weit", "nicht so weit", "kurz", "kurze", "wenig km", "nah"];
const LOW_ELEVATION_TERMS = ["wenig hoehenmeter", "wenig höhenmeter", "flach"];
const SEASON_TERMS = {
  fruehling: ["fruehling", "frühling", "spring"],
  sommer: ["sommer", "summer"],
  herbst: ["herbst", "autumn", "fall"],
  winter: ["winter"],
  all_year: ["ganzjaehrig", "ganzjährig", "ganzes jahr", "all year"],
};

function toComparableText(value) {
  return String(value ?? "")
    .trim()
    .replace(/^@+/, "")
    .toLowerCase();
}

export function normalizeSearchQuery(rawQuery) {
  return toComparableText(rawQuery).replace(/\s+/g, " ");
}

function hasAnyTerm(query, terms) {
  return terms.some((term) => query.includes(term));
}

function removeTerms(query, terms) {
  let result = query;
  terms.forEach((term) => {
    result = result.replaceAll(term, " ");
  });
  return result;
}

function getSeasonValues(hike) {
  if (Array.isArray(hike?.seasons) && hike.seasons.length > 0) {
    return hike.seasons;
  }
  return hike?.season ? [hike.season] : [];
}

function getCountryAliases(country) {
  const normalized = toComparableText(country);
  switch (normalized) {
    case "italy":
    case "italien":
      return ["italy", "italien"];
    case "austria":
    case "oesterreich":
    case "österreich":
      return ["austria", "oesterreich", "österreich"];
    case "germany":
    case "deutschland":
      return ["germany", "deutschland"];
    case "switzerland":
    case "schweiz":
      return ["switzerland", "schweiz"];
    default:
      return normalized ? [normalized] : [];
  }
}

function getWaterLevelNumber(value) {
  if (typeof value === "number") return value;
  const normalized = toComparableText(value);
  if (normalized === "none") return 0;
  if (normalized === "little") return 1;
  if (normalized === "moderate") return 2;
  if (normalized === "plenty") return 3;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function getDifficultyNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildSearchableValues(hike) {
  const seasons = getSeasonValues(hike);
  return [
    hike?.trail_name,
    hike?.title,
    hike?.location,
    ...getCountryAliases(hike?.country),
    hike?.notes,
    hike?.description,
    hike?.hazard_notes,
    hike?.parking_info,
    hike?.restaurant_info,
    ...(Array.isArray(hike?.tags) ? hike.tags : []),
    ...seasons,
    hike?.water_availability,
  ]
    .filter((value) => value !== null && value !== undefined && String(value).trim())
    .map((value) => toComparableText(value));
}

function matchesRecognizedFilters(hike, query) {
  const wantsEasy = hasAnyTerm(query, EASY_TERMS);
  const wantsDogFriendly = hasAnyTerm(query, DOG_TERMS);
  const wantsWater = hasAnyTerm(query, WATER_TERMS);
  const wantsShort = hasAnyTerm(query, SHORT_TERMS);
  const wantsLowElevation = hasAnyTerm(query, LOW_ELEVATION_TERMS);

  const matchedSeason = Object.entries(SEASON_TERMS).find(([, terms]) => hasAnyTerm(query, terms))?.[0] ?? null;

  if (wantsEasy) {
    const humanDifficulty = getDifficultyNumber(hike?.difficulty);
    if (humanDifficulty !== null && humanDifficulty > 2) return false;
  }

  if (wantsDogFriendly && hike?.dog_suitable === false) {
    return false;
  }

  if (wantsWater) {
    const waterLevel = getWaterLevelNumber(hike?.water_availability);
    const textHasWater = buildSearchableValues(hike).some((value) =>
      WATER_TERMS.some((term) => value.includes(term))
    );
    if ((waterLevel ?? 0) < 2 && !textHasWater) return false;
  }

  if (wantsShort) {
    const distance = Number(hike?.distance_km ?? 0);
    if (Number.isFinite(distance) && distance > 8) return false;
  }

  if (wantsLowElevation) {
    const elevation = Number(hike?.elevation_gain_m ?? hike?.elevation_m ?? 0);
    if (Number.isFinite(elevation) && elevation > 350) return false;
  }

  if (matchedSeason) {
    const seasons = getSeasonValues(hike);
    if (!seasons.includes(matchedSeason) && !seasons.includes("all_year")) {
      return false;
    }
  }

  return true;
}

function matchesRemainingText(hike, query) {
  const recognizedTerms = [
    ...EASY_TERMS,
    ...DOG_TERMS,
    ...WATER_TERMS,
    ...SHORT_TERMS,
    ...LOW_ELEVATION_TERMS,
    ...Object.values(SEASON_TERMS).flat(),
    "+",
    ",",
  ];

  const cleanedQuery = normalizeSearchQuery(removeTerms(query, recognizedTerms)).replace(/[+,]/g, " ");
  const tokens = cleanedQuery.split(" ").map((token) => token.trim()).filter(Boolean);
  if (tokens.length === 0) return true;

  const searchableValues = buildSearchableValues(hike);
  return tokens.every((token) => searchableValues.some((value) => value.includes(token)));
}

export function matchesHikeSearch(hike, rawQuery) {
  const query = normalizeSearchQuery(rawQuery);
  if (!query) return true;

  const searchableValues = buildSearchableValues(hike);
  if (searchableValues.some((value) => value.includes(query))) {
    return true;
  }

  return matchesRecognizedFilters(hike, query) && matchesRemainingText(hike, query);
}

export function matchesTextSearch(values, rawQuery) {
  const query = normalizeSearchQuery(rawQuery);
  if (!query) return true;

  return values
    .filter((value) => value !== null && value !== undefined)
    .map((value) => toComparableText(value))
    .some((value) => value.includes(query));
}
