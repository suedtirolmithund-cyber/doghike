import { Mountain, PawPrint } from "lucide-react";
import { useState } from "react";

const humanLevels = [
  {
    level: "T1",
    stufe: "Stufe 1",
    color: "bg-brand-100 border-green-300 text-green-800",
    badge: "bg-brand-500",
    title: "Wanderweg",
    desc: "Gut markierter Weg, keine Schwierigkeiten. Geeignet für jeden, auch ohne Wandererfahrung.",
    examples: "Flache Waldwege, Almwiesen, Rundwege im Tal",
    terrain: "Befestigter Weg oder breiter Pfad, kein Absturzrisiko",
    fitness: "Keine besondere Kondition nötig",
  },
  {
    level: "T2",
    stufe: "Stufe 2",
    color: "bg-lime-100 border-lime-300 text-lime-800",
    badge: "bg-lime-500",
    title: "Bergwanderweg",
    desc: "Schmaler, teils steiler Pfad mit leichten Geländeunterschieden. Gute Trittsicherheit empfohlen.",
    examples: "Hügelige Wanderungen, einfache Almtouren",
    terrain: "Markierter Pfad, ab und zu steinig, geringe Absturzgefahr",
    fitness: "Leichte Ausdauer erforderlich",
  },
  {
    level: "T3",
    stufe: "Stufe 3",
    color: "bg-yellow-100 border-yellow-300 text-yellow-800",
    badge: "bg-yellow-500",
    title: "Anspruchsvoller Bergweg",
    desc: "Steile, rutschige oder exponierte Abschnitte. Trittsicherheit und Schwindelfreiheit erforderlich.",
    examples: "Touren mit Klettersteig-Abschnitten, Geröllfeldern",
    terrain: "Teils weglos, felsige Abschnitte, Hände gelegentlich nötig",
    fitness: "Gute Kondition und Bergerfahrung empfohlen",
  },
  {
    level: "T4",
    stufe: "Stufe 4",
    color: "bg-orange-100 border-orange-300 text-orange-800",
    badge: "bg-orange-500",
    title: "Alpiner Weg",
    desc: "Weglos, teils ausgesetzt. Gute Orientierung und Klettererfahrung notwendig.",
    examples: "Gipfeltouren, alpine Übergänge",
    terrain: "Fels, Geröll, Schneefelder möglich, III. Grad",
    fitness: "Sehr gute Kondition, alpine Erfahrung",
  },
  {
    level: "T5",
    stufe: "Stufe 5",
    color: "bg-red-100 border-red-300 text-red-800",
    badge: "bg-red-500",
    title: "Schwieriger Alpinweg",
    desc: "Hochalpines Gelände, stark exponiert, Klettern bis III. Grad. Nur für erfahrene Bergsteiger.",
    examples: "Klettersteige Schwierigkeit D/E, hochalpine Touren",
    terrain: "Stark exponiert, Gletscher, IV. Grad",
    fitness: "Sehr erfahrene Alpinisten",
  },
];

