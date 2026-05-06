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
