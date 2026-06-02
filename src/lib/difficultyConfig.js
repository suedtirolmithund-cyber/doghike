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

const DIFFICULTY_GUIDE_STYLE_BY_LEVEL = {
  1: {
    color: "bg-[#FFF8F0] border-[#F9C030]/45 text-[#7C3020]",
    badge: "bg-[#F9C030] text-[#7C3020]",
  },
  2: {
    color: "bg-[#FFF3D6] border-[#F9C030]/75 text-[#7C3020]",
    badge: "bg-[#F9C030] text-[#7C3020]",
  },
  3: {
    color: "bg-[#FFE9DC] border-[#F07030]/70 text-[#7C3020]",
    badge: "bg-[#F07030] text-white",
  },
  4: {
    color: "bg-[#FFF0F4] border-[#D4547A]/65 text-[#7C3020]",
    badge: "bg-[#D4547A] text-white",
  },
  5: {
    color: "bg-[#FCE5EE] border-[#A8003C]/60 text-[#7C3020]",
    badge: "bg-[#A8003C] text-white",
  },
};

const WATER_GUIDE_COLOR_BY_LEVEL = {
  none: DIFFICULTY_GUIDE_STYLE_BY_LEVEL[1].color,
  little: DIFFICULTY_GUIDE_STYLE_BY_LEVEL[2].color,
  moderate: DIFFICULTY_GUIDE_STYLE_BY_LEVEL[3].color,
  plenty: DIFFICULTY_GUIDE_STYLE_BY_LEVEL[4].color,
};