const dogLevels = [
  {
    stufe: "Stufe 1",
    color: "bg-brand-100 border-green-300 text-green-800",
    badge: "bg-brand-500",
    title: "Ideal für jeden Hund",
    desc: "Breite, befestigte Wege ohne nennenswerte Hindernisse. Kein Absturzrisiko.",
    examples: "Feldwege, Waldpfade, flache Rundwege",
    terrain: "Befestigter oder breiter Erdweg, keine Treppen oder Felsen",
    note: "Geeignet für Welpen, ältere Hunde und alle Rassen",
  },
  {
    stufe: "Stufe 2",
    color: "bg-lime-100 border-lime-300 text-lime-800",
    badge: "bg-lime-500",
    title: "Einfach – für gesunde Hunde",
    desc: "Leicht hügeliges Gelände, schmale Pfade. Keine gefährlichen Stellen.",
    examples: "Hügelige Waldwege, einfache Almwege",
    terrain: "Schmaler Pfad, wenig Geröll, geringe Steigung",
    note: "Für die meisten Hunde problemlos",
  },
  {
    stufe: "Stufe 3",
    color: "bg-yellow-100 border-yellow-300 text-yellow-800",
    badge: "bg-yellow-500",
    title: "Mittel – trittsichere Hunde",
    desc: "Steile Abschnitte, Geröll, schmale Pfade mit leichter Absturzgefahr.",
    examples: "Steile Almwege, einfache Gipfeltouren",
    terrain: "Felsige Passagen, Geröll, teils steil",
    note: "Leine empfohlen bei Ausgesetzt-Stellen. Hunde mit Gelenkproblemen besser meiden.",
  },
  {
    stufe: "Stufe 4",
    color: "bg-orange-100 border-orange-300 text-orange-800",
    badge: "bg-orange-500",
    title: "Schwer – nur für fitte Hunde",
    desc: "Ausgesetzte Abschnitte, Leitern oder Treppen, enge Felsdurchgänge. Hund muss gegebenenfalls getragen werden.",
    examples: "Klettersteige, hochalpine Wege",
    terrain: "Fels, Seilversicherungen, Leitern",
    note: "Große oder schwere Hunde ggf. nicht geeignet",
  },
  {
    stufe: "Stufe 5",
    color: "bg-red-100 border-red-300 text-red-800",
    badge: "bg-red-500",
    title: "Sehr schwer – Hunde nicht empfohlen",
    desc: "Sehr steiles Felsgelände, Kletterpassagen, kaum überwindbare Hindernisse für Hunde.",
    examples: "Anspruchsvolle Klettersteige, hochalpines Terrain",
    terrain: "Senkrechte Felspassagen, Schnee, Gletscher",
    note: "Hunde sollten zu Hause bleiben",
  },
];

export default function DifficultyHelp() {
  const [activeTab, setActiveTab] = useState("human");

  return (
    <div className="min-h-screen bg-stone-50 pb-24 md:pb-8 pt-4 md:pt-20">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-light text-stone-800 mb-2">Schwierigkeitsskala</h1>
          <p className="text-stone-500 text-sm">
            Orientiert an der SAC-Wanderskala (Schweizer Alpen Club)
          </p>
        </div>

        {/* Tab switcher */}
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
            {humanLevels.map((l) => (
              <div key={l.stufe} className={`border rounded-2xl p-5 ${l.color}`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-white text-xs font-bold px-2 py-1 rounded-full ${l.badge}`}>{l.level}</span>
                  <div>
                    <span className="font-semibold">{l.stufe}</span>
                    <span className="text-sm ml-2 opacity-80">– {l.title}</span>
                  </div>
                </div>
                <p className="text-sm mb-3">{l.desc}</p>
                <div className="grid grid-cols-1 gap-1.5 text-xs opacity-80">
                  <div><span className="font-medium">Beispiele:</span> {l.examples}</div>
                  <div><span className="font-medium">Gelände:</span> {l.terrain}</div>
                  <div><span className="font-medium">Fitness:</span> {l.fitness}</div>
                </div>
              </div>
            ))}
            <p className="text-xs text-stone-400 text-center pt-2">
              Quelle: Angelehnt an die T-Skala des Schweizer Alpen Club (SAC)
            </p>
          </div>
        )}

        {activeTab === "dog" && (
          <div className="space-y-4">
            {dogLevels.map((l) => (
              <div key={l.stufe} className={`border rounded-2xl p-5 ${l.color}`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-white text-xs font-bold px-2 py-1 rounded-full ${l.badge}`}>🐾</span>
                  <div>
                    <span className="font-semibold">{l.stufe}</span>
                    <span className="text-sm ml-2 opacity-80">– {l.title}</span>
                  </div>
                </div>
                <p className="text-sm mb-3">{l.desc}</p>
                <div className="grid grid-cols-1 gap-1.5 text-xs opacity-80">
                  <div><span className="font-medium">Beispiele:</span> {l.examples}</div>
                  <div><span className="font-medium">Gelände:</span> {l.terrain}</div>
                  <div><span className="font-medium">Hinweis:</span> {l.note}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}