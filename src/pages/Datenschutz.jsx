import { createPageUrl } from "@/utils";
import { Shield, Lock, Eye, Database, Building2, Clock, Users, Share2 } from "lucide-react";
import BackButton from "@/components/ui/BackButton";

export default function Datenschutz() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
        <BackButton to={createPageUrl("Dashboard")} className="mb-6" />

        <div className="rounded-2xl border border-brand-100/80 bg-white/78 p-4 shadow-[0_14px_34px_rgba(168,0,60,0.08)] backdrop-blur-sm md:p-8">
          <div className="doghike-page-header mb-2">
            <div className="doghike-page-icon">
              <Shield className="h-5 w-5" />
            </div>
            <h1 className="doghike-page-title">Datenschutzerklärung</h1>
          </div>
          <p className="text-xs text-slate-400 mb-8">Letzte Aktualisierung: Mai 2026</p>

          <div className="space-y-6 md:space-y-8">
            <section>
              <p className="text-sm md:text-base text-slate-600 leading-relaxed">
                Der Schutz deiner persönlichen Daten ist dem Betreiber wichtig. Personenbezogene Daten werden
                ausschließlich auf Grundlage der EU-Datenschutz-Grundverordnung (DSGVO / Verordnung (EU) 2016/679)
                sowie des italienischen Datenschutzgesetzes (D.Lgs. 196/2003 in der geänderten Fassung) verarbeitet.
                Diese Erklärung informiert dich darüber, welche Daten erhoben werden, zu welchem Zweck, wer Zugriff hat
                und welche Rechte dir zustehen (Art. 13 DSGVO).
              </p>
            </section>

            <section className="border-t border-brand-100 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Verantwortlicher (Titolare del trattamento)
              </h2>
              <div className="space-y-2 text-sm md:text-base text-slate-600 bg-brand-50/70 rounded-xl p-4">
                <p><strong>Julia Schwärzer</strong></p>
                <p>Kienerdorfweg 18, 39030 Kiens (BZ), Italien</p>
                <p>E-Mail: <a href="mailto:suedtirolmithund@gmail.com" className="text-brand-600 underline"><strong>suedtirolmithund@gmail.com</strong></a></p>
                <p>App: <a href="https://doghike-suedtirol.vercel.app" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">doghike-suedtirol.vercel.app</a></p>
                <p className="text-xs text-slate-400 pt-1">Ein Datenschutzbeauftragter ist gemäß Art. 37 DSGVO nicht bestellt, da die gesetzlichen Voraussetzungen nicht erfüllt sind.</p>
              </div>
            </section>

            <section className="border-t border-brand-100 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Database className="w-5 h-5" />
                1. Welche Daten wir speichern
              </h2>
              <div className="space-y-4 text-sm md:text-base text-slate-600 leading-relaxed">
                <div className="bg-brand-50/70 rounded-xl p-4">
                  <p className="font-medium text-slate-900 mb-2">Bei der Registrierung:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>E-Mail-Adresse</strong> (Pflichtfeld)</li>
                    <li><strong>Passwort</strong> (verschlüsselt gehasht, nie im Klartext gespeichert)</li>
                    <li><strong>Anzeigename</strong> (optional, von dir frei wählbar)</li>
                    <li><strong>Zeitpunkt der Registrierung</strong> und Zustimmung zur Datenschutzerklärung</li>
                  </ul>
                </div>

                <div className="bg-brand-50/70 rounded-xl p-4">
                  <p className="font-medium text-slate-900 mb-2">Bei der Nutzung der App:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Wanderungsdaten:</strong> Trailname, Ort, Datum, Distanz, Höhenmeter, Dauer, Schwierigkeit, Saison, Wasserverfügbarkeit, Notizen, Parkplatzinfos</li>
                    <li><strong>GPS-Koordinaten:</strong> Startpunkt und optionale Routenpunkte, die du selbst eingibst oder aufzeichnest</li>
                    <li><strong>Fotos:</strong> Von dir hochgeladene Bilder. Beim Upload bestätigst du, dass du die Nutzungsrechte besitzt.</li>
                    <li><strong>Hundeprofil:</strong> Name, Rasse, Geburtsdatum, Foto (alles freiwillig)</li>
                    <li><strong>Soziale Daten:</strong> Kommentare, Bewertungen (1-5 Sterne), Freundschaftsanfragen</li>
                  </ul>
                </div>

                <div className="bg-brand-50/70 rounded-xl p-4">
                  <p className="font-medium text-slate-900 mb-2">Technische Daten (automatisch):</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Session-Token und technisch notwendige Browser-Speicher-Einträge</li>
                    <li>IP-Adresse (wird von Vercel- und Supabase-Infrastruktur protokolliert)</li>
                    <li>Browsertyp und Betriebssystem</li>
                    <li><strong>Live-GPS-Koordinaten</strong> bei aktiver Routenaufzeichnung: werden nur lokal im Browser verarbeitet und erst auf deinen ausdrücklichen Befehl hin gespeichert. Es erfolgt keine automatische Übertragung.</li>
                    <li><strong>Web-Push-Abonnement-Token</strong> (falls du Benachrichtigungen erlaubst): wird in der Supabase-Datenbank gespeichert und dient ausschließlich dem Versand von In-App-Benachrichtigungen (z. B. Freundschaftsanfragen).</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="border-t border-brand-100 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                2. Rechtsgrundlagen der Verarbeitung
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-slate-600 border-collapse">
                  <thead>
                    <tr className="bg-brand-100/80">
                      <th className="text-left p-3 font-semibold text-slate-900 rounded-tl-lg">Datenart</th>
                      <th className="text-left p-3 font-semibold text-slate-900">Zweck</th>
                      <th className="text-left p-3 font-semibold text-slate-900 rounded-tr-lg">Rechtsgrundlage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    <tr>
                      <td className="p-3">E-Mail & Passwort</td>
                      <td className="p-3">Authentifizierung, Kontoverwaltung</td>
                      <td className="p-3">Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)</td>
                    </tr>
                    <tr className="bg-brand-50/70">
                      <td className="p-3">GPS-Koordinaten & Routendaten</td>
                      <td className="p-3">Kartendarstellung, Routenplanung, Journal</td>
                      <td className="p-3">Art. 6 Abs. 1 lit. b DSGVO</td>
                    </tr>
                    <tr>
                      <td className="p-3">Fotos</td>
                      <td className="p-3">Bebilderung von Wanderungen und Profilen</td>
                      <td className="p-3">Art. 6 Abs. 1 lit. a DSGVO (Einwilligung)</td>
                    </tr>
                    <tr className="bg-brand-50/70">
                      <td className="p-3">Hundedaten</td>
                      <td className="p-3">Persönliches Profil</td>
                      <td className="p-3">Art. 6 Abs. 1 lit. a DSGVO (freiwillig)</td>
                    </tr>
                    <tr>
                      <td className="p-3">Kommentare & Bewertungen</td>
                      <td className="p-3">Community-Funktion</td>
                      <td className="p-3">Art. 6 Abs. 1 lit. b DSGVO bzw. lit. a DSGVO für freiwillige Inhalte</td>
                    </tr>
                    <tr className="bg-brand-50/70">
                      <td className="p-3">Session-Token</td>
                      <td className="p-3">Technisch notwendige Anmeldung</td>
                      <td className="p-3">Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)</td>
                    </tr>
                    <tr>
                      <td className="p-3">Technische Logs</td>
                      <td className="p-3">IT-Sicherheit, Missbrauchsschutz, Fehlerbehebung</td>
                      <td className="p-3">Art. 6 Abs. 1 lit. f DSGVO – berechtigtes Interesse: Betrieb und Absicherung der IT-Infrastruktur</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="border-t border-brand-100 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                3. Speicherdauer
              </h2>
              <div className="space-y-3 text-sm md:text-base text-slate-600 leading-relaxed">
                <ul className="list-disc pl-6 space-y-3">
                  <li><strong>Kontodaten (E-Mail):</strong> Bis zur Kontolöschung; danach Löschung innerhalb angemessener Bearbeitungsfrist.</li>
                  <li><strong>Wanderungen, Fotos, GPS-Daten:</strong> Bis du sie löschst oder wir deine Kontolöschung bearbeiten.</li>
                  <li><strong>Kommentare & Bewertungen:</strong> Bis du sie löschst oder wir deine Kontolöschung bearbeiten.</li>
                  <li><strong>Technische Logs:</strong> Vercel speichert Zugriffslogs typischerweise bis zu 30 Tage; Supabase Auth-Logs nach deren jeweiliger Standardaufbewahrung.</li>
                  <li><strong>Einwilligungsnachweis:</strong> Datum der Zustimmung zur Datenschutzerklärung wird gespeichert, soweit dies zum Nachweis erforderlich ist.</li>
                </ul>
                <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 mt-4">
                  <p className="text-brand-700 text-sm">
                    <strong>Recht auf Vergessenwerden:</strong> Du kannst dein Konto und alle deine Daten jederzeit
                    in den Profileinstellungen unter "Konto löschen" zur Löschung anfragen.
                    Die Anfrage wird per E-Mail vorbereitet und danach manuell bearbeitet.
                  </p>
                </div>
              </div>
            </section>

            <section className="border-t border-brand-100 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                4. Wer Zugriff auf deine Daten hat
              </h2>
              <div className="space-y-4 text-sm md:text-base text-slate-600 leading-relaxed">
                <div className="bg-brand-50/70 rounded-xl p-4">
                  <p className="font-medium text-slate-900 mb-2">Innerhalb der App:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Nur du</strong> siehst deine privaten Wanderungen und Kontoinformationen.</li>
                    <li><strong>Freunde</strong> sehen nur Inhalte, die du ausdrücklich für Freunde freigibst.</li>
                    <li><strong>Alle Nutzer</strong> sehen Wanderungsdaten aus unserem öffentlichen Google Sheet und Inhalte, die du öffentlich teilst.</li>
                    <li><strong>Administratoren</strong> können Inhalte zur Moderation und Freigabe einsehen.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="border-t border-brand-100 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                5. Auftragsverarbeiter & externe Dienste
              </h2>
              <div className="space-y-3 text-sm md:text-base text-slate-600">
                <p>Deine Daten werden <strong>nur an folgende Auftragsverarbeiter oder technische Dienste</strong> weitergegeben:</p>

                <div className="space-y-3">
                  <div className="border border-brand-100 rounded-xl p-4">
                    <p className="font-semibold text-slate-900 mb-1">Supabase Inc. (Authentifizierung, Datenbank, Storage)</p>
                    <p>Speichert Nutzerkonten, Session-Tokens und App-Daten. Journal-Dateien werden in Supabase Storage gespeichert und in der App je nach Freigabe privat, für Freunde oder öffentlich ausgeliefert.</p>
              <p className="mt-1 text-slate-500">Datenschutz: <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">supabase.com/privacy</a></p>
                  </div>

                  <div className="border border-brand-100 rounded-xl p-4">
                    <p className="font-semibold text-slate-900 mb-1">Vercel Inc. (Hosting & CDN)</p>
                    <p>Hostet die Web-App und verarbeitet technische Zugriffsdaten wie IP-Adresse und HTTP-Logs.</p>
              <p className="mt-1 text-slate-500">Datenschutz: <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">vercel.com/legal/privacy-policy</a></p>
                  </div>

                  <div className="border border-brand-100 rounded-xl p-4">
                    <p className="font-semibold text-slate-900 mb-1">Google LLC (Sign-in mit Google / OAuth)</p>
                    <p>Wenn du dich über "Mit Google anmelden" registrierst oder einloggst, überträgt Google deine E-Mail-Adresse, deinen Namen und dein Profilbild an Supabase Auth.</p>
              <p className="mt-1 text-slate-500">Datenschutz: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">policies.google.com/privacy</a></p>
                  </div>

                  <div className="border border-brand-100 rounded-xl p-4">
                    <p className="font-semibold text-slate-900 mb-1">OpenStreetMap / CARTO (Kartenkacheln)</p>
                    <p>Lädt Kartenkacheln. Dabei wird deine IP-Adresse technisch bedingt an diese Dienste übertragen.</p>
              <p className="mt-1 text-slate-500"><a href="https://wiki.osmfoundation.org/wiki/Privacy_Policy" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">OSM Datenschutzrichtlinie</a></p>
                  </div>

                  <div className="border border-brand-100 rounded-xl p-4">
                    <p className="font-semibold text-slate-900 mb-1">Nominatim / OpenStreetMap (Ortssuche)</p>
                    <p>Wenn du im Routenplaner oder im Tagebuch einen Ort suchst, werden Suchtext und IP-Adresse kurzzeitig an Nominatim übertragen.</p>
              <p className="mt-1 text-slate-500"><a href="https://nominatim.org/privacy.html" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">nominatim.org/privacy.html</a></p>
                  </div>

                  <div className="border border-brand-100 rounded-xl p-4">
                    <p className="font-semibold text-slate-900 mb-1">BRouter und GraphHopper GmbH (Routenberechnung)</p>
                    <p>Beim Planen einer Route werden deine Wegpunkt-Koordinaten an externe Routing-Dienste übertragen. Aktuell nutzt die App BRouter als primären Dienst und GraphHopper als technischen Fallback. Kontodaten oder Inhalte deiner App-Beiträge werden dabei nicht übermittelt.</p>
              <p className="mt-1 text-slate-500"><a href="https://www.graphhopper.com/privacy/" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">graphhopper.com/privacy</a></p>
                  </div>

                  <div className="border border-brand-100 rounded-xl p-4">
                    <p className="font-semibold text-slate-900 mb-1">Open-Meteo (Wetterdaten)</p>
                    <p>Wenn du eine Wanderungsdetailseite mit Startpunkt öffnest, werden die GPS-Koordinaten des Startpunkts an Open-Meteo gesendet, um Wetterdaten zu laden.</p>
              <p className="mt-1 text-slate-500"><a href="https://open-meteo.com/en/terms" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">open-meteo.com/en/terms</a></p>
                  </div>

                  <div className="border border-brand-100 rounded-xl p-4">
                    <p className="font-semibold text-slate-900 mb-1">Google Sheets (öffentliche Wanderungsdaten)</p>
                    <p>Öffentliche Wanderungsdaten werden aus einem veröffentlichten Google-Sheet geladen. Beim Abruf können IP-Adresse, Browserdaten und der Zeitpunkt des Abrufs an Google übertragen werden.</p>
                    <p className="mt-1 text-slate-500"><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">policies.google.com/privacy</a></p>
                  </div>

                  <div className="border border-brand-100 rounded-xl p-4">
                    <p className="font-semibold text-slate-900 mb-1">Lokale Platzhalterbilder</p>
                    <p>Avatar-Platzhalter, App-Icons und Kartenmarker werden lokal aus der App oder aus gebündelten App-Assets geladen. Dafür wird kein zusätzlicher Avatar- oder Icon-Drittanbieter kontaktiert.</p>
                  </div>

                  <div className="border border-brand-100 rounded-xl p-4">
                    <p className="font-semibold text-slate-900 mb-1">Stripe Inc. (Zahlungsabwicklung für Premium)</p>
                    <p>Verarbeitet Zahlungsdaten bei Premium-Käufen direkt. Der Betreiber speichert keine Kreditkartendaten. Stripe erhält Name, E-Mail-Adresse und Zahlungsinformationen.</p>
                    <p className="mt-1 text-slate-500"><a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">stripe.com/privacy</a></p>
                  </div>

                  <div className="border border-brand-200 rounded-xl p-4 bg-brand-50">
                    <p className="font-semibold text-brand-700 mb-1">Ausdrücklich nicht verwendet</p>
                    <p className="text-brand-600">
                      <strong>Kein Google Analytics, kein Facebook Pixel, keine Werbe-Cookies,
                      kein Tracking, keine Datenweitergabe an Werbenetzwerke.</strong>
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="border-t border-brand-100 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                6. Drittlandstransfers (Art. 44 ff. DSGVO)
              </h2>
              <div className="space-y-3 text-sm md:text-base text-slate-600 leading-relaxed">
                <p>
                  Folgende Auftragsverarbeiter haben ihren Sitz in den <strong>USA</strong>, einem Land ohne
                  EU-Angemessenheitsbeschluss im Sinne des Art. 45 DSGVO:
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-slate-600 border-collapse">
                    <thead>
                      <tr className="bg-brand-100/80">
                        <th className="text-left p-3 font-semibold text-slate-900 rounded-tl-lg">Anbieter</th>
                        <th className="text-left p-3 font-semibold text-slate-900 rounded-tr-lg">Grundlage des Transfers</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      <tr>
                        <td className="p-3">Supabase Inc.</td>
                        <td className="p-3">Standardvertragsklauseln gem. Art. 46 Abs. 2 lit. c DSGVO (SCCs)</td>
                      </tr>
                      <tr className="bg-brand-50/70">
                        <td className="p-3">Vercel Inc.</td>
                        <td className="p-3">Standardvertragsklauseln gem. Art. 46 Abs. 2 lit. c DSGVO (SCCs)</td>
                      </tr>
                      <tr>
                        <td className="p-3">Google LLC</td>
                        <td className="p-3">Standardvertragsklauseln gem. Art. 46 Abs. 2 lit. c DSGVO (SCCs)</td>
                      </tr>
                      <tr className="bg-brand-50/70">
                        <td className="p-3">Stripe Inc.</td>
                        <td className="p-3">Standardvertragsklauseln gem. Art. 46 Abs. 2 lit. c DSGVO (SCCs)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-700">
                  Trotz dieser Schutzmaßnahmen können US-Behörden unter bestimmten Umständen Zugang zu Daten erlangen.
                  Durch die Nutzung der App stimmst du diesen Transfers auf Basis der genannten Rechtsgrundlagen zu.
                  Du kannst deine Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen, indem du dein Konto löschst.
                </div>
              </div>
            </section>

            <section className="border-t border-brand-100 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-slate-900 mb-4">
                7. Hochgeladene Fotos & Urheberrecht
              </h2>
              <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 text-sm text-brand-700 leading-relaxed">
                <p><strong>Beim Hochladen von Fotos bestätigst du:</strong></p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Du bist Urheber oder besitzt die Nutzungsrechte an den Fotos.</li>
                  <li>Die abgebildeten Personen haben der Veröffentlichung zugestimmt (sofern erkennbar).</li>
                  <li>Fotos zu öffentlichen Wanderungen können für andere berechtigte Nutzer innerhalb der App sichtbar werden.</li>
                  <li>Du kannst Fotos jederzeit durch Bearbeiten der Wanderung entfernen.</li>
                </ul>
              </div>
            </section>

            <section className="border-t border-brand-100 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-slate-900 mb-4">
                8. Technisch notwendige Cookies & LocalStorage
              </h2>
              <div className="space-y-3 text-sm text-slate-600">
                <p>Diese App verwendet <strong>ausschließlich technisch notwendige</strong> Browser-Speicher-Einträge und ein einzelnes technisch notwendiges Cookie:</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-brand-100/80">
                        <th className="text-left p-2 font-semibold text-slate-900">Name</th>
                        <th className="text-left p-2 font-semibold text-slate-900">Zweck</th>
                        <th className="text-left p-2 font-semibold text-slate-900">Dauer</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      <tr>
                        <td className="p-2 font-mono text-xs">sb-*-auth-token</td>
                        <td className="p-2">LocalStorage: Supabase Session (Anmeldung aufrecht erhalten)</td>
                        <td className="p-2">Bis zum Abmelden oder Ablauf der Session</td>
                      </tr>
                      <tr className="bg-brand-50/70">
                        <td className="p-2 font-mono text-xs">doghike_cookie_consent</td>
                        <td className="p-2">LocalStorage: Speichert, dass du den Hinweis zu technisch notwendigen Speichern gesehen hast</td>
                        <td className="p-2">Dauerhaft, bis du den Browser-Speicher löschst</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono text-xs">sidebar_state</td>
                        <td className="p-2">Cookie: Speichert den geöffneten oder geschlossenen Zustand der Seitenleiste</td>
                        <td className="p-2">7 Tage</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p>Es werden <strong>keine Werbe-Cookies, keine Tracking-Cookies und keine Third-Party-Cookies</strong> gesetzt.</p>
              </div>
            </section>

            <section className="border-t border-brand-100 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5" />
                9. Deine Rechte (Art. 15-21 DSGVO)
              </h2>
              <div className="space-y-3 text-sm md:text-base text-slate-600 leading-relaxed">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  <div className="bg-brand-50/70 rounded-xl p-4">
                    <p className="font-semibold text-slate-900 mb-1">Auskunft (Art. 15)</p>
                    <p className="text-sm">Welche Daten wir über dich gespeichert haben.</p>
                  </div>
                  <div className="bg-brand-50/70 rounded-xl p-4">
                    <p className="font-semibold text-slate-900 mb-1">Berichtigung (Art. 16)</p>
                    <p className="text-sm">Falsche Daten korrigieren lassen.</p>
                  </div>
                  <div className="bg-brand-50/70 rounded-xl p-4">
                    <p className="font-semibold text-slate-900 mb-1">Löschung (Art. 17)</p>
                    <p className="text-sm">Vollständige Datenlöschung per Anfrage über die Profileinstellungen oder per E-Mail.</p>
                  </div>
                  <div className="bg-brand-50/70 rounded-xl p-4">
                    <p className="font-semibold text-slate-900 mb-1">Datenportabilität (Art. 20)</p>
                    <p className="text-sm">Deine Daten in einem gängigen Format anfordern.</p>
                  </div>
                  <div className="bg-brand-50/70 rounded-xl p-4">
                    <p className="font-semibold text-slate-900 mb-1">Einschränkung (Art. 18)</p>
                    <p className="text-sm">Eingeschränkte Verarbeitung verlangen.</p>
                  </div>
                  <div className="bg-brand-50/70 rounded-xl p-4">
                    <p className="font-semibold text-slate-900 mb-1">Widerspruch (Art. 21)</p>
                    <p className="text-sm">Der Verarbeitung widersprechen.</p>
                  </div>
                  <div className="bg-brand-50/70 rounded-xl p-4">
                    <p className="font-semibold text-slate-900 mb-1">Einwilligung widerrufen (Art. 7 Abs. 3)</p>
                    <p className="text-sm">Einwilligungen (z. B. für Fotos, Hundedaten, Push-Benachrichtigungen) jederzeit mit Wirkung für die Zukunft widerrufen — per E-Mail oder durch Löschen der Daten in der App.</p>
                  </div>
                  <div className="bg-brand-50/70 rounded-xl p-4 sm:col-span-2">
                    <p className="font-semibold text-slate-900 mb-1">Beschwerde bei Aufsichtsbehörde</p>
                    <p className="text-sm">
                      In Italien:{" "}
              <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">
                        Garante per la protezione dei dati personali
                      </a>
                    </p>
                  </div>
                </div>

          <div className="mt-4 rounded-xl bg-gradient-to-br from-[#501F14] to-[#A8003C] p-4 text-white shadow-[0_12px_24px_rgba(168,0,60,0.14)]">
                  <p className="font-semibold mb-1">Anfragen stellen:</p>
            <p className="text-brand-50 text-sm">
                    Schreib an <strong>suedtirolmithund@gmail.com</strong>. Antwort innerhalb von 1 Monat (Art. 12 Abs. 3 DSGVO); bei komplexen Anfragen Verlängerung um weitere 2 Monate möglich.
                    Für Kontolöschung: Anfrage über die Profileinstellungen oder per E-Mail.
                  </p>
                </div>
              </div>
            </section>

            <section className="border-t border-brand-100 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-slate-900 mb-4">
                10. Datenprovisionspflicht & automatisierte Entscheidungen (Art. 13 Abs. 2 lit. e–f DSGVO)
              </h2>
              <div className="space-y-4 text-sm md:text-base text-slate-600 leading-relaxed">
                <div className="bg-brand-50/70 rounded-xl p-4 space-y-2">
                  <p className="font-semibold text-slate-900">Pflicht zur Datenprovision (Art. 13 Abs. 2 lit. e)</p>
                  <p>Die Bereitstellung der E-Mail-Adresse ist für die Registrierung <strong>vertraglich erforderlich</strong>. Ohne diese Angabe kann kein Nutzerkonto erstellt und die App nicht vollständig genutzt werden.</p>
                  <p>Alle weiteren Daten (Fotos, Hundedaten, GPS-Aufzeichnungen, Kommentare) sind <strong>freiwillig</strong>. Ihre Nichtangabe hat keine Nachteile für die Basisnutzung der App.</p>
                </div>
                <div className="bg-brand-50/70 rounded-xl p-4 space-y-2">
                  <p className="font-semibold text-slate-900">Automatisierte Entscheidungen & Profiling (Art. 13 Abs. 2 lit. f)</p>
                  <p>Es findet <strong>keine automatisierte Entscheidungsfindung und kein Profiling</strong> im Sinne des Art. 22 DSGVO statt. Es werden keine auf automatisierter Verarbeitung beruhenden Entscheidungen getroffen, die rechtliche oder ähnlich erhebliche Auswirkungen auf Nutzer haben.</p>
                </div>
              </div>
            </section>

            <section className="border-t border-brand-100 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-slate-900 mb-4">
                11. Datensicherheit
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-sm md:text-base text-slate-600">
                <li>Alle Übertragungen verschlüsselt über HTTPS/TLS</li>
                <li>Passwörter werden gehasht gespeichert</li>
                <li>Supabase Row-Level-Security (RLS) schützt private Datenbereiche</li>
                <li>Regelmäßige Sicherheitsupdates der Infrastruktur</li>
              </ul>
            </section>

            <section className="border-t border-brand-100 pt-6 md:pt-8">
              <div className="bg-brand-50 border border-brand-100 rounded-xl p-4">
                <p className="text-brand-700 text-sm md:text-base leading-relaxed">
                  <strong>Öffentliche Inhalte:</strong> Kommentare und Bewertungen, die du abgibst,
                  können für andere App-Nutzer sichtbar sein. Fotos, die du zu öffentlichen Wanderungen hochlädst,
                  können je nach Freigabe für andere Nutzer oder öffentlich sichtbar werden. Teile keine sensiblen
                  personenbezogenen Informationen in öffentlichen Beiträgen.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
