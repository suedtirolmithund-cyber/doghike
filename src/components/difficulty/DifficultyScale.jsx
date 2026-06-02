import { TOUR_ICONS, getDifficultyLabel, getDifficultyLevel, getDifficultyTypeStyle } from "@/lib/difficultyConfig";
import { cn } from "@/lib/utils";

const DIFFICULTY_TYPE_META = {
  human: {
    icon: TOUR_ICONS.human,
    label: "Mensch",
  },
  dog: {
    icon: TOUR_ICONS.dog,
    label: "Hund",
  },
};

export function DifficultyBars({ level, type = "human", className = "" }) {
  const meta = DIFFICULTY_TYPE_META[type] ?? DIFFICULTY_TYPE_META.human;
  const style = getDifficultyTypeStyle(type);
  const difficultyLevel = Number(getDifficultyLevel(level));

  if (!difficultyLevel) return null;

  return (
    <span className={cn("inline-flex items-end gap-0.5", className)} aria-hidden="true">
      {Array.from({ length: 5 }).map((_, index) => (
        <span
          key={index}
          className={cn(
            "h-2.5 w-1.5 rounded-full shadow-[inset_0_-1px_0_rgba(124,48,32,0.16)]",
            index < difficultyLevel ? style.activeBar : style.inactiveBar
          )}
        />
      ))}
    </span>
  );
}

export default function DifficultyScaleChip({ level, type = "human", className = "" }) {
  const meta = DIFFICULTY_TYPE_META[type] ?? DIFFICULTY_TYPE_META.human;
  const style = getDifficultyTypeStyle(type);
  const difficultyLevel = getDifficultyLevel(level);
  const difficultyLabel = getDifficultyLabel(level);

  if (!difficultyLevel || !difficultyLabel) return null;

  return (
    <span
      className={cn(
        "inline-flex min-h-8 max-w-full min-w-0 flex-wrap items-center justify-center gap-1.5 rounded-full border px-2.5 py-1.5 text-center text-xs font-semibold leading-tight whitespace-normal break-words sm:text-sm md:px-3 md:text-xs",
        style.chipClass,
        className
      )}
      aria-label={`${meta.label} ${difficultyLevel} von 5: ${difficultyLabel}`}
    >
      <span className="text-sm leading-none">{meta.icon}</span>
      <span className="font-bold">{meta.label}</span>
      <DifficultyBars level={level} type={type} />
      <span className="font-semibold">{difficultyLabel}</span>
    </span>
  );
}
