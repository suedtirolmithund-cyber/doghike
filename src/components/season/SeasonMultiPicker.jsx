import { Label } from "@/components/ui/label";
import { SEASON_COLORS, SEASON_LEVELS, TOUR_ICONS } from "@/lib/difficultyConfig";

const SEASON_OPTIONS = SEASON_LEVELS.map((season) => ({
  value: season.value,
  emoji: season.icon,
  label: season.label,
  colors: SEASON_COLORS[season.value],
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
      <Label className="mb-2">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {SEASON_OPTIONS.map((option) => {
          const active = value.includes(option.value);

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggle(option.value)}
              style={active ? {
                borderColor: option.colors.color,
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
