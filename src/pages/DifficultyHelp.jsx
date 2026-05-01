import { Mountain, PawPrint } from "lucide-react";
import { useState } from "react";

const humanLevels = [
  {
    level: "T1",
    stufe: "Stufe 1",
    color: "bg-brand-100 border-green-300 text-green-800",
    badge: "bg-brand-500",
    title: "Sehr leicht – Wanderweg",
    desc: "Gut markierter Weg ohne besondere Schwierigkeiten. Geeignet für fast alle, auch ohne Wandererfahrung.",
    examples: "Flache Waldwege, Almwiesen, Rundwege im Tal",
    terrain: "Befestigter Weg oder breiter Pfad, kein Absturzrisiko",
    fitness: "Keine besondere Kondition nötig",
  },
  {
    level: "T2",
    stufe: "Stufe 2",
    color: "bg-lime-100 border-lime-300 text-lime-800",
    badge: "bg-lime-500",
    title: "Leicht – Bergwanderweg",
    desc: "Schmalerer, teils steiler Pfad mit leichten Geländeunterschieden. Gute Trittsicherheit ist hilfreich.",
    examples: "Hügelige Wanderungen, einfache Almtouren",
    terrain: "Markierter Pfad, ab und zu steinig, geringe Absturzgefahr",
    fitness: "Leichte Ausdauer erforderlich",
  },
  {
    level: "T3",
    stufe: "Stufe 3",
    color: "bg-yellow-100 border-yellow-300 text-yellow-800",
    badge: "bg-yellow-500",
    title: "Mittel – Anspruchsvoller Bergweg",
    desc: "Steile, rutschige oder exponierte Abschnitte. Trittsicherheit und Schwindelfreiheit sind wichtig.",
    examples: "Steilere Bergwege, Geröllfelder, ausgesetzte Passagen",
    terrain: "Teils felsig, uneben oder ausgesetzt, Hände gelegentlich nötig",
    fitness: "Gute Kondition und etwas Bergerfahrung empfohlen",
  },
  {
    level: "T4",
    stufe: "Stufe 4",
    color: "bg-orange-100 border-orange-300 text-orange-800",
    badge: "bg-orange-500",
    title: "Schwer – Alpiner Weg",
    desc: "Weglos oder stark ausgesetzt. Gute Orientierung, Trittsicherheit und alpine Erfahrung sind notwendig.",
    examples: "Gipfeltouren, alpine Übergänge, sehr steile Wege",
    terrain: "Fels, Geröll, Schneefelder möglich",
    fitness: "Sehr gute Kondition und alpine Erfahrung",
  },
  {
    level: "T5",
    stufe: "Stufe 5",
    color: "bg-red-100 border-red-300 text-red-800",
    badge: "bg-red-500",
    title: "Sehr schwer – Schwieriger Alpinweg",
    desc: "Hochalpines Gelände mit stark exponierten Stellen. Nur für sehr erfahrene Bergsteiger geeignet.",
    examples: "Schwierige Klettersteige, hochalpine Routen",
    terrain: "Ausgesetzter Fels, Schnee, Gletscher, heikle Passagen",
    fitness: "Nur für sehr erfahrene Alpinisten",
  },
];

