export const DIFFICULTY_LEVELS = [
  { value: "1", label: "Sehr leicht", short: "Stufe 1", textColor: "text-brand-400", badgeClass: "bg-brand-100 text-brand-600 border-brand-200" },
  { value: "2", label: "Leicht", short: "Stufe 2", textColor: "text-brand-600", badgeClass: "bg-brand-50 text-brand-700 border-brand-100" },
  { value: "3", label: "Mittel", short: "Stufe 3", textColor: "text-brand-300", badgeClass: "bg-brand-100 text-brand-600 border-brand-100" },
  { value: "4", label: "Anspruchsvoll", short: "Stufe 4", textColor: "text-brand-500", badgeClass: "bg-brand-100 text-brand-400 border-brand-100" },
  { value: "5", label: "Sehr anspruchsvoll", short: "Stufe 5", textColor: "text-brand-400", badgeClass: "bg-brand-100 text-brand-500 border-brand-100" },
];

export const DOG_PRIVATE_TAGS = [
  "💪 Fit",
  "🔥 Motiviert",
  "🌟 Super drauf",
  "😌 Ruhig",
  "🛋️ Brauchte Pausen",
  "🚀 Viel Energie",
  "🛋️ Gemütlich",
  "🎯 Trittsicher",
  "🤍 Vorsichtig",
  "🌿 Entspannt",
];

export const HUMAN_DIFFICULTY_GUIDE = [
  {
    level: "T1",
    stufe: "Stufe 1",
    color: "bg-brand-100 border-brand-200 text-brand-700",
    badge: "bg-brand-500",
    title: "Wandern",
    desc: "Breite, gut begehbare Wege mit geringen technischen Anforderungen. Kaum Trittsicherheit nötig.",
    examples: "Breite Spazier- und Wanderwege, einfache Talrunden",
    terrain: "Gut begehbar, wenig steil, kaum technische Stellen",
    fitness: "Auch ohne große Wandererfahrung gut machbar",
  },
  {
    level: "T2",
    stufe: "Stufe 2",
    color: "bg-brand-50 border-brand-100 text-brand-700",
    badge: "bg-brand-500",
    title: "Bergwandern",
    desc: "Schmalere, steilere oder steinige Wege. Trittsicherheit beim Menschen ist erforderlich.",
    examples: "Almwege, schmalere Bergpfade, einfachere Höhenwege",
    terrain: "Schmaler, teils steinig oder steiler, aber noch klar erkennbar",
    fitness: "Normale Kondition und sichere Schritte sind sinnvoll",
  },
  {
    level: "T3",
    stufe: "Stufe 3",
    color: "bg-brand-100 border-brand-200 text-brand-700",
    badge: "bg-brand-500",
    title: "Anspruchsvolles Bergwandern",
    desc: "Steilere, teils ausgesetzte oder unwegsame Abschnitte. Erfahrung und Trittsicherheit sind nötig.",
    examples: "Steilere Bergwege, Geröllpassagen, wurzelige oder schmale Pfade",
    terrain: "Unwegsam, teils ausgesetzt oder technisch deutlich fordernder",
    fitness: "Gute Kondition und Bergerfahrung helfen klar weiter",
  },
  {
    level: "T4",
    stufe: "Stufe 4",
    color: "bg-brand-100 border-brand-200 text-brand-500",
    badge: "bg-brand-500",
    title: "Alpinwandern",
    desc: "Schwieriges Gelände mit steilen Schrofen, Geröll sowie teils weglosen oder unmarkierten Passagen.",
    examples: "Alpine Übergänge, steile felsige Routen, weglosere Abschnitte",
    terrain: "Steil, rau, teils weglos oder schwer zu lesen",
    fitness: "Sehr gute Kondition, Orientierung und alpine Erfahrung",
  },
  {
    level: "T5",
    stufe: "Stufe 5",
    color: "bg-brand-100 border-brand-200 text-brand-700",
    badge: "bg-brand-500",
    title: "Schweres Alpinwandern",
    desc: "Sehr steiles, exponiertes Gelände mit möglichen kletterähnlichen Passagen. Alpine Erfahrung ist nötig.",
    examples: "Sehr ausgesetzte alpine Routen, felsige Schlüsselstellen",
    terrain: "Sehr exponiert, technisch anspruchsvoll, teils mit Handgebrauch",
    fitness: "Nur für sehr erfahrene und trittsichere Berggeher",
  },
];

