import { Droplets } from "lucide-react";
import WaterIcon from "@/components/icons/WaterIcon";

const waterLevels = [
  {
    value: "none",
    label: "Kein Wasser",
    icon: "💧̸",
    color: "bg-red-50 border-red-200 text-red-800",
    desc: "Auf der gesamten Route gibt es keine natürlichen Wasserquellen.",
    examples: "Hochalpine Touren, trockene Felspfade im Sommer",
    tip: "Nimm ausreichend Wasser mit – mindestens 2 bis 3 Liter pro Person. Für Hunde ist eine faltbare Trinkschüssel sinnvoll.",
  },
  {
    value: "little",
    label: "Wenig Wasser",
    icon: "💧",
    color: "bg-orange-50 border-orange-200 text-orange-800",
    desc: "Es gibt vereinzelt Bachläufe oder Quellen, aber nicht zuverlässig oder nur saisonal.",
    examples: "Bergwege im Spätsommer, südexponierte Hänge",
    tip: "Plane mit eigenen Wasserreserven. Kleine Bachläufe können im Sommer austrocknen.",
  },
  {
    value: "moderate",
    label: "Etwas Wasser",
    icon: "💧💧",
    color: "bg-blue-50 border-blue-200 text-blue-800",
    desc: "Mehrere Bachläufe oder Quellen entlang des Weges, aber nicht in sehr kurzem Abstand.",
    examples: "Typische Alpentouren im Frühling oder Sommer",
    tip: "Für Hunde meist gut geeignet. Für längere trockene Abschnitte trotzdem eigenes Wasser mitnehmen.",
  },
  {
    value: "plenty",
    label: "Viel Wasser",
    icon: "💧💧💧",
    color: "bg-cyan-50 border-cyan-200 text-cyan-800",
    desc: "Regelmäßig Bäche, Quellen oder Seen entlang des Weges. Wasser ist fast immer erreichbar.",
    examples: "Touren entlang von Bächen, durch Schluchten oder Almen mit Tränken",
    tip: "Ideal für Hunde. Prüfe trotzdem kurz, ob das Wasser sauber aussieht.",
  },
];

export default function WaterHelp() {
  return (
    <div className="min-h-screen bg-stone-50 pb-24 md:pb-8 pt-4 md:pt-20">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-center gap-3 text-center">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
            <Droplets className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800">Wasser unterwegs</h1>
            <p className="mx-auto mt-1 max-w-md text-sm text-stone-500">
              Einheitliche Skala für die Wasserverfügbarkeit auf der Route.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {waterLevels.map((level) => (
            <div key={level.value} className={`border rounded-2xl p-5 ${level.color}`}>
              <div className="flex items-center gap-3 mb-3">
                <WaterIcon value={level.value} className="text-2xl" />
                <span className="font-semibold text-lg">{level.label}</span>
              </div>
              <p className="text-sm mb-3">{level.desc}</p>
              <div className="grid grid-cols-1 gap-1.5 text-xs opacity-80">
                <div><span className="font-medium">Beispiele:</span> {level.examples}</div>
                <div><span className="font-medium">Tipp:</span> {level.tip}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-white border border-stone-200 rounded-2xl text-sm text-stone-600">
          <p className="font-medium mb-1">Hinweis für Hundebesitzer</p>
          <p className="text-xs">
            Hunde brauchen bei Hitze und Belastung deutlich mehr Wasser. Plane bei wenig oder keinem Wasser zusätzlich eigenes Wasser für Mensch und Hund ein.
          </p>
        </div>
      </div>
    </div>
  );
}
