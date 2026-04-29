export const DIFFICULTY_LEVELS = [
  { value: "1", label: "Sehr leicht", short: "Stufe 1", textColor: "text-brand-400", badgeClass: "bg-brand-100 text-brand-600 border-brand-200" },
  { value: "2", label: "Leicht", short: "Stufe 2", textColor: "text-lime-600", badgeClass: "bg-lime-100 text-lime-700 border-lime-200" },
  { value: "3", label: "Mittel", short: "Stufe 3", textColor: "text-yellow-600", badgeClass: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "4", label: "Schwer", short: "Stufe 4", textColor: "text-orange-600", badgeClass: "bg-orange-100 text-orange-700 border-orange-200" },
  { value: "5", label: "Sehr schwer", short: "Stufe 5", textColor: "text-red-600", badgeClass: "bg-red-100 text-red-700 border-red-200" },
];

export const DIFFICULTY_LABELS = Object.fromEntries(
  DIFFICULTY_LEVELS.flatMap((level) => [
    [level.value, level.label],
    [Number(level.value), level.label],
  ])
);

export const DIFFICULTY_TEXT_COLORS = Object.fromEntries(
  DIFFICULTY_LEVELS.flatMap((level) => [
    [level.value, level.textColor],
    [Number(level.value), level.textColor],
  ])
);

export const DIFFICULTY_BADGE_CLASSES = Object.fromEntries(
  DIFFICULTY_LEVELS.flatMap((level) => [
    [level.value, level.badgeClass],
    [Number(level.value), level.badgeClass],
  ])
);

export function getDifficultyLabel(level) {
  return DIFFICULTY_LABELS[level] ?? null;
}

export function getDifficultyTextColor(level) {
  return DIFFICULTY_TEXT_COLORS[level] ?? "text-stone-500";
}

export function getDifficultyBadgeClass(level) {
  return DIFFICULTY_BADGE_CLASSES[level] ?? "bg-stone-100 text-stone-600 border-stone-200";
}

export const WATER_LEVELS = [
  { value: "none", numeric: 0, label: "Kein Wasser", icon: "💧̸", textColor: "text-red-700", badgeClass: "bg-red-50 text-red-700 border-red-200" },
  { value: "little", numeric: 1, label: "Wenig Wasser", icon: "💧", textColor: "text-orange-700", badgeClass: "bg-orange-50 text-orange-700 border-orange-200" },
  { value: "moderate", numeric: 2, label: "Etwas Wasser", icon: "💧💧", textColor: "text-blue-700", badgeClass: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "plenty", numeric: 3, label: "Viel Wasser", icon: "💧💧💧", textColor: "text-cyan-700", badgeClass: "bg-cyan-50 text-cyan-700 border-cyan-200" },
];

export const TOUR_ICONS = {
  distance: "📏",
  elevation: "⛰️",
  duration: "⏱️",
  location: "📍",
  map: "🗺️",
  country: "🌍",
  date: "📅",
  human: "👤",
  dog: "🐕",
  season: "🌤️",
  speed: "🏃",
};

export const SEASON_LEVELS = [
  { value: "spring", label: "Frühling", icon: "🌸", color: "bg-pink-100 text-pink-700" },
  { value: "summer", label: "Sommer", icon: "☀️", color: "bg-red-100 text-red-700" },
  { value: "autumn", label: "Herbst", icon: "🍂", color: "bg-orange-100 text-orange-700" },
  { value: "winter", label: "Winter", icon: "❄️", color: "bg-blue-100 text-blue-700" },
  { value: "all_year", label: "Ganzjährig", icon: "🍃", color: "bg-brand-100 text-brand-600" },
];

export const SEASON_BY_VALUE = Object.fromEntries(
  SEASON_LEVELS.map((season) => [season.value, season])
);

export function getSeasonLabel(value) {
  return SEASON_BY_VALUE[value]?.label ?? null;
}

export function getSeasonIcon(value) {
  return SEASON_BY_VALUE[value]?.icon ?? "🌤️";
}

export function getSeasonBadgeClass(value) {
  return SEASON_BY_VALUE[value]?.color ?? "bg-stone-100 text-stone-600";
}

export const WATER_BY_VALUE = Object.fromEntries(
  WATER_LEVELS.flatMap((level) => [
    [level.value, level],
    [level.numeric, level],
  ])
);

export function getWaterLevel(value) {
  return WATER_BY_VALUE[value] ?? null;
}

export function getWaterLabel(value) {
  return getWaterLevel(value)?.label ?? null;
}

export function getWaterIcon(value) {
  return getWaterLevel(value)?.icon ?? "💧";
}

export function getWaterBadgeClass(value) {
  return getWaterLevel(value)?.badgeClass ?? "bg-stone-100 text-stone-600 border-stone-200";
}

export function getWaterTextColor(value) {
  return getWaterLevel(value)?.textColor ?? "text-stone-600";
}