export const HUMAN_DIFFICULTY_GUIDE = [
  {
    level: "T1",
    stufe: "Stufe 1",
    ...DIFFICULTY_GUIDE_STYLE_BY_LEVEL[1],
    title: "Wandern",
    desc: "Breite, gut begehbare Wege mit geringen technischen Anforderungen. Kaum Trittsicherheit nötig.",
    examples: "Breite Spazier- und Wanderwege, einfache Talrunden",
    terrain: "Gut begehbar, wenig steil, kaum technische Stellen",
    fitness: "Auch ohne große Wandererfahrung gut machbar",
  },
  {
    level: "T2",
    stufe: "Stufe 2",
    ...DIFFICULTY_GUIDE_STYLE_BY_LEVEL[2],
    title: "Bergwandern",
    desc: "Schmalere, steilere oder steinige Wege. Trittsicherheit beim Menschen ist erforderlich.",
    examples: "Almwege, schmalere Bergpfade, einfachere Höhenwege",
    terrain: "Schmaler, teils steinig oder steiler, aber noch klar erkennbar",
    fitness: "Normale Kondition und sichere Schritte sind sinnvoll",
  },
  {
    level: "T3",
    stufe: "Stufe 3",
    ...DIFFICULTY_GUIDE_STYLE_BY_LEVEL[3],
    title: "Anspruchsvolles Bergwandern",
    desc: "Steilere, teils ausgesetzte oder unwegsame Abschnitte. Erfahrung und Trittsicherheit sind nötig.",
    examples: "Steilere Bergwege, Geröllpassagen, wurzelige oder schmale Pfade",
    terrain: "Unwegsam, teils ausgesetzt oder technisch deutlich fordernder",
    fitness: "Gute Kondition und Bergerfahrung helfen klar weiter",
  },
  {
    level: "T4",
    stufe: "Stufe 4",
    ...DIFFICULTY_GUIDE_STYLE_BY_LEVEL[4],
    title: "Alpinwandern",
    desc: "Schwieriges Gelände mit steilen Schrofen, Geröll sowie teils weglosen oder unmarkierten Passagen.",
    examples: "Alpine Übergänge, steile felsige Routen, weglosere Abschnitte",
    terrain: "Steil, rau, teils weglos oder schwer zu lesen",
    fitness: "Sehr gute Kondition, Orientierung und alpine Erfahrung",
  },
  {
    level: "T5",
    stufe: "Stufe 5",
    ...DIFFICULTY_GUIDE_STYLE_BY_LEVEL[5],
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
    ...DIFFICULTY_GUIDE_STYLE_BY_LEVEL[1],
    title: "Sehr leicht",
    desc: "Kurze bis einfache Wanderungen mit wenig Steigung. Für fast alle gesunden Hunde geeignet, auch für junge, ältere oder wenig trainierte Hunde.",
    examples: "Kurze Waldwege, einfache Spazier- und Talrunden",
    terrain: "Gut laufbar, wenig steil, kaum belastende Hindernisse",
    note: "Auch für wenig trainierte Hunde meist gut machbar",
  },
  {
    level: "H2",
    stufe: "Stufe 2",
    ...DIFFICULTY_GUIDE_STYLE_BY_LEVEL[2],
    title: "Leicht",
    desc: "Gut machbare Wanderung mit moderater Länge oder Steigung. Der Hund braucht normale Grundfitness und sollte an verschiedene Untergründe gewöhnt sein.",
    examples: "Mittlere Almwege, längere Waldwege, sanftere Berganstiege",
    terrain: "Abwechslungsreiche Untergründe, moderat steil oder länger",
    note: "Normale Grundfitness und etwas Trittsicherheit reichen meist aus",
  },
  {
    level: "H3",
    stufe: "Stufe 3",
    ...DIFFICULTY_GUIDE_STYLE_BY_LEVEL[3],
    title: "Mittel",
    desc: "Längere oder steilere Wanderung mit schmalen, steinigen oder wurzeligen Wegen. Der Hund sollte fit, trittsicher und berggewöhnt sein.",
    examples: "Längere Bergwanderungen, steilere Anstiege, wurzelige oder steinige Pfade",
    terrain: "Schmal, uneben, teils steinig oder wurzelig",
    note: "Der Hund sollte längere Belastung und schwierigen Untergrund kennen",
  },
  {
    level: "H4",
    stufe: "Stufe 4",
    ...DIFFICULTY_GUIDE_STYLE_BY_LEVEL[4],
    title: "Anspruchsvoll",
    desc: "Deutlich fordernde Wanderung mit größerer Höhendifferenz, längerer Gehzeit oder schwierigen Stellen. Nur für ausgewachsene, fitte und bergerfahrene Hunde.",
    examples: "Lange Bergtage, steile Wanderungen mit engeren oder schwierigeren Passagen",
    terrain: "Belastend, länger, steiler oder technisch heikler für Hunde",
    note: "Nur für fitte, ausgewachsene und berggewohnte Hunde sinnvoll",
  },
  {
    level: "H5",
    stufe: "Stufe 5",
    ...DIFFICULTY_GUIDE_STYLE_BY_LEVEL[5],
    title: "Sehr anspruchsvoll",
    desc: "Sehr fordernde Hundewanderung mit steilen, felsigen, schmalen oder ausgesetzten Passagen. Der Hund braucht sehr gute Kondition, Berggewöhnung und sichere Führung; einzelne Stellen können Hilfe oder Sicherung erfordern.",
    examples: "Sehr steile Bergwanderungen, felsige Passagen, ausgesetzte Engstellen",
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
    description: "Beschreibt, wie anspruchsvoll die Wanderung für den Hund ist: Fitness, Länge, Höhenmeter, Berggewöhnung, Trittsicherheit auf Untergrund und mögliche schwierige Stellen.",
  },
];

export const DIFFICULTY_GUIDE_NOTE =
  "Die Mensch- und Hund-Schwierigkeit können voneinander abweichen. Eine Wanderung kann für Menschen nur T2 sein, für Hunde aber H4, wenn sie lang ist, viele Höhenmeter hat oder für Hunde schwierige Passagen enthält.";

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

export function getDifficultyLevel(level) {
  const numericLevel = Number(level);
  if (!Number.isInteger(numericLevel) || numericLevel < 1 || numericLevel > 5) return null;
  return String(numericLevel);
}

export function getDifficultyScaleLabel(level) {
  const difficultyLevel = getDifficultyLevel(level);
  const difficultyLabel = getDifficultyLabel(level);
  if (!difficultyLevel || !difficultyLabel) return difficultyLabel;
  return `${difficultyLevel}/5 · ${difficultyLabel}`;
}

export function getDifficultyChipLabel(prefix, level) {
  const scaleLabel = getDifficultyScaleLabel(level);
  return scaleLabel ? `${prefix} ${scaleLabel}` : prefix;
}

