import { Mountain } from "lucide-react";
import { useState } from "react";
import {
  DIFFICULTY_APP_EXPLANATIONS,
  DIFFICULTY_GUIDE_NOTE,
  DOG_DIFFICULTY_GUIDE,
  HUMAN_DIFFICULTY_GUIDE,
  TOUR_ICONS,
} from "@/lib/difficultyConfig";

export default function DifficultyHelp() {
  const [activeTab, setActiveTab] = useState("human");
  const levels = activeTab === "human" ? HUMAN_DIFFICULTY_GUIDE : DOG_DIFFICULTY_GUIDE;

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50/20 pb-24 pt-4 md:pb-8 md:pt-20">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="doghike-page-header justify-center text-center">
          <div className="doghike-page-icon">
            <Mountain className="h-5 w-5" />
          </div>
          <div>
            <h1 className="doghike-page-title">Schwierigkeitsskala</h1>
            <p className="doghike-page-subtitle">
              Einheitliche Orientierung für Mensch und Hund
            </p>
          </div>
        </div>

        <div className="doghike-info-box-lg mb-6">
          <h2 className="doghike-info-title">Bedeutung in der App</h2>
          <div className="space-y-3">
            {DIFFICULTY_APP_EXPLANATIONS.map((item) => (
              <div key={item.key}>
                <div className="doghike-info-subtitle">{item.title}</div>
                <p className="doghike-info-text">{item.description}</p>
              </div>
            ))}
          </div>
          <p className="doghike-info-note mt-4">
            {DIFFICULTY_GUIDE_NOTE}
          </p>
        </div>

        <div className="mb-8 flex gap-2 rounded-xl border border-white/70 bg-white/65 p-1 shadow-sm backdrop-blur-xl">
          <button
            onClick={() => setActiveTab("human")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${
              activeTab === "human" ? "bg-brand-400 text-white shadow" : "text-slate-600 hover:bg-brand-50/50"
            }`}
          >
            <span className="text-sm leading-none">{TOUR_ICONS.human}</span>
            Mensch
          </button>
          <button
            onClick={() => setActiveTab("dog")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${
              activeTab === "dog" ? "bg-brand-400 text-white shadow" : "text-slate-600 hover:bg-brand-50/50"
            }`}
          >
            <span className="text-sm leading-none">{TOUR_ICONS.dog}</span>
            Hund
          </button>
        </div>

        <div className="space-y-4">
          {levels.map((level) => (
            <div key={level.stufe} className={`rounded-2xl border p-5 shadow-sm ${level.color}`}>
              <div className="mb-3 flex items-center gap-3">
                <span className={`rounded-full px-2 py-1 text-xs font-bold text-white ${level.badge}`}>
                  {level.level}
                </span>
                <div>
                  <span className="font-semibold">{level.title}</span>
                  <span className="ml-2 text-sm opacity-80">- {level.stufe}</span>
                </div>
              </div>
              <p className="mb-3 text-sm">{level.desc}</p>
              <div className="grid grid-cols-1 gap-1.5 text-xs opacity-80">
                <div><span className="font-medium">Beispiele:</span> {level.examples}</div>
                <div><span className="font-medium">Gelände:</span> {level.terrain}</div>
                <div><span className="font-medium">{activeTab === "human" ? "Einordnung" : "Hinweis"}:</span> {level.fitness ?? level.note}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
