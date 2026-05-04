import { Droplets } from "lucide-react";
import WaterIcon from "@/components/icons/WaterIcon";

const waterLevels = [
  {
    value: "none",
    label: "Kein Wasser",
    color: "bg-red-50 border-red-200 text-red-800",
    desc: "Auf der gesamten Route gibt es keine natürlichen Wasserquellen.",
    examples: "Hochalpine Touren, trockene Felspfade im Sommer",
    tip: "Nimm ausreichend Wasser mit - mindestens 2 bis 3 Liter pro Person. Für Hunde ist eine faltbare Trinkschüssel sinnvoll.",
  },
  {
    value: "little",
    label: "Wenig Wasser",
    color: "bg-orange-50 border-orange-200 text-orange-800",
    desc: "Es gibt vereinzelt Bachläufe oder Quellen, aber nicht zuverlässig oder nur saisonal.",
    examples: "Bergwege im Spätsommer, südexponierte Hänge",
    tip: "Plane mit eigenen Wasserreserven. Kleine Bachläufe können im Sommer austrocknen.",
  },
  {
    value: "moderate",
    label: "Etwas Wasser",
    color: "bg-brand-50 border-brand-200 text-brand-800",
    desc: "Mehrere Bachläufe oder Quellen entlang des Weges, aber nicht in sehr kurzem Abstand.",
    examples: "Typische Alpentouren im Frühling oder Sommer",
    tip: "Für Hunde meist gut geeignet. Für längere trockene Abschnitte trotzdem eigenes Wasser mitnehmen.",
  },
  {
    value: "plenty",
    label: "Viel Wasser",
    color: "bg-cyan-50 border-cyan-200 text-cyan-800",
    desc: "Regelmäßig Bäche, Quellen oder Seen entlang des Weges. Wasser ist fast immer erreichbar.",
    examples: "Touren entlang von Bächen, durch Schluchten oder Almen mit Tränken",
    tip: "Ideal für Hunde. Prüfe trotzdem kurz, ob das Wasser sauber aussieht.",
  },
];

export default function WaterHelp() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-brand-50/20 pb-24 pt-4 md:pb-8 md:pt-20">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="doghike-page-header justify-center text-center">
          <div className="doghike-page-icon">
            <Droplets className="h-5 w-5" />
          </div>
          <div>
            <h1 className="doghike-page-title">Wasser unterwegs</h1>
            <p className="doghike-page-subtitle mx-auto max-w-md">
              Einheitliche Skala für die Wasserverfügbarkeit auf der Route.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {waterLevels.map((level) => (
            <div key={level.value} className={`rounded-2xl border p-5 shadow-sm ${level.color}`}>
              <div className="mb-3 flex items-center gap-3">
                <WaterIcon value={level.value} className="text-2xl" />
                <span className="text-lg font-semibold">{level.label}</span>
              </div>
              <p className="mb-3 text-sm">{level.desc}</p>
              <div className="grid grid-cols-1 gap-1.5 text-xs opacity-80">
                <div><span className="font-medium">Beispiele:</span> {level.examples}</div>
                <div><span className="font-medium">Tipp:</span> {level.tip}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="doghike-glass-card mt-6 p-4 text-sm text-stone-600">
          <p className="mb-1 font-medium">Hinweis für Hundebesitzer</p>
          <p className="text-xs">
            Hunde brauchen bei Hitze und Belastung deutlich mehr Wasser. Plane bei wenig oder keinem Wasser zusätzlich eigenes Wasser für Mensch und Hund ein.
          </p>
        </div>
      </div>
    </div>
  );
}
