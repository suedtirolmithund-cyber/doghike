import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Building2, Mail, Globe, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Impressum() {
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
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-6 h-6 md:w-8 md:h-8 text-slate-700" />
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800">Impressum</h1>
          </div>

          <div className="space-y-6 md:space-y-8">

            {/* Betreiber */}
            <section>
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4">
                Angaben gemäß D.Lgs. 70/2003 (E-Commerce) und Art. 13 DSGVO
              </h2>
              <div className="bg-stone-50 rounded-xl p-4 space-y-2 text-sm md:text-base text-stone-600">
                <p className="font-semibold text-stone-800">Julia Schwärzer</p>
                <p>Südtirol (Trentino-Südtirol / Alto Adige), Italien</p>
                <p>
                  <strong>Codice Fiscale:</strong>{" "}
                  <span className="text-stone-400 italic">auf Anfrage per E-Mail</span>
                </p>
                <p>
                  <strong>Partita IVA:</strong>{" "}
                  <span className="text-stone-400 italic">nicht vorhanden (privater Betrieb ohne gewerbliche Tätigkeit)</span>
                </p>
              </div>
            </section>

            {/* Kontakt */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4">Kontakt</h2>
              <div className="space-y-3 text-sm md:text-base text-stone-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 shrink-0" />
                  <a href="mailto:suedtirolmithund@gmail.com" className="text-blue-600 underline hover:text-blue-800">
                    suedtirolmithund@gmail.com
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 shrink-0" />
                  <a href="https://www.mithundenunterwegsinsuedtirol.it" target="_blank" rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-800">
                    www.mithundenunterwegsinsuedtirol.it
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 shrink-0" />
                  <a href="https://doghike-suedtirol.vercel.app" target="_blank" rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-800">
                    doghike-suedtirol.vercel.app
                  </a>
                </div>
                <p className="text-xs text-stone-400 pt-1">
                  Anfragen werden innerhalb von 30 Tagen beantwortet (Art. 12 DSGVO).
                </p>
              </div>
            </section>

            {/* Verantwortlich */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4">
                Verantwortliche Person (Art. 4 Abs. 7 DSGVO / Titolare del trattamento)
              </h2>
              <div className="space-y-1 text-sm md:text-base text-stone-600">
                <p>Julia Schwärzer</p>
                <p>Südtirol, Italien</p>
                <p>E-Mail: <a href="mailto:suedtirolmithund@gmail.com" className="text-blue-600 underline">suedtirolmithund@gmail.com</a></p>
              </div>
            </section>

            {/* EU-Streitschlichtung */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4">
                EU-Online-Streitbeilegung (ODR)
              </h2>
              <p className="text-sm md:text-base text-stone-600 leading-relaxed">
                Gemäß Art. 14 Abs. 1 EU-Verordnung 524/2013: Die Europäische Kommission stellt
                eine Plattform zur Online-Streitbeilegung bereit:{" "}
                <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800">
                  https://ec.europa.eu/consumers/odr
                </a>
              </p>
              <p className="text-sm md:text-base text-stone-600 leading-relaxed mt-3">
                Wir sind nicht verpflichtet und nicht bereit, an einem Streitbeilegungsverfahren
                vor einer Verbraucherschlichtungsstelle teilzunehmen.
              </p>
            </section>

            {/* Haftung Inhalte */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4">
                Haftung für Inhalte (D.Lgs. 70/2003, Art. 14–17)
              </h2>
              <div className="space-y-3 text-sm md:text-base text-stone-600 leading-relaxed">
                <p>
                  Als Diensteanbieter sind wir für eigene Inhalte nach den allgemeinen
                  Gesetzen verantwortlich. Wir sind jedoch nicht verpflichtet, übermittelte
                  oder gespeicherte fremde Informationen zu überwachen. Bei Kenntnis einer
                  konkreten Rechtsverletzung werden die betreffenden Inhalte umgehend entfernt.
                </p>
              </div>
            </section>

            {/* Haftung Links */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4">
                Haftung für externe Links
              </h2>
              <p className="text-sm md:text-base text-stone-600 leading-relaxed">
                Unser Angebot enthält Links zu externen Websites. Für deren Inhalte ist
                stets der jeweilige Betreiber verantwortlich. Rechtswidrige Inhalte waren
                zum Zeitpunkt der Verlinkung nicht erkennbar.
              </p>
            </section>

            {/* Urheberrecht */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4">
                Urheberrecht (Legge n. 633/1941 + EU-Urheberrechtsrichtlinie 2019/790)
              </h2>
              <div className="space-y-3 text-sm md:text-base text-stone-600 leading-relaxed">
                <p>
                  Die durch den Betreiber erstellten Inhalte unterliegen dem
                  italienischen und europäischen Urheberrecht. Jede Verwendung
                  außerhalb der gesetzlichen Grenzen bedarf der schriftlichen Zustimmung.
                </p>
                <p>
                  Inhalte Dritter sind als solche gekennzeichnet. Bei Kenntnis einer
                  Urheberrechtsverletzung werden diese Inhalte umgehend entfernt.
                </p>
              </div>
            </section>

            {/* Kartenmaterial */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4">
                Kartenmaterial & Datenquellen
              </h2>
              <div className="space-y-2 text-sm md:text-base text-stone-600">
                <p>
                  Kartenkacheln:{" "}
                  <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer"
                    className="text-blue-600 underline">OpenStreetMap</a>{" "}
                  © OpenStreetMap-Mitwirkende (ODbL) sowie{" "}
                  <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer"
                    className="text-blue-600 underline">CARTO</a>.
                </p>
                <p>
                  Routing & Höhenprofile:{" "}
                  <a href="https://www.graphhopper.com" target="_blank" rel="noopener noreferrer"
                    className="text-blue-600 underline">GraphHopper GmbH</a>{" "}
                  (primär) und{" "}
                  <a href="https://project-osrm.org/" target="_blank" rel="noopener noreferrer"
                    className="text-blue-600 underline">OSRM</a>{" "}
                  (Fallback). Ortsnamensuche:{" "}
                  <a href="https://nominatim.org" target="_blank" rel="noopener noreferrer"
                    className="text-blue-600 underline">Nominatim / OpenStreetMap</a>.
                </p>
                <p>
                  Wetterdaten:{" "}
                  <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer"
                    className="text-blue-600 underline">Open-Meteo</a>{" "}
                  (Open-Source, EU-Server, keine Tracker).
                </p>
                <p>
                  Authentifizierung: Google Sign-In über{" "}
                  <a href="https://supabase.com" target="_blank" rel="noopener noreferrer"
                    className="text-blue-600 underline">Supabase Auth</a>.
                </p>
                <p>
                  Hosting:{" "}
                  <a href="https://vercel.com" target="_blank" rel="noopener noreferrer"
                    className="text-blue-600 underline">Vercel Inc.</a>
                  , San Francisco, CA, USA — mit EU-Edge-Nodes.
                </p>
              </div>
            </section>

            <section className="border-t border-stone-200 pt-6">
              <p className="text-xs text-stone-400">Letzte Aktualisierung: April 2026</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
