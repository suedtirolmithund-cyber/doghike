import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, FileText, UserCheck, Image, Star, CreditCard, AlertTriangle, XCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AGB() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
        <Link to={createPageUrl("Dashboard")}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Zurück
          </Button>
        </Link>

        <div className="rounded-2xl border border-brand-100/80 bg-white/78 p-4 shadow-[0_14px_34px_rgba(192,48,96,0.08)] backdrop-blur-sm md:p-8">
          <div className="doghike-page-header mb-2">
            <div className="doghike-page-icon">
              <FileText className="h-5 w-5" />
            </div>
            <h1 className="doghike-page-title">Nutzungsbedingungen</h1>
          </div>
          <p className="text-xs text-slate-400 mb-8">
            Letzte Aktualisierung: April 2026 · Gilt für doghike-suedtirol.vercel.app
          </p>

          <div className="mb-8 rounded-2xl border border-brand-100/80 bg-white/65 p-5 text-slate-700">
            <p className="text-sm leading-relaxed">
              Mit der Registrierung oder Nutzung dieser App stimmst du diesen Nutzungsbedingungen zu.
              Lies sie bitte sorgfältig durch.
            </p>
          </div>

          <div className="space-y-6 md:space-y-8">
            <section>
              <h2 className="text-lg md:text-xl font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-600" />
                1. Betreiber & Geltungsbereich
              </h2>
              <div className="space-y-3 text-sm md:text-base text-slate-600 leading-relaxed">
                <p>
                  Diese Nutzungsbedingungen gelten für die Nutzung der Web-App
                  <strong> „DogTrails“</strong>{" "}
                  (doghike-suedtirol.vercel.app), betrieben von:
                </p>
                <div className="bg-brand-50/70 rounded-xl p-4">
                  <p className="font-semibold text-slate-900">Julia Schwärzer</p>
                  <p>Südtirol, Italien</p>
            <p>E-Mail: <a href="mailto:suedtirolmithund@gmail.com" className="text-brand-600 underline">suedtirolmithund@gmail.com</a></p>
                </div>
                <p>
                  Anwendbares Recht: Italienisches Recht und EU-Recht.
                </p>
              </div>
            </section>

            <section className="border-t border-brand-100 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-brand-600" />
                2. Nutzerkonto & Registrierung
              </h2>
              <div className="space-y-3 text-sm md:text-base text-slate-600 leading-relaxed">
                <ul className="list-disc pl-6 space-y-2">
                  <li>Die Registrierung ist kostenlos. Du brauchst eine gültige E-Mail-Adresse oder ein Google-Konto.</li>
                  <li>Du bist für die Sicherheit deines Kontos verantwortlich. Teile dein Passwort nicht.</li>
                  <li>Pro Person ist ein Konto erlaubt. Mehrfachkonten können bei Missbrauch gesperrt werden.</li>
                  <li>Du musst mindestens 16 Jahre alt sein.</li>
                  <li>Du kannst dein Konto jederzeit löschen lassen: Profil → Konto → „Konto löschen“.</li>
                </ul>
              </div>
            </section>

            <section className="border-t border-brand-100 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Image className="w-5 h-5 text-brand-600" />
                3. Nutzerinhalte (Touren, Fotos, Kommentare)
              </h2>
              <div className="space-y-3 text-sm md:text-base text-slate-600 leading-relaxed">
                <p>
                  Du kannst Wanderberichte, Fotos, Bewertungen und Kommentare hochladen.
                  Dabei gelten folgende Regeln:
                </p>
                <div className="bg-brand-50/70 rounded-xl p-4 space-y-2">
                  <p className="font-semibold text-slate-900">Du bestätigst:</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Du bist Urheber der Inhalte oder hast die notwendigen Rechte.</li>
                    <li>Auf Fotos abgebildete Personen haben der Veröffentlichung zugestimmt.</li>
                    <li>Die Inhalte sind nach bestem Wissen wahrheitsgemäß.</li>
                    <li>Du erlaubst dem Betreiber, die Inhalte im Rahmen der App anzuzeigen und zu speichern.</li>
                  </ul>
                </div>
                <div className="bg-brand-50 border border-brand-100 rounded-xl p-4">
                  <p className="font-semibold text-brand-700 mb-2">Verboten sind Inhalte, die:</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-brand-500">
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

            <section className="border-t border-brand-100 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Star className="w-5 h-5 text-brand-600" />
                4. Bewertungen & Kommentare
              </h2>
              <div className="space-y-3 text-sm md:text-base text-slate-600 leading-relaxed">
                <ul className="list-disc pl-6 space-y-2">
                  <li>Bewertungen und Kommentare müssen auf eigener Erfahrung beruhen.</li>
                  <li>Gefälschte oder gekaufte Bewertungen sind verboten.</li>
                  <li>Du kannst eigene Kommentare jederzeit löschen.</li>
                  <li>Kommentare, die gegen diese Regeln verstoßen, können entfernt werden.</li>
                </ul>
              </div>
            </section>

            <section className="border-t border-brand-100 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-brand-600" />
                5. Premium-Mitgliedschaft (falls aktiviert)
              </h2>
              <div className="space-y-3 text-sm md:text-base text-slate-600 leading-relaxed">
                <ul className="list-disc pl-6 space-y-2">
                  <li>Preise und Laufzeiten werden auf der Premium-Seite klar ausgewiesen, sobald Premium technisch aktiviert ist.</li>
                  <li>Online-Zahlungen sind derzeit noch nicht live. Sobald sie aktiviert werden, sollen Zahlungen über Stripe Inc. abgewickelt werden.</li>
                  <li>
                    <strong>Widerrufsrecht:</strong> Für digitale Leistungen gelten die jeweils einschlägigen gesetzlichen Verbraucherrechte.
                  </li>
                  <li>Kündigungs- und Laufzeitregeln werden erst mit Aktivierung eines echten Premium-Bezahlmodells verbindlich festgelegt.</li>
                  <li>Bei Missbrauch des Kontos können Premium-Funktionen gesperrt werden.</li>
                </ul>
              </div>
            </section>

            <section className="border-t border-brand-100 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-brand-300" />
                6. Verfügbarkeit & Haftung des Betreibers
              </h2>
              <div className="space-y-3 text-sm md:text-base text-slate-600 leading-relaxed">
                <ul className="list-disc pl-6 space-y-2">
                  <li>Die App wird „wie besehen" bereitgestellt. Wir übernehmen keine Garantie für ununterbrochene Verfügbarkeit.</li>
                  <li>Wartungsarbeiten können die Verfügbarkeit vorübergehend einschränken.</li>
                  <li>Wir übernehmen keine Gewähr dafür, dass alle Daten dauerhaft verfügbar bleiben. Sichere wichtige GPX-Daten zusätzlich lokal.</li>
                  <li>
                    Toureninformationen dienen nur zur Orientierung. Eine Haftung für leichte Fahrlässigkeit bei
                    unzutreffenden oder veralteten Tourangaben wird - soweit gesetzlich zulässig - ausgeschlossen.
            Details: <Link to={createPageUrl("Legal")} className="text-brand-600 underline">Rechtliche Hinweise</Link>.
                  </li>
                </ul>
              </div>
            </section>

            <section className="border-t border-brand-100 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-brand-400" />
                7. Kontensperre & Kündigung
              </h2>
              <div className="space-y-3 text-sm md:text-base text-slate-600 leading-relaxed">
                <p>Der Betreiber kann Konten sperren oder löschen, wenn:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>diese Nutzungsbedingungen verletzt werden,</li>
                  <li>Inhalte eingereicht werden, die gegen geltendes Recht verstoßen,</li>
                  <li>das Konto für Spam, Fake-Bewertungen oder Missbrauch genutzt wird.</li>
                </ul>
              </div>
            </section>

            <section className="border-t border-brand-100 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-600" />
                8. Änderungen der Nutzungsbedingungen
              </h2>
              <div className="space-y-3 text-sm md:text-base text-slate-600 leading-relaxed">
                <p>
                  Der Betreiber behält sich vor, diese Bedingungen für die Zukunft zu ändern.
                  Bei wesentlichen Änderungen werden registrierte Nutzer in geeigneter Weise informiert.
                </p>
              </div>
            </section>

            <section className="border-t border-brand-100 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Mail className="w-5 h-5 text-brand-600" />
                9. Kontakt & Beschwerden
              </h2>
          <div className="rounded-xl bg-gradient-to-br from-[#56152d] to-[#c03060] p-4 text-sm text-white shadow-[0_12px_24px_rgba(192,48,96,0.14)]">
                <p className="font-semibold mb-1">Betreiberin: Julia Schwärzer</p>
            <p className="text-brand-50">E-Mail: <a href="mailto:suedtirolmithund@gmail.com" className="text-white underline">suedtirolmithund@gmail.com</a></p>
              </div>
            </section>

            <section className="border-t border-brand-100 pt-6">
              <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                <span>Letzte Aktualisierung: April 2026</span>
                <span>·</span>
            <Link to={createPageUrl("Datenschutz")} className="text-brand-600 underline">Datenschutz</Link>
            <Link to={createPageUrl("Impressum")} className="text-brand-600 underline">Impressum</Link>
            <Link to={createPageUrl("Legal")} className="text-brand-600 underline">Rechtliche Hinweise</Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
