import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

/**
 * Displays text clamped to `lines` lines.
 * Shows "Mehr lesen / Weniger anzeigen" when text exceeds `minChars` characters.
 *
 * NOTE: whitespace-pre-wrap must NOT be applied together with -webkit-line-clamp /
 * display:-webkit-box — it prevents the browser from reflowing lines and causes
 * only the first newline-segment to appear. We apply it only when expanded.
 */
export default function ExpandableText({
  text,
  lines = 3,
  minChars = 150,
  baseClassName = "text-slate-600 text-sm leading-relaxed",
}) {
  const [expanded, setExpanded] = useState(false);

  if (!text) return null;

  const needsButton = text.length > minChars;

  // When clamped: use -webkit-box display. whitespace-pre-wrap must be absent.
  // When expanded: show everything with pre-wrap so newlines render correctly.
  const clampedStyle = {
    display: "-webkit-box",
    WebkitLineClamp: lines,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    whiteSpace: "normal", // override any inherited pre-wrap
  };

  const expandedStyle = {
    whiteSpace: "pre-wrap",
  };

  return (
    <div>
      <p
        className={baseClassName}
        style={needsButton && !expanded ? clampedStyle : expandedStyle}
      >
        {text}
      </p>

      {needsButton && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 flex items-center gap-1 text-xs font-medium text-brand-400 hover:text-brand-600 transition-colors"
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
