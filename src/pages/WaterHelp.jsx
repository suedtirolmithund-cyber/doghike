import WaterIcon from "@/components/icons/WaterIcon";
import { WATER_APP_EXPLANATION, WATER_GUIDE, WATER_GUIDE_NOTE } from "@/lib/difficultyConfig";

export default function WaterHelp() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50/20 pb-24 pt-4 md:pb-8 md:pt-20">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="doghike-page-header justify-center text-center">
          <div className="doghike-page-icon">
            <WaterIcon value="little" className="text-lg" />
          </div>
          <div>
            <h1 className="doghike-page-title">Wasser unterwegs</h1>
            <p className="doghike-page-subtitle mx-auto max-w-md">
              Einheitliche Skala für die Wasserverfügbarkeit auf der Route.
            </p>
          </div>
        </div>

        <div className="doghike-info-box-lg mb-6">
          <h2 className="doghike-info-title">Bedeutung in der App</h2>
          <div className="space-y-3">
            <div>
              <div className="doghike-info-subtitle">Wasserverfügbarkeit</div>
              <p className="doghike-info-text">{WATER_APP_EXPLANATION}</p>
            </div>
            <div>
              <div className="doghike-info-subtitle">Hinweis für Hundebesitzer</div>
              <p className="doghike-info-text">{WATER_GUIDE_NOTE}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {WATER_GUIDE.map((level) => (
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
      </div>
    </div>
  );
}
