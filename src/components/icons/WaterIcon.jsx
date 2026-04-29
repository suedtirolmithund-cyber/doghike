import { getWaterIcon } from "@/lib/difficultyConfig";

function isNoWater(value) {
  return value === "none" || value === 0 || value === "0";
}

export default function WaterIcon({ value, className = "" }) {
  if (!isNoWater(value)) {
    return <span className={className}>{getWaterIcon(value)}</span>;
  }

  return (
    <span
      aria-label="Kein Wasser"
      className={`relative inline-flex h-[1.15em] w-[1.15em] items-center justify-center align-[-0.12em] ${className}`}
    >
      <span aria-hidden="true" className="leading-none">💧</span>
      <span
        aria-hidden="true"
        className="absolute h-[0.14em] w-[1.25em] rotate-[-42deg] rounded-full bg-current"
      />
    </span>
  );
}
