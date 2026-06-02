const COUNTRY_ALIASES = [
  {
    label: "Italien",
    aliases: ["italien", "italy", "südtirol", "suedtirol", "dolomiten", "trentino", "alto adige"],
  },
  {
    label: "Österreich",
    aliases: ["österreich", "oesterreich", "austria", "tirol", "osttirol", "salzburg"],
  },
  { label: "Deutschland", aliases: ["deutschland", "germany", "bayern", "bavaria"] },
  { label: "Schweiz", aliases: ["schweiz", "switzerland", "suisse", "svizzera"] },
  { label: "Frankreich", aliases: ["frankreich", "france"] },
  { label: "Spanien", aliases: ["spanien", "spain", "espana", "españa"] },
  { label: "Kroatien", aliases: ["kroatien", "croatia", "hrvatska"] },
  { label: "Slowenien", aliases: ["slowenien", "slovenia", "slovenija"] },
  { label: "Anderes", aliases: ["other", "anderes"] },
];

function normalizeCountryText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function matchCountryLabel(value) {
  const normalized = normalizeCountryText(value);
  if (!normalized) return null;

  const matchedCountry = COUNTRY_ALIASES.find(({ aliases }) =>
    aliases.some((alias) => normalized.includes(normalizeCountryText(alias))),
  );

  return matchedCountry?.label || null;
}

export function getCountryLabel(value) {
  const explicitCountry = typeof value === "string" ? value.trim() : "";
  return matchCountryLabel(explicitCountry) || explicitCountry || null;
}

export function getJournalCountryLabel(entry) {
  const explicitCountry = typeof entry?.country === "string" ? entry.country.trim() : "";
  const matchedCountry = matchCountryLabel(explicitCountry || entry?.location || "");
  return matchedCountry || explicitCountry || null;
}
