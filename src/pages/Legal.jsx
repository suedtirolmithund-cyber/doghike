import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Shield, AlertTriangle, Info, CloudRain, User, PawPrint, FileText, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Legal() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-slate-50 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
        <Link to={createPageUrl("Dashboard")}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
        </Link>

        <div className="bg-white rounded-2xl p-4 md:p-8 border border-stone-200/50 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-6 h-6 md:w-8 md:h-8 text-slate-700" />
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800">Rechtliche Hinweise</h1>
          </div>
          <p className="text-xs text-stone-400 mb-8">Letzte Aktualisierung: Februar 2026</p>

          {/* Haupthinweis – prominent */}
          <div className="bg-slate-800 text-white rounded-2xl p-5 mb-6">
            <div className="flex gap-3 items-start">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm md:text-base leading-relaxed">
                <strong>Alle Touren erfolgen auf eigene Verantwortung.</strong> Wir übernehmen keine Haftung für Unfälle, Schäden oder falsche Angaben.
              </p>
            </div>
          </div>

          {/* Aktuelle Gefahren / Bedingungen */}
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 mb-8">
            <p className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Bedingungen können sich jederzeit ändern
            </p>
            <ul className="space-y-2 text-sm text-amber-800">
              <li className="flex items-start gap-2">
                <span className="mt-0.5">❄️</span>
                <span><strong>Lawinengefahr:</strong> Immer den aktuellen Lawinenlagebericht prüfen, besonders im Winter und Frühling.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">🚧</span>
                <span><strong>Sperrungen:</strong> Wege können gesperrt sein (Forstarbeiten, Erosion, Unwetterschäden). Hinweisschilder vor Ort beachten.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">⚠️</span>
                <span><strong>Wege nicht gewartet:</strong> Nicht alle Wege werden regelmäßig instand gehalten. Markierungen können fehlen oder überwachsen sein.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">🌦️</span>
                <span><strong>Wetterwechsel:</strong> Bergwetter kann sich innerhalb von Minuten ändern. Immer aktuelle Vorhersage prüfen.</span>
              </li>
            </ul>
          </div>

          <div className="space-y-6 md:space-y-8">

            {/* 1. Nur zur Information */}
            <section>
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-3 flex items-center gap-2">
                <Info className="w-5 h-5 text-slate-600" />
                1. App nur zur Information
              </h2>
              <div className="space-y-3 text-sm md:text-base text-stone-600 leading-relaxed">
                <p>
                  <strong>Südtirol mit Hund</strong> ist eine Informationsplattform. Alle Inhalte – Tourenberichte, GPS-Koordinaten, Fotos, Schwierigkeitsbewertungen, Empfehlungen – dienen ausschließlich zur allgemeinen Orientierung und Information.
                </p>
                <p>
                  Die App ist <strong>kein Navigationsgerät, kein offizielles Kartenmaterial und kein Ersatz für Wanderführer</strong> oder behördliche Informationen. Sie dient als Ergänzung, nicht als Alleinquelle für die Planung einer Tour.
                </p>
              </div>
            </section>

            {/* 2. Keine Garantie für Richtigkeit */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-600" />
                2. Keine Garantie für die Richtigkeit der Touren
              </h2>
              <div className="space-y-3 text-sm md:text-base text-stone-600 leading-relaxed">
                <p>
                  Alle Touren und Inhalte auf dieser Plattform werden von Nutzern erstellt und eingereicht. Der Betreiber prüft die Inhalte inhaltlich, kann jedoch <strong>keine Garantie für Richtigkeit, Vollständigkeit oder Aktualität</strong> übernehmen.
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Wege, Markierungen und Beschaffenheiten können sich seit der Erfassung verändert haben.</li>
                  <li>Distanz-, Höhen- und Zeitangaben sind Näherungswerte und können je nach Kondition und Tempo stark abweichen.</li>
                  <li>Schwierigkeitsbewertungen sind subjektiv und spiegeln die persönliche Einschätzung des Erstellers wider.</li>
                  <li>GPS-Koordinaten und Routen können technische Ungenauigkeiten enthalten.</li>
                </ul>
                <div className="bg-stone-50 rounded-xl p-4 mt-2">
                  <p className="text-stone-700 text-sm">
                    <strong>Empfehlung:</strong> Informiere dich zusätzlich bei offiziellen Stellen (Alpenverein, Tourismusverband Südtirol, lokale Bergrettung) über den aktuellen Zustand der Wege.
                  </p>
                </div>
              </div>
            </section>

            {/* 3. Keine Haftung */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                3. Keine Haftung bei Unfällen
              </h2>
              <div className="space-y-3 text-sm md:text-base text-stone-600 leading-relaxed">
                <p>
                  Der Betreiber dieser Plattform übernimmt <strong>keinerlei Haftung</strong> für Unfälle, Verletzungen, gesundheitliche Schäden, materielle Schäden oder sonstige Verluste, die im Zusammenhang mit der Nutzung der in dieser App bereitgestellten Informationen entstehen – weder für Personen noch für Tiere.
                </p>
                <p>
                  Dies gilt insbesondere für:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Unfälle auf Wanderwegen, die in der App beschrieben sind</li>
                  <li>Stürze, Absturzgefahr, Orientierungsverlust oder Erschöpfung</li>
                  <li>Schäden durch Tiere, Unwetter oder Naturgefahren (Lawinen, Steinschlag, etc.)</li>
                  <li>Schäden durch fehlerhafte oder veraltete Informationen</li>
                  <li>Verletzungen oder Schäden an Hunden</li>
                </ul>
              </div>
            </section>

            {/* 4. Eigenverantwortung */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-slate-600" />
                4. Eigenverantwortung der Nutzer
              </h2>
              <div className="space-y-3 text-sm md:text-base text-stone-600 leading-relaxed">
                <p>
                  Jeder Nutzer trägt die <strong>alleinige Verantwortung</strong> für seine Entscheidungen beim Wandern. Dazu gehört insbesondere:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Die Einschätzung der eigenen körperlichen Fitness und die der mitgeführten Hunde</li>
                  <li>Die Wahl einer geeigneten Tour entsprechend der eigenen Erfahrung und Ausrüstung</li>
                  <li>Das Mitführen von ausreichend Wasser, Nahrung, Karte, Erste-Hilfe-Material und Notfallausrüstung</li>
                  <li>Die Einhaltung aller lokalen Vorschriften (Leinenpflicht, Betretungsverbote, Naturschutzgebiete)</li>
                  <li>Die Entscheidung, eine Tour abzubrechen, wenn die Bedingungen sich verschlechtern</li>
                </ul>
              </div>
            </section>

            {/* 5. Kein Ersatz für alpine Erfahrung */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-3 flex items-center gap-2">
                <PawPrint className="w-5 h-5 text-slate-600" />
                5. Kein Ersatz für alpine Erfahrung
              </h2>
              <div className="space-y-3 text-sm md:text-base text-stone-600 leading-relaxed">
                <p>
                  Das Wandern in den Dolomiten und im Alpenraum erfordert <strong>alpine Grundkenntnisse und Erfahrung</strong>. Diese App ersetzt diese Erfahrung nicht.
                </p>
                <p>
                  Einige Touren können anspruchsvoll sein und verlangen Trittsicherheit, Schwindelfreiheit, Klettersteigausrüstung oder Ortskenntnis. Bitte beurteile deine Fähigkeiten ehrlich, bevor du eine Tour unternimmst – besonders mit einem Hund.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-2">
                  <p className="text-blue-800 text-sm">
                    <strong>Tipp:</strong> Für unerfahrene Bergwanderer empfehlen wir Kurse des Alpenvereins (CAI/AVS) oder die Begleitung durch lokale Bergführer.
                  </p>
                </div>
              </div>
            </section>

            {/* 6. Wetter & Gefahren */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-3 flex items-center gap-2">
                <CloudRain className="w-5 h-5 text-slate-600" />
                6. Wetter- & Gefahrenhinweise
              </h2>
              <div className="space-y-3 text-sm md:text-base text-stone-600 leading-relaxed">
                <p>
                  Das Bergwetter in Südtirol kann sich <strong>innerhalb von Minuten drastisch ändern</strong>. Gewitter, Nebel, Schnee und Eisglätte sind auch im Sommer möglich.
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Prüfe <strong>immer</strong> die aktuelle Wettervorhersage vor dem Start (z.B. <a href="https://www.provinz.bz.it/wetter" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Wetterdienst Provinz Bozen</a>)</li>
                  <li>Starte Hochtouren so früh wie möglich – Nachmittagsgewitter sind häufig</li>
                  <li>Bei Gewittern sofort in ein Schutzgebäude oder tief ins Tal flüchten</li>
                  <li>Achte auf Lawinenbulletins im Winter und Frühling</li>
                  <li>Schütze deinen Hund vor Hitze: Pfotenverbrennungen auf heißem Fels sind real</li>
                </ul>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-3">
                  <p className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4" /> Im Notfall
                  </p>
                  <p className="text-red-700 text-sm">🚨 Euronotruf: <strong>112</strong> (auch ohne SIM-Karte)</p>
                  <p className="text-red-700 text-sm mt-1">Bergrettung Südtirol (CNSAS): <strong>+39 0471 797 397</strong></p>
                  <p className="text-red-600 text-xs mt-2">Standort angeben – GPS-Koordinaten kannst du in der App auf der Karte ablesen.</p>
                </div>
              </div>
            </section>

            {/* Nutzergenerierte Inhalte */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-3">
                Nutzergenerierte Inhalte
              </h2>
              <div className="space-y-3 text-sm md:text-base text-stone-600 leading-relaxed">
                <p>
                  Nutzer sind selbst dafür verantwortlich, dass ihre Beiträge (Fotos, Texte, Routen) keine Rechte Dritter verletzen, der Wahrheit entsprechen und keine anderen Personen gefährden.
                </p>
                <p>
                  Der Betreiber behält sich das Recht vor, Inhalte, die gegen diese Grundsätze verstoßen, zu entfernen.
                </p>
              </div>
            </section>

            <section className="border-t border-stone-200 pt-6">
              <p className="text-xs text-stone-400">
                Der Betreiber behält sich das Recht vor, diese Hinweise jederzeit zu ändern. Die Nutzung der Plattform erfolgt unter Anerkennung dieser Bedingungen.
              </p>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}