import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, FileText, UserCheck, Image, Star, CreditCard, AlertTriangle, XCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AGB() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-slate-50 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
        <Link to={createPageUrl("Dashboard")}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Zurück
          </Button>
        </Link>

        <div className="bg-white rounded-2xl p-4 md:p-8 border border-stone-200/50 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-6 h-6 md:w-8 md:h-8 text-slate-700" />
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800">Nutzungsbedingungen</h1>
          </div>
          <p className="text-xs text-stone-400 mb-8">
            Letzte Aktualisierung: April 2026 · Gilt für doghike-suedtirol.vercel.app
          </p>

          <div className="bg-slate-800 text-white rounded-2xl p-5 mb-8">
            <p className="text-sm leading-relaxed">
              Mit der Registrierung oder Nutzung dieser App stimmen Sie diesen Nutzungsbedingungen zu.
              Bitte lesen Sie sie sorgfältig durch.
            </p>
          </div>

          <div className="space-y-6 md:space-y-8">

            {/* 1. Betreiber */}
            <section>
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-600" />
                1. Betreiber & Geltungsbereich
              </h2>
              <div className="space-y-3 text-sm md:text-base text-stone-600 leading-relaxed">
                <p>
                  Diese Nutzungsbedingungen gelten für die Nutzung der Web-App
                  <strong>„DogHike”</strong>{" "}
                  (doghike-suedtirol.vercel.app), betrieben von:
                </p>
                <div className="bg-stone-50 rounded-xl p-4">
                  <p className="font-semibold text-stone-800">Julia Schwärzer</p>
                  <p>Südtirol, Italien</p>
                  <p>E-Mail: <a href="mailto:suedtirolmithund@gmail.com" className="text-blue-600 underline">suedtirolmithund@gmail.com</a></p>
                </div>
                <p>
                  Anwendbares Recht: Italienisches Recht und EU-Recht (insb. DSGVO, D.Lgs. 70/2003,
                  D.Lgs. 206/2005 Verbraucherschutz). Zuständiges Gericht: Bozen (BZ), Italien.
                </p>
              </div>
            </section>

            {/* 2. Nutzerkonto */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-3 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-slate-600" />
                2. Nutzerkonto & Registrierung
              </h2>
              <div className="space-y-3 text-sm md:text-base text-stone-600 leading-relaxed">
                <ul className="list-disc pl-6 space-y-2">
                  <li>Die Registrierung ist kostenlos. Sie benötigen eine gültige E-Mail-Adresse oder ein Google-Konto.</li>
                  <li>Sie sind für die Sicherheit Ihres Kontos verantwortlich. Teilen Sie Ihr Passwort nicht.</li>
                  <li>Pro Person ist ein Konto erlaubt. Mehrfachkonten können ohne Vorwarnung gesperrt werden.</li>
                  <li>Sie müssen mindestens 16 Jahre alt sein (Art. 8 DSGVO).</li>
                  <li>Sie können Ihr Konto jederzeit löschen: Profil → Konto → „Konto löschen".</li>
                </ul>
              </div>
            </section>

            {/* 3. Nutzerinhalte */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-3 flex items-center gap-2">
                <Image className="w-5 h-5 text-slate-600" />
                3. Nutzerinhalte (Touren, Fotos, Kommentare)
              </h2>
              <div className="space-y-3 text-sm md:text-base text-stone-600 leading-relaxed">
                <p>
                  Sie können Wanderberichte, Fotos, Bewertungen und Kommentare hochladen.
                  Dabei gelten folgende Regeln:
                </p>
                <div className="bg-stone-50 rounded-xl p-4 space-y-2">
                  <p className="font-semibold text-stone-800">Sie bestätigen:</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Sie sind der Urheber der Inhalte oder haben die notwendigen Rechte.</li>
                    <li>Auf Fotos abgebildete Personen haben der Veröffentlichung zugestimmt.</li>
                    <li>Die Inhalte sind wahrheitsgemäß und schaden niemanden.</li>
                    <li>Sie räumen dem Betreiber das nicht-exklusive, kostenlose Recht ein, die Inhalte im Rahmen der App anzuzeigen und zu speichern.</li>
                  </ul>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="font-semibold text-red-800 mb-2">Verboten sind Inhalte die:</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-red-700">
                    <li>falsch, irreführend oder gefährlich für andere Wanderer sind,</li>
                    <li>Urheberrechte, Markenrechte oder Persönlichkeitsrechte Dritter verletzen,</li>
                    <li>beleidigend, diskriminierend, rechtswidrig oder pornografisch sind,</li>
                    <li>Werbung, Spam oder kommerzielle Angebote enthalten,</li>
                    <li>persönliche Daten Dritter ohne deren Zustimmung veröffentlichen.</li>
                  </ul>
                </div>
                <p>
                  Der Betreiber behält sich vor, regelwidrige Inhalte ohne Vorankündigung zu löschen
                  und das entsprechende Konto zu sperren.
                  <strong> Es besteht kein Anspruch auf Veröffentlichung eingereichten Inhalts.</strong>
                </p>
              </div>
            </section>

            {/* 4. Bewertungen */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-3 flex items-center gap-2">
                <Star className="w-5 h-5 text-slate-600" />
                4. Bewertungen & Kommentare
              </h2>
              <div className="space-y-3 text-sm md:text-base text-stone-600 leading-relaxed">
                <ul className="list-disc pl-6 space-y-2">
                  <li>Bewertungen und Kommentare müssen auf eigener Erfahrung beruhen.</li>
                  <li>Gefälschte oder gekaufte Bewertungen sind verboten.</li>
                  <li>Sie können eigene Kommentare jederzeit löschen.</li>
                  <li>Kommentare, die gegen diese Regeln verstoßen, werden ohne Vorankündigung entfernt.</li>
                </ul>
              </div>
            </section>

            {/* 5. Premium */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-3 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-slate-600" />
                5. Premium-Mitgliedschaft (falls aktiv)
              </h2>
              <div className="space-y-3 text-sm md:text-base text-stone-600 leading-relaxed">
                <ul className="list-disc pl-6 space-y-2">
                  <li>Preise und Laufzeiten werden auf der Premium-Seite klar ausgewiesen.</li>
                  <li>Zahlungen werden über Stripe Inc. (PCI DSS Level 1) abgewickelt.</li>
                  <li>
                    <strong>Widerrufsrecht (EU/IT):</strong> Sie haben das Recht, einen digitalen
                    Kauf innerhalb von 14 Tagen ohne Angabe von Gründen zu widerrufen
                    (Art. 49 D.Lgs. 206/2005 / EU-Verbraucherrechterichtlinie 2011/83/EU),
                    sofern Sie nicht explizit auf dieses Recht verzichtet haben.
                  </li>
                  <li>Kündigung: Premium kann jederzeit zum Ende der Laufzeit gekündigt werden.</li>
                  <li>Bei Missbrauch des Kontos (Verstoß gegen §3) kann Premium ohne Erstattung entzogen werden.</li>
                </ul>
              </div>
            </section>

            {/* 6. Verfügbarkeit */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                6. Verfügbarkeit & Haftung des Betreibers
              </h2>
              <div className="space-y-3 text-sm md:text-base text-stone-600 leading-relaxed">
                <ul className="list-disc pl-6 space-y-2">
                  <li>Die App wird „wie besehen" bereitgestellt. Wir übernehmen keine Garantie für ununterbrochene Verfügbarkeit.</li>
                  <li>Wartungsarbeiten können die Verfügbarkeit vorübergehend einschränken.</li>
                  <li>Wir haften nicht für Datenverluste, die durch technische Fehler entstehen. Bitte sichern Sie wichtige GPX-Daten lokal.</li>
                  <li>
                    Die Haftung für Unfälle, Verletzungen oder Schäden beim Wandern ist vollständig ausgeschlossen.
                    Alle Toureninformationen dienen nur zur Orientierung.
                    Details: <Link to={createPageUrl("Legal")} className="text-blue-600 underline">Rechtliche Hinweise</Link>.
                  </li>
                </ul>
              </div>
            </section>

            {/* 7. Sperrung */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-3 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                7. Kontensperre & Kündigung
              </h2>
              <div className="space-y-3 text-sm md:text-base text-stone-600 leading-relaxed">
                <p>Der Betreiber kann Konten sperren oder löschen, wenn:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>diese Nutzungsbedingungen verletzt werden,</li>
                  <li>Inhalte eingereicht werden, die gegen geltendes Recht verstoßen,</li>
                  <li>das Konto für Spam, Fake-Bewertungen oder Missbrauch genutzt wird.</li>
                </ul>
                <p>
                  Bei einer Sperrung werden Sie per E-Mail informiert.
                  Einsprüche können innerhalb von 14 Tagen an{" "}
                  <a href="mailto:suedtirolmithund@gmail.com" className="text-blue-600 underline">suedtirolmithund@gmail.com</a>{" "}
                  gerichtet werden.
                </p>
              </div>
            </section>

            {/* 8. Änderungen */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-600" />
                8. Änderungen der Nutzungsbedingungen
              </h2>
              <div className="space-y-3 text-sm md:text-base text-stone-600 leading-relaxed">
                <p>
                  Der Betreiber behält sich vor, diese Bedingungen jederzeit zu ändern.
                  Bei wesentlichen Änderungen werden registrierte Nutzer per E-Mail informiert
                  (mindestens 14 Tage vor Inkrafttreten). Die fortgesetzte Nutzung nach
                  Inkrafttreten gilt als Zustimmung.
                </p>
              </div>
            </section>

            {/* 9. Kontakt */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-3 flex items-center gap-2">
                <Mail className="w-5 h-5 text-slate-600" />
                9. Kontakt & Beschwerden
              </h2>
              <div className="bg-slate-800 text-white rounded-xl p-4 text-sm">
                <p className="font-semibold mb-1">Betreiberin: Julia Schwärzer</p>
                <p className="text-slate-300">E-Mail: <a href="mailto:suedtirolmithund@gmail.com" className="text-brand-400 underline">suedtirolmithund@gmail.com</a></p>
                <p className="text-slate-300 mt-1">Antwort innerhalb von 30 Werktagen.</p>
              </div>
            </section>

            <section className="border-t border-stone-200 pt-6">
              <div className="flex flex-wrap gap-4 text-xs text-stone-400">
                <span>Letzte Aktualisierung: April 2026</span>
                <span>·</span>
                <Link to={createPageUrl("Datenschutz")} className="text-blue-500 underline">Datenschutz</Link>
                <Link to={createPageUrl("Impressum")} className="text-blue-500 underline">Impressum</Link>
                <Link to={createPageUrl("Legal")} className="text-blue-500 underline">Rechtliche Hinweise</Link>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