const dogLevels = [
  {
    stufe: "Stufe 1",
    color: "bg-brand-100 border-green-300 text-green-800",
    badge: "bg-brand-500",
    title: "Sehr leicht – Ideal für jeden Hund",
    desc: "Breite, befestigte Wege ohne nennenswerte Hindernisse. Kein Absturzrisiko.",
    examples: "Feldwege, Waldpfade, flache Rundwege",
    terrain: "Befestigter oder breiter Erdweg, keine Treppen oder Felsen",
    note: "Geeignet für Welpen, ältere Hunde und alle Rassen",
  },
  {
    stufe: "Stufe 2",
    color: "bg-lime-100 border-lime-300 text-lime-800",
    badge: "bg-lime-500",
    title: "Leicht – Für gesunde Hunde",
    desc: "Leicht hügeliges Gelände, schmale Pfade und keine gefährlichen Stellen.",
    examples: "Hügelige Waldwege, einfache Almwege",
    terrain: "Schmaler Pfad, wenig Geröll, geringe Steigung",
    note: "Für die meisten gesunden Hunde problemlos",
  },
  {
    stufe: "Stufe 3",
    color: "bg-yellow-100 border-yellow-300 text-yellow-800",
    badge: "bg-yellow-500",
    title: "Mittel – Trittsichere Hunde",
    desc: "Steile Abschnitte, Geröll und schmale Pfade mit leichter Absturzgefahr.",
    examples: "Steile Almwege, einfache Gipfeltouren",
    terrain: "Felsige Passagen, Geröll, teils steil",
    note: "Leine an ausgesetzten Stellen empfohlen. Hunde mit Gelenkproblemen besser meiden.",
  },
  {
    stufe: "Stufe 4",
    color: "bg-orange-100 border-orange-300 text-orange-800",
    badge: "bg-orange-500",
    title: "Schwer – Nur für fitte Hunde",
    desc: "Ausgesetzte Abschnitte, Leitern oder Treppen, enge Felsdurchgänge. Der Hund muss gegebenenfalls getragen werden.",
    examples: "Klettersteige, hochalpine Wege",
    terrain: "Fels, Seilversicherungen, Leitern",
    note: "Große oder schwere Hunde sind hier oft nicht geeignet",
  },
  {
    stufe: "Stufe 5",
    color: "bg-red-100 border-red-300 text-red-800",
    badge: "bg-red-500",
    title: "Sehr schwer – Hunde nicht empfohlen",
    desc: "Sehr steiles Felsgelände, Kletterpassagen und kaum überwindbare Hindernisse für Hunde.",
    examples: "Anspruchsvolle Klettersteige, hochalpines Terrain",
    terrain: "Senkrechte Felspassagen, Schnee, Gletscher",
    note: "Hunde sollten hier zu Hause bleiben",
  },
];

export default function DifficultyHelp() {
  const [activeTab, setActiveTab] = useState("human");

  return (
    <div className="min-h-screen bg-stone-50 pb-24 md:pb-8 pt-4 md:pt-20">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-center gap-3 text-center">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
            <Mountain className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800">Schwierigkeitsskala</h1>
            <p className="mt-1 text-sm text-stone-500">
              Einheitliche Orientierung für Mensch und Hund
            </p>
          </div>
        </div>

        <div className="flex gap-2 mb-8 bg-white rounded-xl p-1 border border-stone-200 shadow-sm">
          <button
            onClick={() => setActiveTab("human")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "human" ? "bg-slate-800 text-white shadow" : "text-stone-600 hover:bg-stone-50"
            }`}
          >
            <Mountain className="w-4 h-4" />
            Für Menschen
          </button>
          <button
            onClick={() => setActiveTab("dog")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "dog" ? "bg-slate-800 text-white shadow" : "text-stone-600 hover:bg-stone-50"
            }`}
          >
            <PawPrint className="w-4 h-4" />
            Für Hunde
          </button>
        </div>

        {activeTab === "human" && (
          <div className="space-y-4">
            {humanLevels.map((level) => (
              <div key={level.stufe} className={`border rounded-2xl p-5 ${level.color}`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-white text-xs font-bold px-2 py-1 rounded-full ${level.badge}`}>{level.level}</span>
                  <div>
                    <span className="font-semibold">{level.stufe}</span>
                    <span className="text-sm ml-2 opacity-80">– {level.title}</span>
                  </div>
                </div>
                <p className="text-sm mb-3">{level.desc}</p>
                <div className="grid grid-cols-1 gap-1.5 text-xs opacity-80">
                  <div><span className="font-medium">Beispiele:</span> {level.examples}</div>
                  <div><span className="font-medium">Gelände:</span> {level.terrain}</div>
                  <div><span className="font-medium">Fitness:</span> {level.fitness}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "dog" && (
          <div className="space-y-4">
            {dogLevels.map((level) => (
              <div key={level.stufe} className={`border rounded-2xl p-5 ${level.color}`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-white text-xs font-bold px-2 py-1 rounded-full ${level.badge}`}>🐾</span>
                  <div>
                    <span className="font-semibold">{level.stufe}</span>
                    <span className="text-sm ml-2 opacity-80">– {level.title}</span>
                  </div>
                </div>
                <p className="text-sm mb-3">{level.desc}</p>
                <div className="grid grid-cols-1 gap-1.5 text-xs opacity-80">
                  <div><span className="font-medium">Beispiele:</span> {level.examples}</div>
                  <div><span className="font-medium">Gelände:</span> {level.terrain}</div>
                  <div><span className="font-medium">Hinweis:</span> {level.note}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
