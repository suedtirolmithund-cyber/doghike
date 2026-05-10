export const DIFFICULTY_LEVELS = [
  { value: "1", label: "Sehr leicht", short: "Stufe 1", textColor: "text-brand-400", badgeClass: "bg-brand-100 text-brand-600 border-brand-200" },
  { value: "2", label: "Leicht", short: "Stufe 2", textColor: "text-lime-600", badgeClass: "bg-lime-100 text-lime-700 border-lime-200" },
  { value: "3", label: "Mittel", short: "Stufe 3", textColor: "text-yellow-600", badgeClass: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { value: "4", label: "Schwer", short: "Stufe 4", textColor: "text-red-500", badgeClass: "bg-red-100 text-red-600 border-red-200" },
  { value: "5", label: "Sehr schwer", short: "Stufe 5", textColor: "text-red-600", badgeClass: "bg-red-100 text-red-700 border-red-200" },
];

export const HUMAN_DIFFICULTY_GUIDE = [
  {
    level: "T1",
    stufe: "Stufe 1",
    color: "bg-brand-100 border-green-300 text-green-800",
    badge: "bg-brand-500",
    title: "Sehr leicht - Wanderweg",
    desc: "Gut markierter Weg ohne besondere Schwierigkeiten. Geeignet für fast alle, auch ohne Wandererfahrung.",
    examples: "Flache Waldwege, Almwiesen, Rundwege im Tal",
    terrain: "Befestigter Weg oder breiter Pfad, kein Absturzrisiko",
    fitness: "Keine besondere Kondition nötig",
  },
  {
    level: "T2",
    stufe: "Stufe 2",
    color: "bg-lime-100 border-lime-300 text-lime-800",
    badge: "bg-lime-500",
    title: "Leicht - Bergwanderweg",
    desc: "Schmalerer, teils steiler Pfad mit leichten Geländeunterschieden. Gute Trittsicherheit ist hilfreich.",
    examples: "Hügelige Wanderungen, einfache Almtouren",
    terrain: "Markierter Pfad, ab und zu steinig, geringe Absturzgefahr",
    fitness: "Leichte Ausdauer erforderlich",
  },
  {
    level: "T3",
    stufe: "Stufe 3",
    color: "bg-yellow-100 border-yellow-300 text-yellow-800",
    badge: "bg-yellow-500",
    title: "Mittel - Anspruchsvoller Bergweg",
    desc: "Steile, rutschige oder exponierte Abschnitte. Trittsicherheit und Schwindelfreiheit sind wichtig.",
    examples: "Steilere Bergwege, Geröllfelder, ausgesetzte Passagen",
    terrain: "Teils felsig, uneben oder ausgesetzt, Hände gelegentlich nötig",
    fitness: "Gute Kondition und etwas Bergerfahrung empfohlen",
  },
  {
    level: "T4",
    stufe: "Stufe 4",
    color: "bg-red-100 border-red-300 text-red-700",
    badge: "bg-red-500",
    title: "Schwer - Alpiner Weg",
    desc: "Weglos oder stark ausgesetzt. Gute Orientierung, Trittsicherheit und alpine Erfahrung sind notwendig.",
    examples: "Gipfeltouren, alpine Übergänge, sehr steile Wege",
    terrain: "Fels, Geröll, Schneefelder möglich",
    fitness: "Sehr gute Kondition und alpine Erfahrung",
  },
  {
    level: "T5",
    stufe: "Stufe 5",
    color: "bg-red-100 border-red-300 text-red-800",
    badge: "bg-red-500",
    title: "Sehr schwer - Schwieriger Alpinweg",
    desc: "Hochalpines Gelände mit stark exponierten Stellen. Nur für sehr erfahrene Bergsteiger geeignet.",
    examples: "Schwierige Klettersteige, hochalpine Routen",
    terrain: "Ausgesetzter Fels, Schnee, Gletscher, heikle Passagen",
    fitness: "Nur für sehr erfahrene Alpinisten",
  },
];

export const DOG_DIFFICULTY_GUIDE = [
  {
    stufe: "Stufe 1",
    color: "bg-brand-100 border-green-300 text-green-800",
    badge: "bg-brand-500",
    title: "Sehr leicht - Ideal für jeden Hund",
    desc: "Breite, befestigte Wege ohne nennenswerte Hindernisse. Kein Absturzrisiko.",
    examples: "Feldwege, Waldpfade, flache Rundwege",
    terrain: "Befestigter oder breiter Erdweg, keine Treppen oder Felsen",
    note: "Geeignet für Welpen, ältere Hunde und alle Rassen",
  },
  {
    stufe: "Stufe 2",
    color: "bg-lime-100 border-lime-300 text-lime-800",
    badge: "bg-lime-500",
    title: "Leicht - Für gesunde Hunde",
    desc: "Leicht hügeliges Gelände, schmale Pfade und keine gefährlichen Stellen.",
    examples: "Hügelige Waldwege, einfache Almwege",
    terrain: "Schmaler Pfad, wenig Geröll, geringe Steigung",
    note: "Für die meisten gesunden Hunde problemlos",
  },
  {
    stufe: "Stufe 3",
    color: "bg-yellow-100 border-yellow-300 text-yellow-800",
    badge: "bg-yellow-500",
    title: "Mittel - Trittsichere Hunde",
    desc: "Steile Abschnitte, Geröll und schmale Pfade mit leichter Absturzgefahr.",
    examples: "Steile Almwege, einfache Gipfeltouren",
    terrain: "Felsige Passagen, Geröll, teils steil",
    note: "Leine an ausgesetzten Stellen empfohlen. Hunde mit Gelenkproblemen besser meiden.",
  },
  {
    stufe: "Stufe 4",
    color: "bg-red-100 border-red-300 text-red-700",
    badge: "bg-red-500",
    title: "Schwer - Nur für fitte Hunde",
    desc: "Ausgesetzte Abschnitte, Leitern oder Treppen, enge Felsdurchgänge. Der Hund muss gegebenenfalls getragen werden.",
    examples: "Klettersteige, hochalpine Wege",
    terrain: "Fels, Seilversicherungen, Leitern",
    note: "Große oder schwere Hunde sind hier oft nicht geeignet",
  },
  {
    stufe: "Stufe 5",
    color: "bg-red-100 border-red-300 text-red-800",
    badge: "bg-red-500",
    title: "Sehr schwer - Hunde nicht empfohlen",
    desc: "Sehr steiles Felsgelände, Kletterpassagen und kaum überwindbare Hindernisse für Hunde.",
    examples: "Anspruchsvolle Klettersteige, hochalpines Terrain",
    terrain: "Senkrechte Felspassagen, Schnee, Gletscher",
    note: "Hunde sollten hier zu Hause bleiben",
  },
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
  return DIFFICULTY_TEXT_COLORS[level] ?? "text-slate-500";
}

export function getDifficultyBadgeClass(level) {
  return DIFFICULTY_BADGE_CLASSES[level] ?? "bg-sky-100 text-slate-600 border-sky-200";
}

export const WATER_LEVELS = [
  { value: "none", numeric: 0, label: "Kein Wasser", icon: "💧", textColor: "text-red-700", badgeClass: "bg-red-50 text-red-700 border-red-200" },
  { value: "little", numeric: 1, label: "Wenig Wasser", icon: "💧", textColor: "text-red-600", badgeClass: "bg-red-50 text-red-600 border-red-200" },
  { value: "moderate", numeric: 2, label: "Etwas Wasser", icon: "💧💧", textColor: "text-brand-700", badgeClass: "bg-brand-50 text-brand-700 border-brand-200" },
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
  season: "🍃",
  speed: "🏃",
  parking: "🅿️",
  restaurant: "🍽️",
  hazard: "⚠️",
};

export const SEASON_LEVELS = [
  { value: "spring", label: "Frühling", icon: "🌸", color: "bg-pink-100 text-pink-700" },
  { value: "summer", label: "Sommer", icon: "☀️", color: "bg-red-100 text-red-700" },
  { value: "autumn", label: "Herbst", icon: "🍂", color: "bg-red-100 text-red-600" },
  { value: "winter", label: "Winter", icon: "❄️", color: "bg-sky-100 text-slate-700" },
  { value: "all_year", label: "Ganzjährig", icon: "🍃", color: "bg-brand-100 text-brand-600" },
];

export const SEASON_BY_VALUE = Object.fromEntries(
  SEASON_LEVELS.map((season) => [season.value, season])
);

export function getSeasonLabel(value) {
  return SEASON_BY_VALUE[value]?.label ?? null;
}

export function getSeasonIcon(value) {
  return SEASON_BY_VALUE[value]?.icon ?? TOUR_ICONS.season;
}

export function getSeasonBadgeClass(value) {
  return SEASON_BY_VALUE[value]?.color ?? "bg-sky-100 text-slate-600";
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
  return getWaterLevel(value)?.badgeClass ?? "bg-sky-100 text-slate-600 border-sky-200";
}

export function getWaterTextColor(value) {
  return getWaterLevel(value)?.textColor ?? "text-slate-600";
}