export const DOG_DIFFICULTY_GUIDE = [
  {
    level: "H1",
    stufe: "Stufe 1",
    color: "bg-brand-100 border-brand-200 text-brand-700",
    badge: "bg-brand-500",
    title: "Sehr leicht",
    desc: "Kurze bis einfache Touren mit wenig Steigung. Für fast alle gesunden Hunde geeignet, auch für junge, ältere oder wenig trainierte Hunde.",
    examples: "Kurze Waldwege, einfache Spazier- und Talrunden",
    terrain: "Gut laufbar, wenig steil, kaum belastende Hindernisse",
    note: "Auch für wenig trainierte Hunde meist gut machbar",
  },
  {
    level: "H2",
    stufe: "Stufe 2",
    color: "bg-brand-50 border-brand-100 text-brand-700",
    badge: "bg-brand-500",
    title: "Leicht",
    desc: "Gut machbare Wanderung mit moderater Länge oder Steigung. Der Hund braucht normale Grundfitness und sollte an verschiedene Untergründe gewöhnt sein.",
    examples: "Mittlere Almwege, längere Waldwege, sanftere Berganstiege",
    terrain: "Abwechslungsreiche Untergründe, moderat steil oder länger",
    note: "Normale Grundfitness und etwas Trittsicherheit reichen meist aus",
  },
  {
    level: "H3",
    stufe: "Stufe 3",
    color: "bg-brand-100 border-brand-200 text-brand-700",
    badge: "bg-brand-500",
    title: "Mittel",
    desc: "Längere oder steilere Tour mit schmalen, steinigen oder wurzeligen Wegen. Der Hund sollte fit, trittsicher und berggewöhnt sein.",
    examples: "Längere Bergtouren, steilere Anstiege, wurzelige oder steinige Pfade",
    terrain: "Schmal, uneben, teils steinig oder wurzelig",
    note: "Der Hund sollte längere Belastung und schwierigen Untergrund kennen",
  },
  {
    level: "H4",
    stufe: "Stufe 4",
    color: "bg-brand-100 border-brand-200 text-brand-500",
    badge: "bg-brand-500",
    title: "Anspruchsvoll",
    desc: "Deutlich fordernde Tour mit größerer Höhendifferenz, längerer Gehzeit oder schwierigen Stellen. Nur für ausgewachsene, fitte und bergerfahrene Hunde.",
    examples: "Lange Bergtage, steile Touren mit engeren oder schwierigeren Passagen",
    terrain: "Belastend, länger, steiler oder technisch heikler für Hunde",
    note: "Nur für fitte, ausgewachsene und berggewohnte Hunde sinnvoll",
  },
  {
    level: "H5",
    stufe: "Stufe 5",
    color: "bg-brand-100 border-brand-200 text-brand-700",
    badge: "bg-brand-500",
    title: "Sehr anspruchsvoll",
    desc: "Sehr fordernde Hundetour mit steilen, felsigen, schmalen oder ausgesetzten Passagen. Der Hund braucht sehr gute Kondition, Berggewöhnung und sichere Führung; einzelne Stellen können Hilfe oder Sicherung erfordern.",
    examples: "Sehr steile Bergtouren, felsige Passagen, ausgesetzte Engstellen",
    terrain: "Felsig, schmal, steil oder klar ausgesetzt",
    note: "Einzelne Stellen können Hilfe, Tragen oder zusätzliche Sicherung nötig machen",
  },
];

export const DIFFICULTY_APP_EXPLANATIONS = [
  {
    key: "human",
    title: "Mensch-Schwierigkeit",
    description: "Beschreibt, wie technisch anspruchsvoll die Wanderung für Menschen ist: Wegbreite, Steilheit, Trittsicherheit, Ausgesetztheit und alpine Erfahrung.",
  },
  {
    key: "dog",
    title: "Hund-Schwierigkeit",
    description: "Beschreibt, wie anspruchsvoll die Tour für den Hund ist: Fitness, Länge, Höhenmeter, Berggewöhnung, Trittsicherheit auf Untergrund und mögliche schwierige Stellen.",
  },
];

export const DIFFICULTY_GUIDE_NOTE =
  "Die Mensch- und Hund-Schwierigkeit können voneinander abweichen. Eine Tour kann für Menschen nur T2 sein, für Hunde aber H4, wenn sie lang ist, viele Höhenmeter hat oder für Hunde schwierige Passagen enthält.";

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
  return DIFFICULTY_BADGE_CLASSES[level] ?? "bg-brand-50 text-slate-600 border-brand-100";
}

