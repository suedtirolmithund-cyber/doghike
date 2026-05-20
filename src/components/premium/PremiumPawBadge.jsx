import { cn } from "@/lib/utils";

export function PremiumPawBadge({ label = "Premium", className = "" }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-8 max-w-full items-center justify-center gap-1.5 rounded-full border border-[#F9C030] bg-gradient-to-br from-[#FFF4BF] via-[#F9C030] to-[#F8A030] px-3 py-1.5 text-xs font-extrabold leading-tight text-[#7C3020] shadow-[0_10px_22px_rgba(249,192,48,0.25)]",
        className
      )}
    >
      <span className="text-[1.08em] leading-none" aria-hidden="true">
        🐾
      </span>
      <span className="min-w-0 truncate">{label}</span>
    </span>
  );
}

export function PremiumPawMark({ className = "" }) {
  return (
    <span
      className={cn(
        "inline-flex h-14 w-14 items-center justify-center rounded-full border border-[#F9C030] bg-gradient-to-br from-[#FFF4BF] via-[#F9C030] to-[#F8A030] text-2xl shadow-[0_14px_28px_rgba(249,192,48,0.26)]",
        className
      )}
      aria-hidden="true"
    >
      🐾
    </span>
  );
}