export function getDifficultyTextColor(level) {
  return DIFFICULTY_TEXT_COLORS[level] ?? "text-slate-500";
}

export function getDifficultyBadgeClass(level) {
  return DIFFICULTY_BADGE_CLASSES[level] ?? "bg-brand-50 text-slate-600 border-brand-100";
}

export const WATER_LEVELS = [
  { value: "none", numeric: 0, label: "Kein Wasser", icon: "💧", textColor: "text-[#A8003C]", badgeClass: "bg-[#FFF3F7] text-[#A8003C] border-[#D4547A]/60" },
  { value: "little", numeric: 1, label: "Wenig Wasser", icon: "💧", textColor: "text-[#A8003C]", badgeClass: "bg-[#FFF3F7] text-[#A8003C] border-[#D4547A]/60" },
  { value: "moderate", numeric: 2, label: "Etwas Wasser", icon: "💧💧", textColor: "text-[#A8003C]", badgeClass: "bg-[#FFF3F7] text-[#A8003C] border-[#D4547A]/60" },
  { value: "plenty", numeric: 3, label: "Viel Wasser", icon: "💧💧💧", textColor: "text-[#A8003C]", badgeClass: "bg-[#FFF3F7] text-[#A8003C] border-[#D4547A]/60" },
];

export const WATER_GUIDE = [
  {
    value: "none",
    label: "Kein Wasser",
    color: WATER_GUIDE_COLOR_BY_LEVEL.none,
    desc: "Auf der Wanderung gibt es normalerweise keine verlässlichen natürlichen Wasserstellen für den Hund. Wasser muss vollständig selbst mitgenommen werden.",
    examples: "Höhenweg, Waldweg oder Almweg ohne Bach, Quelle, Brunnen oder Seezugang",
    tip: "Plane die komplette Wasserversorgung selbst ein und nimm für den Hund immer genug Reserve mit.",
  },
  {
    value: "little",
    label: "Wenig Wasser",
    color: WATER_GUIDE_COLOR_BY_LEVEL.little,
    desc: "Es gibt einzelne mögliche Wasserstellen, diese können aber selten, schlecht erreichbar oder saisonabhängig sein. Nicht als alleinige Wasserversorgung einplanen.",
    examples: "Ein kleiner Bach am Anfang der Wanderung oder eine Quelle, die im Sommer austrocknen kann",
    tip: "Eigenes Wasser bleibt Pflicht. Einzelne Wasserstellen sind nur ein Bonus und keine sichere Versorgung.",
  },
  {
    value: "moderate",
    label: "Mehrere Wasserstellen",
    color: WATER_GUIDE_COLOR_BY_LEVEL.moderate,
    desc: "Auf der Wanderung gibt es mehrere Wasserstellen oder längere Abschnitte mit Bachnähe. Trotzdem kann Wasser saisonal fehlen oder nicht zugänglich sein.",
    examples: "Wanderung entlang eines Bachs mit mehreren Zugangsmöglichkeiten oder Wanderung mit mehreren Brunnen oder Quellen",
    tip: "Gut für viele Hunde, aber je nach Saison oder Gelände nicht überall direkt erreichbar.",
  },
  {
    value: "plenty",
    label: "Viel Wasser",
    color: WATER_GUIDE_COLOR_BY_LEVEL.plenty,
    desc: "Die Wanderung bietet sehr regelmäßigen oder fast durchgehenden Wasserzugang. Besonders hundefreundlich, aber eigenes Wasser bleibt trotzdem Pflicht.",
    examples: "Rundweg um einen See mit wiederholtem direktem Zugang zum Wasser",
    tip: "Sehr hundefreundlich, trotzdem immer eigenes Trinkwasser und eine Schüssel dabeihaben.",
  },
];

export const WATER_APP_EXPLANATION =
  "Die Wassertropfen zeigen die typische Wasserverfügbarkeit entlang der Route. So schätzt du besser ein, wie viel Wasser du für dich und deinen Hund mitnehmen solltest.";