export const WATER_LEVELS = [
  { value: "none", numeric: 0, label: "Kein Wasser", icon: "💧", textColor: "text-brand-500", badgeClass: "bg-brand-50 text-brand-500 border-brand-100" },
  { value: "little", numeric: 1, label: "Wenig Wasser", icon: "💧", textColor: "text-brand-400", badgeClass: "bg-brand-50 text-brand-400 border-brand-100" },
  { value: "moderate", numeric: 2, label: "Etwas Wasser", icon: "💧💧", textColor: "text-brand-700", badgeClass: "bg-brand-50 text-brand-700 border-brand-200" },
  { value: "plenty", numeric: 3, label: "Viel Wasser", icon: "💧💧💧", textColor: "text-brand-300", badgeClass: "bg-brand-50 text-brand-300 border-brand-100" },
];

export const WATER_GUIDE = [
  {
    value: "none",
    label: "Kein Wasser",
    color: "bg-brand-50 border-brand-100 text-brand-700",
    desc: "Auf der Tour gibt es normalerweise keine verlässlichen natürlichen Wasserstellen für den Hund. Wasser muss vollständig selbst mitgenommen werden.",
    examples: "Höhenweg, Waldweg oder Almweg ohne Bach, Quelle, Brunnen oder Seezugang",
    tip: "Plane die komplette Wasserversorgung selbst ein und nimm für den Hund immer genug Reserve mit.",
  },
  {
    value: "little",
    label: "Wenig Wasser",
    color: "bg-brand-50 border-brand-100 text-brand-500",
    desc: "Es gibt einzelne mögliche Wasserstellen, diese können aber selten, schlecht erreichbar oder saisonabhängig sein. Nicht als alleinige Wasserversorgung einplanen.",
    examples: "Ein kleiner Bach am Anfang der Tour oder eine Quelle, die im Sommer austrocknen kann",
    tip: "Eigenes Wasser bleibt Pflicht. Einzelne Wasserstellen sind nur ein Bonus und keine sichere Versorgung.",
  },
  {
    value: "moderate",
    label: "Mehrere Wasserstellen",
    color: "bg-brand-50 border-brand-200 text-brand-800",
    desc: "Auf der Tour gibt es mehrere Wasserstellen oder längere Abschnitte mit Bachnähe. Trotzdem kann Wasser saisonal fehlen oder nicht zugänglich sein.",
    examples: "Wanderung entlang eines Bachs mit mehreren Zugangsmöglichkeiten oder Tour mit mehreren Brunnen oder Quellen",
    tip: "Gut für viele Hunde, aber je nach Saison oder Gelände nicht überall direkt erreichbar.",
  },
  {
    value: "plenty",
    label: "Viel Wasser",
    color: "bg-brand-50 border-brand-100 text-brand-500",
    desc: "Die Tour bietet sehr regelmäßigen oder fast durchgehenden Wasserzugang. Besonders hundefreundlich, aber eigenes Wasser bleibt trotzdem Pflicht.",
    examples: "Rundweg um einen See mit wiederholtem direktem Zugang zum Wasser",
    tip: "Sehr hundefreundlich, trotzdem immer eigenes Trinkwasser und eine Schüssel dabeihaben.",
  },
];

export const WATER_APP_EXPLANATION =
  "Die Wassertropfen zeigen die typische Wasserverfügbarkeit entlang der Route. So schätzt du besser ein, wie viel Wasser du für dich und deinen Hund mitnehmen solltest.";

export const WATER_GUIDE_NOTE =
  "Die Wassertropfen zeigen nur die typische Wasserverfügbarkeit entlang der Route. Wasserstellen können je nach Saison, Wetter, Trockenheit, Schneelage oder Bewirtschaftung fehlen. Außerdem kann natürliches Wasser sehr kalt sein, besonders in Bächen, Bergseen oder nach der Schneeschmelze. Manche Hunde reagieren empfindlich darauf. Deshalb sollte für den Hund immer eigenes Wasser mitgenommen werden, auch bei 2 oder 3 Tropfen.";

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
  { value: "spring", label: "Frühling", icon: "🌸", color: "bg-brand-100 text-brand-500" },
  { value: "summer", label: "Sommer", icon: "☀️", color: "bg-brand-100 text-brand-500" },
  { value: "autumn", label: "Herbst", icon: "🍂", color: "bg-brand-100 text-brand-400" },
  { value: "winter", label: "Winter", icon: "❄️", color: "bg-brand-50 text-slate-700" },
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
  return SEASON_BY_VALUE[value]?.color ?? "bg-brand-50 text-slate-600";
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
  return getWaterLevel(value)?.icon ?? "??";
}

export function getWaterBadgeClass(value) {
  return getWaterLevel(value)?.badgeClass ?? "bg-brand-50 text-slate-600 border-brand-100";
}

export function getWaterTextColor(value) {
  return getWaterLevel(value)?.textColor ?? "text-slate-600";
}
