import { PawPrint } from "lucide-react";
import PawLoadingTrail from "@/components/PawLoadingTrail";
import { cn } from "@/lib/utils";

export function PageLoadingState({ message = "DogTrails lädt...", className }) {
  return (
    <div className={cn("doghike-page-shell flex items-center justify-center px-4 py-12", className)}>
      <div className="doghike-glass-card w-full max-w-sm px-6 py-10 text-center">
        <PawLoadingTrail className="mb-3 mt-0" />
        <p className="text-sm font-semibold text-[#7C3020]">{message}</p>
      </div>
    </div>
  );
}

export function SectionLoadingState({ message = "Lädt gerade...", className }) {
  return (
    <div className={cn("doghike-soft-panel flex flex-col items-center justify-center gap-2 px-4 py-6 text-center text-sm font-medium text-[#C07820]", className)}>
      <PawLoadingTrail className="mt-0" />
      <span>{message}</span>
    </div>
  );
}

export function EmptyState({
  icon: Icon = PawPrint,
  title,
  description,
  action,
  className,
  compact = false,
  iconClassName,
}) {
  return (
    <div className={cn("doghike-empty-state", compact && "px-4 py-8 md:py-10", className)}>
      <Icon className={cn("doghike-empty-icon", iconClassName)} />
      {title && <h3 className="doghike-empty-title">{title}</h3>}
      {description && <p className="mx-auto max-w-md text-sm leading-6 text-[#C07820]">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
