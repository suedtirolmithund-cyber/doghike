import { Label } from "@/components/ui/label";
import { SEASON_LEVELS, TOUR_ICONS } from "@/lib/difficultyConfig";

const SEASON_OPTIONS = SEASON_LEVELS.map((season) => ({
  value: season.value,
  emoji: season.icon,
  label: season.label,
  colors: {
    spring: { border: "#D4547A", background: "rgba(212,84,122,0.14)", text: "#7C3020" },
    summer: { border: "#F07030", background: "rgba(240,112,48,0.14)", text: "#7C3020" },
    autumn: { border: "#C07820", background: "rgba(192,120,32,0.16)", text: "#7C3020" },
    winter: { border: "#A8003C", background: "rgba(168,0,60,0.10)", text: "#7C3020" },
    all_year: { border: "#F9C030", background: "rgba(249,192,48,0.24)", text: "#7C3020" },
  }[season.value],
}));

export default function SeasonMultiPicker({
  label = `${TOUR_ICONS.season} Jahreszeit`,
  value = [],
  onChange,
  emptyHint = "Keine Auswahl = wird nicht angezeigt",
}) {
  const toggle = (season) => {
    const next = value.includes(season)
      ? value.filter((entry) => entry !== season)
      : [...value, season];

    onChange(next);
  };

  return (
    <div>
      <Label className="mb-2 block text-sm text-slate-600">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {SEASON_OPTIONS.map((option) => {
          const active = value.includes(option.value);

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggle(option.value)}
              style={active ? {
                borderColor: option.colors.border,
                backgroundColor: option.colors.background,
                color: option.colors.text,
              } : {}}
              className={`flex items-center gap-1.5 rounded-xl border-2 px-3 py-2 text-sm font-medium transition-all focus:outline-none ${
                active
                  ? "shadow-sm"
                  : "border-brand-100 bg-white text-slate-500 hover:border-brand-100"
              }`}
            >
              <span>{option.emoji}</span>
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
      {value.length === 0 && emptyHint ? (
        <p className="mt-1 text-xs text-slate-400">{emptyHint}</p>
      ) : null}
    </div>
  );
}
