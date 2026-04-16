import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

/**
 * Displays text truncated to `lines` lines.
 * Shows "Mehr lesen / Weniger anzeigen" when text exceeds `minChars` characters.
 *
 * Uses inline -webkit-line-clamp (not dynamic Tailwind classes, which are
 * stripped by JIT unless statically listed).
 */
export default function ExpandableText({
  text,
  lines = 3,
  minChars = 300,
  className = "text-stone-600 text-sm leading-relaxed whitespace-pre-wrap",
}) {
  const [expanded, setExpanded] = useState(false);

  if (!text) return null;

  const needsButton = text.length > minChars;

  const clampStyle = !expanded && needsButton
    ? {
        display: "-webkit-box",
        WebkitLineClamp: lines,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }
    : {};

  return (
    <div>
      <p className={className} style={clampStyle}>
        {text}
      </p>

      {needsButton && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              Weniger anzeigen
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              Mehr lesen
            </>
          )}
        </button>
      )}
    </div>
  );
}