export const WATER_GUIDE_NOTE =
  "Die Wassertropfen zeigen nur die typische Wasserverfügbarkeit entlang der Route. Wasserstellen können je nach Saison, Wetter, Trockenheit, Schneelage oder Bewirtschaftung fehlen. Außerdem kann natürliches Wasser sehr kalt sein, besonders in Bächen, Bergseen oder nach der Schneeschmelze. Manche Hunde reagieren empfindlich darauf. Deshalb sollte für den Hund immer eigenes Wasser mitgenommen werden, auch bei 2 oder 3 Tropfen.";

export const TOUR_ICONS = {
  tour: "⛰️",
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
  grazing: "🐄",
  muzzle: "🦮",
  private: "👤",
  friends: "👥",
  public: "🌍",
  tip: "💡",
  check: "✓",
  parking: "🅿️",
  restaurant: "🍽️",
  hazard: "⚠️",
};

export const SEASON_COLORS = {
  spring: {
    color: "#D4547A",
    background: "rgba(212,84,122,0.14)",
    text: "#7C3020",
    className: "border-[#D4547A] bg-[#D4547A]/10 text-[#7C3020]",
  },
  summer: {
    color: "#A8003C",
    background: "rgba(168,0,60,0.13)",
    text: "#7C3020",
    className: "border-[#A8003C] bg-[#A8003C]/10 text-[#7C3020]",
  },
  autumn: {
    color: "#F9C030",
    background: "rgba(249,192,48,0.26)",
    text: "#7C3020",
    className: "border-[#F9C030] bg-[#F9C030]/20 text-[#7C3020]",
  },
  winter: {
    color: "#2563EB",
    background: "rgba(37,99,235,0.12)",
    text: "#1E3A8A",
    className: "border-[#2563EB] bg-[#2563EB]/10 text-[#1E3A8A]",
  },
  all_year: {
    color: "#2E9B62",
    background: "rgba(46,155,98,0.14)",
    text: "#166534",
    className: "border-[#2E9B62] bg-[#2E9B62]/10 text-[#166534]",
  },
};

export const SEASON_LEVELS = [
  { value: "spring", label: "Frühling", icon: "🌸", color: SEASON_COLORS.spring.className },
  { value: "summer", label: "Sommer", icon: "☀️", color: SEASON_COLORS.summer.className },
  { value: "autumn", label: "Herbst", icon: "🍂", color: SEASON_COLORS.autumn.className },
  { value: "winter", label: "Winter", icon: "❄️", color: SEASON_COLORS.winter.className },
  { value: "all_year", label: "Ganzjährig", icon: "🍃", color: SEASON_COLORS.all_year.className },
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

export function getSeasonColorStyle(value) {
  return SEASON_COLORS[value] ?? null;
}

function normalizeSingleSeasonValue(value) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/^[\[\(\{"']+|[\]\)\}"']+$/g, "")
    .replace(/\s+/g, "_");

  if (!normalized) return null;
  if (["spring", "fruehling", "frühling"].includes(normalized)) return "spring";
  if (["summer", "sommer"].includes(normalized)) return "summer";
  if (["autumn", "fall", "herbst"].includes(normalized)) return "autumn";
  if (["winter"].includes(normalized)) return "winter";
  if (["all_year", "all-year", "ganzjaehrig", "ganzjährig", "ganzes_jahr", "yearround", "year_round"].includes(normalized)) return "all_year";

  return SEASON_BY_VALUE[normalized] ? normalized : null;
}

export function normalizeSeasonValues(...values) {
  return Array.from(
    new Set(
      values.flatMap((value) => {
        if (Array.isArray(value)) {
          return value
            .flatMap((entry) =>
              typeof entry === "string" ? entry.split(/[,;|]/) : []
            )
            .map((entry) => normalizeSingleSeasonValue(entry))
            .filter(Boolean);
        }

        if (typeof value === "string") {
          return value
            .split(/[,;|]/)
            .map((entry) => normalizeSingleSeasonValue(entry))
            .filter(Boolean);
        }

        return [];
      })
    )
  );
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
  return getWaterLevel(value)?.badgeClass ?? "bg-[#FFF3F7] text-[#A8003C] border-[#D4547A]/60";
}

export function getWaterTextColor(value) {
  return getWaterLevel(value)?.textColor ?? "text-[#A8003C]";
}
