import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function ExpandableText({ text, maxHeight = "150px" }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return null;

  return (
    <div>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isExpanded ? "" : "max-h-[" + maxHeight + "]"
        }`}
        style={{ maxHeight: isExpanded ? "none" : maxHeight }}
      >
        <p className="text-stone-600 whitespace-pre-wrap">{text}</p>
      </div>
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
    </div>
  );
}