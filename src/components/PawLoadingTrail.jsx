import { PawPrint } from "lucide-react";

export default function PawLoadingTrail({ className = "" }) {
  return (
    <div className={`mt-3 flex items-center justify-center gap-2 text-brand-400 ${className}`}>
      {[0, 1, 2].map((index) => (
        <PawPrint
          key={index}
          className="h-4 w-4 animate-bounce opacity-80"
          style={{ animationDelay: `${index * 0.18}s`, animationDuration: "1.1s" }}
        />
      ))}
    </div>
  );
}
