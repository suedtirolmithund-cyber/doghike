import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

/**
 * Shows text clamped to `lines` lines (default 3).
 * A "Mehr lesen" / "Weniger anzeigen" button toggles the full text.
 * Uses CSS line-clamp for pixel-perfect line counting.
 */
export default function ExpandableText({
  text,
  lines = 3,
  className = "text-stone-600 text-sm leading-relaxed",
}) {
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // scrollHeight > clientHeight means text is being cut off
    setClamped(el.scrollHeight > el.clientHeight + 2);
  }, [text, lines]);

  if (!text) return null;

  return (
    <div>
      <p
        ref={ref}
        className={`${className} whitespace-pre-wrap transition-all duration-300 ${
          !expanded ? `line-clamp-${lines}` : ""
        }`}
      >
        {text}
      </p>

      {(clamped || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1.5 flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
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
