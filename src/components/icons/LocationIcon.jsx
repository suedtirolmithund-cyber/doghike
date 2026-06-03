import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export const LOCATION_PIN_SVG_MARKUP = `
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
`;

export default function LocationIcon({ className, ...props }) {
  return (
    <MapPin
      aria-hidden="true"
      className={cn("h-4 w-4 shrink-0", className)}
      {...props}
    />
  );
}
