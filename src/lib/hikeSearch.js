export function matchesHikeSearch(hike, rawQuery) {
  const query = String(rawQuery ?? "").trim().toLowerCase();
  if (!query) return true;

  const searchableValues = [
    hike?.trail_name,
    hike?.title,
    hike?.location,
    hike?.country,
  ]
    .filter((value) => typeof value === "string" && value.trim())
    .map((value) => value.toLowerCase());

  if (searchableValues.some((value) => value.includes(query))) {
    return true;
  }

  return Array.isArray(hike?.tags)
    && hike.tags.some((tag) => String(tag).toLowerCase().includes(query));
}

export function normalizeSearchQuery(rawQuery) {
  return String(rawQuery ?? "")
    .trim()
    .replace(/^@+/, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function matchesTextSearch(values, rawQuery) {
  const query = normalizeSearchQuery(rawQuery);
  if (!query) return true;

  return values
    .filter((value) => value !== null && value !== undefined)
    .map((value) => String(value).trim().replace(/^@+/, "").toLowerCase())
    .some((value) => value.includes(query));
}
