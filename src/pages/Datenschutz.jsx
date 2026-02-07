import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Shield, Lock, Eye, Database, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Datenschutz() {
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
            <Shield className="w-6 h-6 md:w-8 md:h-8 text-slate-700" />
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800">Datenschutzerklärung</h1>
          </div>

          <div className="space-y-6 md:space-y-8">
            {/* Einleitung */}
            <section>
              <p className="text-sm md:text-base text-stone-600 leading-relaxed">
                Der Schutz Ihrer persönlichen Daten ist uns ein besonderes Anliegen. Wir verarbeiten 
                Ihre Daten daher ausschließlich auf Grundlage der gesetzlichen Bestimmungen 
                (DSGVO, TKG 2003). In dieser Datenschutzerklärung informieren wir Sie über die 
                wichtigsten Aspekte der Datenverarbeitung im Rahmen unserer App.
              </p>
            </section>

            {/* Verantwortlicher */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Verantwortlicher
              </h2>
              <div className="space-y-2 text-sm md:text-base text-stone-600">
                <p>[Name des Betreibers]</p>
                <p>[Adresse]</p>
                <p>E-Mail: [kontakt@beispiel.de]</p>
              </div>
            </section>

            {/* Datenerfassung */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4 flex items-center gap-2">
                <Database className="w-5 h-5" />
                Welche Daten erfassen wir?
              </h2>
              <div className="space-y-4 text-sm md:text-base text-stone-600 leading-relaxed">
                <div>
                  <p className="font-medium text-stone-800 mb-2">Bei der Registrierung:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Name</li>
                    <li>E-Mail-Adresse</li>
                    <li>Passwort (verschlüsselt gespeichert)</li>
                  </ul>
                </div>

                <div>
                  <p className="font-medium text-stone-800 mb-2">Bei der Nutzung der App:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Hochgeladene Wanderungen und Routendaten (GPS-Koordinaten, Fotos, Beschreibungen)</li>
                    <li>Informationen über Ihre Hunde (Name, Rasse, Fotos - optional)</li>
                    <li>Kommentare und Bewertungen</li>
                    <li>Interaktionen mit anderen Nutzern (Freundschaftsanfragen, Likes)</li>
                    <li>Datum und Uhrzeit der Erstellung/Aktualisierung von Inhalten</li>
                  </ul>
                </div>

                <div>
                  <p className="font-medium text-stone-800 mb-2">Automatisch erfasste Daten:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Technische Informationen (Browsertyp, Betriebssystem, IP-Adresse)</li>
                    <li>Zugriffszeitpunkte</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Zweck der Datenverarbeitung */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Zweck der Datenverarbeitung
              </h2>
              <div className="space-y-3 text-sm md:text-base text-stone-600 leading-relaxed">
                <p>Wir verarbeiten Ihre Daten zu folgenden Zwecken:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Bereitstellung und Verwaltung Ihres Benutzerkontos</li>
                  <li>Ermöglichung der Nutzung aller App-Funktionen (Wanderungen dokumentieren, teilen, planen)</li>
                  <li>Verbesserung der Benutzerfreundlichkeit und App-Funktionalität</li>
                  <li>Kommunikation mit Ihnen (Benachrichtigungen, wichtige Mitteilungen)</li>
                  <li>Gewährleistung der Sicherheit und Integrität der Plattform</li>
                  <li>Erfüllung rechtlicher Verpflichtungen</li>
                </ul>
              </div>
            </section>

            {/* Rechtsgrundlage */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4">
                Rechtsgrundlage
              </h2>
              <div className="space-y-3 text-sm md:text-base text-stone-600 leading-relaxed">
                <p>Die Verarbeitung Ihrer personenbezogenen Daten erfolgt auf Grundlage von:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung): Zur Bereitstellung der App-Dienste</li>
                  <li>Art. 6 Abs. 1 lit. a DSGVO (Einwilligung): Wenn Sie optionale Funktionen nutzen</li>
                  <li>Art. 6 Abs. 1 lit. f DSGVO (Berechtigtes Interesse): Zur Verbesserung und Sicherheit der App</li>
                </ul>
              </div>
            </section>

            {/* Datenweitergabe */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Datenweitergabe
              </h2>
              <div className="space-y-3 text-sm md:text-base text-stone-600 leading-relaxed">
                <p>
                  Wir geben Ihre persönlichen Daten nicht an Dritte weiter, außer:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Sie haben ausdrücklich eingewilligt (Art. 6 Abs. 1 lit. a DSGVO)</li>
                  <li>Es besteht eine gesetzliche Verpflichtung (Art. 6 Abs. 1 lit. c DSGVO)</li>
                  <li>Die Weitergabe ist zur Durchsetzung unserer Rechte erforderlich</li>
                </ul>
                <p className="mt-4">
                  <strong>Hosting & Infrastruktur:</strong> Die App wird auf der Base44-Plattform gehostet. 
                  Die Daten werden in sicheren Rechenzentren in der EU gespeichert.
                </p>
                <p>
                  <strong>Kartendienste:</strong> Wir nutzen OpenStreetMap zur Darstellung von Karten. 
                  Dabei können Ihre IP-Adresse und Standortdaten übermittelt werden.
                </p>
              </div>
            </section>

            {/* Speicherdauer */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4">
                Speicherdauer
              </h2>
              <p className="text-sm md:text-base text-stone-600 leading-relaxed">
                Wir speichern Ihre personenbezogenen Daten nur so lange, wie dies für die 
                Erfüllung der Zwecke erforderlich ist oder gesetzliche Aufbewahrungsfristen 
                bestehen. Nach Löschung Ihres Kontos werden Ihre Daten anonymisiert oder gelöscht, 
                sofern keine rechtlichen Gründe einer Löschung entgegenstehen.
              </p>
            </section>

            {/* Ihre Rechte */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4">
                Ihre Rechte
              </h2>
              <div className="space-y-3 text-sm md:text-base text-stone-600 leading-relaxed">
                <p>Sie haben folgende Rechte bezüglich Ihrer personenbezogenen Daten:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Auskunft:</strong> Sie können Auskunft über Ihre gespeicherten Daten verlangen (Art. 15 DSGVO)</li>
                  <li><strong>Berichtigung:</strong> Sie können die Berichtigung unrichtiger Daten verlangen (Art. 16 DSGVO)</li>
                  <li><strong>Löschung:</strong> Sie können die Löschung Ihrer Daten verlangen (Art. 17 DSGVO)</li>
                  <li><strong>Einschränkung:</strong> Sie können die Einschränkung der Verarbeitung verlangen (Art. 18 DSGVO)</li>
                  <li><strong>Datenübertragbarkeit:</strong> Sie können Ihre Daten in einem strukturierten Format erhalten (Art. 20 DSGVO)</li>
                  <li><strong>Widerspruch:</strong> Sie können der Verarbeitung widersprechen (Art. 21 DSGVO)</li>
                  <li><strong>Beschwerde:</strong> Sie können Beschwerde bei einer Aufsichtsbehörde einlegen</li>
                </ul>
                <p className="mt-4 font-medium text-stone-800">
                  Zur Ausübung Ihrer Rechte kontaktieren Sie uns bitte unter: [kontakt@beispiel.de]
                </p>
              </div>
            </section>

            {/* Sicherheit */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Datensicherheit
              </h2>
              <p className="text-sm md:text-base text-stone-600 leading-relaxed">
                Wir verwenden geeignete technische und organisatorische Sicherheitsmaßnahmen, 
                um Ihre Daten gegen zufällige oder vorsätzliche Manipulationen, Verlust, 
                Zerstörung oder den Zugriff unberechtigter Personen zu schützen. Dazu gehören:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3 text-sm md:text-base text-stone-600">
                <li>SSL/TLS-Verschlüsselung für alle Datenübertragungen</li>
                <li>Verschlüsselte Speicherung sensibler Daten</li>
                <li>Regelmäßige Sicherheitsupdates</li>
                <li>Zugriffsbeschränkungen und Authentifizierung</li>
              </ul>
            </section>

            {/* Öffentliche Inhalte */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4">
                Öffentliche Inhalte
              </h2>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-blue-800 text-sm md:text-base leading-relaxed">
                  <strong>Wichtig:</strong> Wanderungen, die Sie als "öffentlich" markieren, sowie 
                  zugehörige Fotos und Beschreibungen sind für alle Nutzer sichtbar. Achten Sie 
                  darauf, keine sensiblen persönlichen Informationen in öffentlichen Beiträgen zu teilen.
                </p>
              </div>
            </section>

            {/* Cookies */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4">
                Cookies & lokale Speicherung
              </h2>
              <p className="text-sm md:text-base text-stone-600 leading-relaxed">
                Die App verwendet lokale Speichertechnologien (Local Storage) für technisch 
                notwendige Funktionen wie die Aufrechterhaltung Ihrer Anmeldung. Diese Daten 
                werden nur lokal in Ihrem Browser gespeichert und nicht an Server übertragen.
              </p>
            </section>

            {/* Änderungen */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4">
                Änderungen dieser Datenschutzerklärung
              </h2>
              <p className="text-sm md:text-base text-stone-600 leading-relaxed">
                Wir behalten uns vor, diese Datenschutzerklärung gelegentlich anzupassen, 
                damit sie stets den aktuellen rechtlichen Anforderungen entspricht oder um 
                Änderungen unserer Leistungen umzusetzen. Für Ihren erneuten Besuch gilt 
                dann die neue Datenschutzerklärung.
              </p>
              <p className="text-sm text-stone-500 mt-4">
                Letzte Aktualisierung: Februar 2026
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}