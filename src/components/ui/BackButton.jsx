import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function BackButton({
  to,
  onClick,
  label = "Zurück",
  className = "",
  variant = "ghost",
  size = "sm",
}) {
  const content = (
    <>
      <ArrowLeft className="h-4 w-4" />
      <span>{label}</span>
    </>
  );

  const buttonClassName = cn("gap-2", className);

  if (to) {
    return (
      <Button asChild variant={variant} size={size} className={buttonClassName}>
        <Link to={to}>{content}</Link>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={buttonClassName}
      onClick={onClick}
    >
      {content}
    </Button>
  );
}
