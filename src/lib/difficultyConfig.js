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
