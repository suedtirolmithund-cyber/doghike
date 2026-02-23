import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const MAX_HEIGHT = 150;

export default function ExpandableText({ text }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsExpand, setNeedsExpand] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      setNeedsExpand(ref.current.scrollHeight > MAX_HEIGHT);
    }
  }, [text]);

  if (!text) return null;

  return (
    <div>
      <div
        ref={ref}
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: isExpanded || !needsExpand ? "none" : MAX_HEIGHT }}
      >
        <p className="text-stone-600 whitespace-pre-wrap">{text}</p>
      </div>
      {needsExpand && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-sm font-medium text-slate-700 hover:text-slate-900 flex items-center gap-1 transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Weniger anzeigen
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Alles lesen
            </>
          )}
        </button>
      )}
    </div>
  );
}