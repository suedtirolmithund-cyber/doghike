import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Building2, Mail, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Impressum() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-[#edf7ff] pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
        <Link to={createPageUrl("Dashboard")}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
        </Link>

        <div className="rounded-2xl border border-stone-200/70 bg-white/70 p-4 shadow-[0_14px_34px_rgba(92,62,42,0.1)] backdrop-blur-sm md:p-8">
          <div className="doghike-page-header mb-6">
            <div className="doghike-page-icon">
              <Building2 className="h-5 w-5" />
            </div>
            <h1 className="doghike-page-title">Impressum</h1>
          </div>

          <div className="space-y-6 md:space-y-8">
            <section>
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4">
                Angaben gemäß D.Lgs. 70/2003 und Art. 13 DSGVO
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
                <p className="text-xs text-amber-700 pt-2">
                  Hinweis: Für eine vollständige Anbieterkennzeichnung sollte hier eine vollständige geografische Postanschrift angegeben werden.
                </p>
              </div>
            </section>

            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4">Kontakt</h2>
              <div className="space-y-3 text-sm md:text-base text-stone-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 shrink-0" />
                  <a href="mailto:suedtirolmithund@gmail.com" className="text-brand-600 underline hover:text-brand-700">
                    suedtirolmithund@gmail.com
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 shrink-0" />
                  <a href="https://www.mithundenunterwegsinsuedtirol.it" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline hover:text-brand-700">
                    www.mithundenunterwegsinsuedtirol.it
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 shrink-0" />
                  <a href="https://doghike-suedtirol.vercel.app" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline hover:text-brand-700">
                    doghike-suedtirol.vercel.app
                  </a>
                </div>
              </div>
            </section>

            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4">
                Verantwortliche Person (Art. 4 Abs. 7 DSGVO)
              </h2>
              <div className="space-y-1 text-sm md:text-base text-stone-600">
                <p>Julia Schwärzer</p>
                <p>Südtirol, Italien</p>
                <p>E-Mail: <a href="mailto:suedtirolmithund@gmail.com" className="text-brand-600 underline">suedtirolmithund@gmail.com</a></p>
              </div>
            </section>

            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4">
                Verbraucherstreitbeilegung
              </h2>
              <p className="text-sm md:text-base text-stone-600 leading-relaxed">
                Wir sind nicht verpflichtet und nicht bereit, an einem Streitbeilegungsverfahren
                vor einer Verbraucherschlichtungsstelle teilzunehmen.
              </p>
            </section>

            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4">
                Haftung für Inhalte
              </h2>
              <div className="space-y-3 text-sm md:text-base text-stone-600 leading-relaxed">
                <p>
                  Als Diensteanbieter sind wir für eigene Inhalte nach den allgemeinen
                  Gesetzen verantwortlich. Wir sind jedoch nicht verpflichtet, übermittelte
                  oder gespeicherte fremde Informationen allgemein zu überwachen.
                </p>
              </div>
            </section>

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

            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4">
                Urheberrecht
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

            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4">
                Kartenmaterial & Datenquellen
              </h2>
              <div className="space-y-2 text-sm md:text-base text-stone-600">
                <p>
                  Kartenkacheln:{" "}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">
                    OpenStreetMap
                  </a>{" "}
                  sowie{" "}
          <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">
                    CARTO
                  </a>.
                </p>
                <p>
                  Routing & Höhenprofile:{" "}
          <a href="https://brouter.de/brouter-web/" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">
                    BRouter
                  </a>{" "}
                  (primär) und{" "}
          <a href="https://www.graphhopper.com" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">
                    GraphHopper GmbH
                  </a>{" "}
                  (technischer Fallback). Ortsnamensuche:{" "}
          <a href="https://nominatim.org" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">
                    Nominatim / OpenStreetMap
                  </a>.
                </p>
                <p>
                  Wetterdaten:{" "}
          <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">
                    Open-Meteo
                  </a>.
                </p>
                <p>
                  Authentifizierung: Google Sign-In über{" "}
          <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">
                    Supabase Auth
                  </a>.
                </p>
                <p>
                  Hosting:{" "}
          <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">
                    Vercel Inc.
                  </a>
                  .
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
