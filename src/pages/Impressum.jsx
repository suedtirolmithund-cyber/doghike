import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Building2, Mail, Globe } from "lucide-react";
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
            {/* Angaben gemäß § 5 TMG */}
            <section>
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4">
                Angaben gemäß § 5 TMG
              </h2>
              <div className="space-y-3 text-sm md:text-base text-stone-600">
                <p className="font-medium text-stone-800">Julia Schwärzer</p>
                <p>Südtirol, Italien</p>
                <p>
                  <a href="https://www.mithundenunterwegsinsuedtirol.it" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
                    www.mithundenunterwegsinsuedtirol.it
                  </a>
                </p>
                <p>
                  App:{" "}
                  <a href="https://doghike-suedtirol.vercel.app" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
                    doghike-suedtirol.vercel.app
                  </a>
                </p>
              </div>
            </section>

            {/* Kontakt */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4">
                Kontakt
              </h2>
              <div className="space-y-3 text-sm md:text-base text-stone-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <a href="mailto:suedtirolmithund@gmail.com" className="text-blue-600 underline hover:text-blue-800">
                    suedtirolmithund@gmail.com
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <a href="https://www.mithundenunterwegsinsuedtirol.it" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
                    www.mithundenunterwegsinsuedtirol.it
                  </a>
                </div>
              </div>
            </section>

            {/* Verantwortlich für den Inhalt */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4">
                Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV
              </h2>
              <div className="space-y-2 text-sm md:text-base text-stone-600">
                <p>Julia Schwärzer</p>
                <p>Südtirol, Italien</p>
              </div>
            </section>

            {/* EU-Streitschlichtung */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4">
                EU-Streitschlichtung
              </h2>
              <p className="text-sm md:text-base text-stone-600 leading-relaxed">
                Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
                <a 
                  href="https://ec.europa.eu/consumers/odr" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800"
                >
                  https://ec.europa.eu/consumers/odr
                </a>
              </p>
              <p className="text-sm md:text-base text-stone-600 leading-relaxed mt-4">
                Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer 
                Verbraucherschlichtungsstelle teilzunehmen.
              </p>
            </section>

            {/* Haftung für Inhalte */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4">
                Haftung für Inhalte
              </h2>
              <div className="space-y-4 text-sm md:text-base text-stone-600 leading-relaxed">
                <p>
                  Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen 
                  Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind 
                  wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte 
                  fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine 
                  rechtswidrige Tätigkeit hinweisen.
                </p>
                <p>
                  Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach 
                  den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung 
                  ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung 
                  möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese 
                  Inhalte umgehend entfernen.
                </p>
              </div>
            </section>

            {/* Haftung für Links */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4">
                Haftung für Links
              </h2>
              <p className="text-sm md:text-base text-stone-600 leading-relaxed">
                Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir 
                keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine 
                Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige 
                Anbieter oder Betreiber der Seiten verantwortlich.
              </p>
            </section>

            {/* Urheberrecht */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4">
                Urheberrecht
              </h2>
              <div className="space-y-4 text-sm md:text-base text-stone-600 leading-relaxed">
                <p>
                  Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten 
                  unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, 
                  Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes 
                  bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
                </p>
                <p>
                  Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden 
                  die Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als 
                  solche gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung 
                  aufmerksam werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden 
                  von Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.
                </p>
              </div>
            </section>

            {/* Kartenmaterial */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4">
                Kartenmaterial & Datenquellen
              </h2>
              <div className="space-y-3 text-sm md:text-base text-stone-600 leading-relaxed">
                <p>
                  Die in dieser App verwendeten Karten basieren auf Daten von{" "}
                  <a 
                    href="https://www.openstreetmap.org/copyright" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    OpenStreetMap
                  </a>{" "}
                  © OpenStreetMap-Mitwirkende.
                </p>
                <p>
                  Routing-Dienste werden bereitgestellt von{" "}
                  <a 
                    href="https://project-osrm.org/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    OSRM
                  </a>.
                </p>
              </div>
            </section>

            {/* Aktualisierung */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <p className="text-sm text-stone-500">
                Letzte Aktualisierung: April 2026
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}