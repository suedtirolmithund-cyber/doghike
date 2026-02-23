import { Droplets } from "lucide-react";

const waterLevels = [
  {
    value: "none",
    label: "Kein Wasser",
    icon: "🚫",
    color: "bg-red-50 border-red-200 text-red-800",
    badge: "bg-red-400",
    desc: "Auf der gesamten Route gibt es keine natürlichen Wasserquellen.",
    examples: "Hochalpine Touren, trockene Felspfade im Sommer",
    tip: "Nimm ausreichend Wasser von zuhause mit – mindestens 2–3 Liter pro Person. Für Hunde eignet sich eine faltbare Trinkschüssel.",
  },
  {
    value: "little",
    label: "Wenig Wasser",
    icon: "💧",
    color: "bg-orange-50 border-orange-200 text-orange-800",
    badge: "bg-orange-400",
    desc: "Es gibt vereinzelt Bachläufe oder Quellen, aber nicht zuverlässig oder nur zu bestimmten Jahreszeiten.",
    examples: "Bergwege im Spätsommer, südexponierte Hänge",
    tip: "Plane mit eigenen Wasserreserven. Bachläufe können im Sommer austrocknen.",
  },
  {
    value: "moderate",
    label: "Etwas Wasser",
    icon: "💧💧",
    color: "bg-yellow-50 border-yellow-200 text-yellow-800",
    badge: "bg-yellow-500",
    desc: "Mehrere Bachläufe oder Quellen entlang des Weges, aber nicht in sehr kurzem Abstand.",
    examples: "Typische Alpentouren im Frühling/Sommer",
    tip: "Für Hunde empfehlenswert – zwischendurch trinken lassen. Eigenes Wasser für Engstellen mitnehmen.",
  },
  {
    value: "plenty",
    label: "Viel Wasser",
    icon: "💧💧💧",
    color: "bg-blue-50 border-blue-200 text-blue-800",
    badge: "bg-blue-500",
    desc: "Regelmäßig Bäche, Quellen oder Seen entlang des Weges. Wasser immer in Reichweite.",
    examples: "Touren entlang von Bächen, durch Schluchten, Almgebiete mit Tränken",
    tip: "Ideal für Hunde! Trotzdem kurz prüfen ob das Wasser sauber aussieht.",
  },
];

export default function WaterHelp() {
  return (
    <div className="min-h-screen bg-stone-50 pb-24 md:pb-8 pt-4 md:pt-20">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-2xl mb-4">
            <Droplets className="w-7 h-7 text-blue-600" />
          </div>
          <h1 className="text-3xl font-light text-stone-800 mb-2">Wasser unterwegs</h1>
          <p className="text-stone-500 text-sm max-w-md mx-auto">
            Wie viel natürliches Wasser (Bäche, Quellen) ist auf der Route verfügbar?
            Besonders wichtig für Hunde im Sommer.
          </p>
        </div>

        <div className="space-y-4">
          {waterLevels.map((l) => (
            <div key={l.value} className={`border rounded-2xl p-5 ${l.color}`}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{l.icon}</span>
                <span className="font-semibold text-lg">{l.label}</span>
              </div>
              <p className="text-sm mb-3">{l.desc}</p>
              <div className="grid grid-cols-1 gap-1.5 text-xs opacity-80">
                <div><span className="font-medium">Beispiele:</span> {l.examples}</div>
                <div><span className="font-medium">💡 Tipp:</span> {l.tip}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-white border border-stone-200 rounded-2xl text-sm text-stone-600">
          <p className="font-medium mb-1">🐕 Hinweis für Hundebesitzer</p>
          <p className="text-xs">Hunde benötigen im Sommer bei Hitze und körperlicher Belastung deutlich mehr Wasser als im Winter. Plane bei wenig Wasser auf der Route mindestens 0,5–1 Liter extra pro Hund pro Stunde ein.</p>
        </div>
      </div>
    </div>
  );
}