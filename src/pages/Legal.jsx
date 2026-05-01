import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Shield, AlertTriangle, Info, CloudRain, User, PawPrint, FileText, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Legal() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-[#f7efe8] pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
        <Link to={createPageUrl("Dashboard")}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
        </Link>

        <div className="rounded-2xl border border-stone-200/70 bg-white/70 p-4 shadow-[0_14px_34px_rgba(92,62,42,0.1)] backdrop-blur-sm md:p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
              <Shield className="h-5 w-5" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800">Rechtliche Hinweise</h1>
          </div>
          <p className="text-xs text-stone-400 mb-8">Letzte Aktualisierung: April 2026</p>

          <div className="mb-6 rounded-2xl border border-brand-200/70 bg-brand-50/60 p-5 text-stone-700">
            <div className="flex gap-3 items-start">
              <AlertTriangle className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
              <p className="text-sm md:text-base leading-relaxed">
                <strong>Alle Touren erfolgen auf eigene Verantwortung.</strong> Die bereitgestellten Inhalte dienen nur der Orientierung und ersetzen keine eigene Sicherheitsprüfung vor Ort.
              </p>
            </div>
          </div>

          <div className="mb-8 rounded-2xl border border-stone-200/70 bg-white/58 p-4">
            <p className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Bedingungen können sich jederzeit ändern
            </p>
            <ul className="space-y-2 text-sm text-amber-800">
              <li><strong>Lawinengefahr:</strong> Immer den aktuellen Lawinenlagebericht prüfen.</li>
              <li><strong>Sperrungen:</strong> Wege können gesperrt sein. Hinweisschilder vor Ort beachten.</li>
              <li><strong>Wetterwechsel:</strong> Bergwetter kann sich innerhalb von Minuten ändern.</li>
              <li><strong>Hütten und Lifte:</strong> Öffnungszeiten und Betrieb können saisonal oder wetterbedingt abweichen.</li>
            </ul>
          </div>

          <div className="space-y-6 md:space-y-8">
            <section>
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-3 flex items-center gap-2">
                <Info className="w-5 h-5 text-slate-600" />
                1. App nur zur Information
              </h2>
              <div className="space-y-3 text-sm md:text-base text-stone-600 leading-relaxed">
                <p>
                  <strong>DogHike</strong> ist eine Informationsplattform. Alle Inhalte – Tourenberichte,
                  GPS-Koordinaten, Fotos, Schwierigkeitsbewertungen und Empfehlungen – dienen ausschließlich
                  der allgemeinen Orientierung.
                </p>
                <p>
                  Die App ist <strong>kein Navigationsgerät, kein offizielles Kartenmaterial und kein Ersatz für behördliche Informationen oder professionelle Tourenplanung</strong>.
                </p>
              </div>
            </section>

            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-600" />
                2. Keine Gewähr für die Richtigkeit der Touren
              </h2>
              <div className="space-y-3 text-sm md:text-base text-stone-600 leading-relaxed">
                <p>
                  Alle Touren und Inhalte auf dieser Plattform werden von Nutzern erstellt oder aus externen Quellen übernommen.
                  Der Betreiber kann <strong>keine Gewähr für Richtigkeit, Vollständigkeit oder Aktualität</strong> übernehmen.
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Wege, Markierungen und Beschaffenheiten können sich seit der Erfassung verändert haben.</li>
                  <li>Distanz-, Höhen- und Zeitangaben sind Näherungswerte.</li>
                  <li>Schwierigkeitsbewertungen sind subjektiv.</li>
                  <li>GPS-Koordinaten und Routen können technische Ungenauigkeiten enthalten.</li>
                </ul>
              </div>
            </section>

            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                3. Haftung
              </h2>
              <div className="space-y-3 text-sm md:text-base text-stone-600 leading-relaxed">
                <p>
                  Der Betreiber dieser Plattform übernimmt keine Gewähr für die Richtigkeit, Vollständigkeit oder ständige Verfügbarkeit aller Tourenangaben.
                </p>
                <p>
                  Eine Haftung für Schäden im Zusammenhang mit der Nutzung der App ist – soweit gesetzlich zulässig – auf Vorsatz und grobe Fahrlässigkeit beschränkt.
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Unfälle auf Wanderwegen</li>
                  <li>Orientierungsfehler oder Fehleinschätzungen vor Ort</li>
                  <li>Wetterumschwünge, Naturgefahren oder Sperrungen</li>
                  <li>Verletzungen oder Schäden an Hunden</li>
                </ul>
              </div>
            </section>

            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-slate-600" />
                4. Eigenverantwortung der Nutzer
              </h2>
              <div className="space-y-3 text-sm md:text-base text-stone-600 leading-relaxed">
                <p>
                  Jeder Nutzer trägt die alleinige Verantwortung für Entscheidungen beim Wandern.
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Einschätzung der eigenen Fitness und der des Hundes</li>
                  <li>Wahl einer geeigneten Tour</li>
                  <li>Mitführen angemessener Ausrüstung</li>
                  <li>Einhaltung lokaler Vorschriften</li>
                  <li>Abbruch einer Tour bei unsicheren Bedingungen</li>
                </ul>
              </div>
            </section>

            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-3 flex items-center gap-2">
                <PawPrint className="w-5 h-5 text-slate-600" />
                5. Kein Ersatz für alpine Erfahrung
              </h2>
              <div className="space-y-3 text-sm md:text-base text-stone-600 leading-relaxed">
                <p>
                  Das Wandern im Alpenraum erfordert alpine Grundkenntnisse und Erfahrung. Diese App ersetzt diese Erfahrung nicht.
                </p>
              </div>
            </section>

            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-3 flex items-center gap-2">
                <CloudRain className="w-5 h-5 text-slate-600" />
                6. Wetter- & Gefahrenhinweise
              </h2>
              <div className="space-y-3 text-sm md:text-base text-stone-600 leading-relaxed">
                <p>
                  Das Bergwetter in Südtirol kann sich innerhalb von Minuten drastisch ändern.
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Prüfe immer die aktuelle Wettervorhersage vor dem Start.</li>
                  <li>Achte auf Lawinenbulletins im Winter und Frühling.</li>
                  <li>Schütze deinen Hund vor Hitze, Eis und Absturzgefahren.</li>
                </ul>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-3">
                  <p className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4" /> Im Notfall
                  </p>
                  <p className="text-red-700 text-sm">Euronotruf: <strong>112</strong></p>
                </div>
              </div>
            </section>

            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-slate-600" />
                7. Moderation & Veröffentlichung
              </h2>
              <div className="space-y-3 text-sm md:text-base text-stone-600 leading-relaxed">
                <p>
                  Der Betreiber behält sich das Recht vor, eingereichte Inhalte zu prüfen und bei Rechtsverstößen,
                  Gefährdungen oder Regelverstößen zu entfernen.
                </p>
              </div>
            </section>

            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-600" />
                8. Urheberrecht & Rechteübertragung bei Fotos
              </h2>
              <div className="space-y-3 text-sm md:text-base text-stone-600 leading-relaxed">
                <p>
                  Mit dem Hochladen von Fotos bestätigt der Nutzer, dass er die erforderlichen Rechte besitzt.
                </p>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-2">
                  <p className="text-red-800 text-sm">
                    <strong>Haftung bei Rechtsverletzungen:</strong> Wer Fotos hochlädt, die Rechte Dritter verletzen, ist für diese Inhalte selbst verantwortlich und stellt den Betreiber im Rahmen der gesetzlichen Möglichkeiten von daraus entstehenden Ansprüchen Dritter frei.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
