import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Shield, Lock, Eye, Database, Building2, Clock, Users, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Datenschutz() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-[#edf7ff] pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
        <Link to={createPageUrl("Dashboard")}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
        </Link>

        <div className="rounded-2xl border border-sky-200/70 bg-white/70 p-4 shadow-[0_14px_34px_rgba(16,47,74,0.1)] backdrop-blur-sm md:p-8">
          <div className="doghike-page-header mb-2">
            <div className="doghike-page-icon">
              <Shield className="h-5 w-5" />
            </div>
            <h1 className="doghike-page-title">Datenschutzerklärung</h1>
          </div>
          <p className="text-xs text-slate-400 mb-8">Letzte Aktualisierung: April 2026</p>

          <div className="space-y-6 md:space-y-8">
            <section>
              <p className="text-sm md:text-base text-slate-600 leading-relaxed">
                Der Schutz Ihrer persönlichen Daten ist uns ein besonderes Anliegen. Wir verarbeiten
                Ihre Daten ausschließlich auf Grundlage der gesetzlichen Bestimmungen der
                EU-Datenschutz-Grundverordnung (DSGVO / Verordnung (EU) 2016/679) sowie des
                italienischen Datenschutzgesetzes (D.Lgs. 196/2003 in der geänderten Fassung).
                In dieser Erklärung informieren wir Sie darüber, welche Daten wir erheben,
                warum, wie lange wir sie speichern, wer Zugriff hat und welche Rechte Sie haben.
              </p>
            </section>

            <section className="border-t border-sky-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Verantwortlicher (Titolare del trattamento)
              </h2>
              <div className="space-y-2 text-sm md:text-base text-slate-600 bg-sky-50 rounded-xl p-4">
                <p><strong>Julia Schwärzer</strong></p>
                <p>Südtirol, Italien</p>
                <p>E-Mail: <a href="mailto:suedtirolmithund@gmail.com" className="text-brand-600 underline"><strong>suedtirolmithund@gmail.com</strong></a></p>
                <p>Website: <a href="https://www.mithundenunterwegsinsuedtirol.it" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">www.mithundenunterwegsinsuedtirol.it</a></p>
                <p>App: <a href="https://doghike-suedtirol.vercel.app" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">doghike-suedtirol.vercel.app</a></p>
              </div>
            </section>

            <section className="border-t border-sky-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Database className="w-5 h-5" />
                1. Welche Daten wir speichern
              </h2>
              <div className="space-y-4 text-sm md:text-base text-slate-600 leading-relaxed">
                <div className="bg-sky-50 rounded-xl p-4">
                  <p className="font-medium text-slate-900 mb-2">Bei der Registrierung:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>E-Mail-Adresse</strong> (Pflichtfeld)</li>
                    <li><strong>Passwort</strong> (verschlüsselt gehasht, nie im Klartext gespeichert)</li>
                    <li><strong>Anzeigename</strong> (optional, von Ihnen frei wählbar)</li>
                    <li><strong>Zeitpunkt der Registrierung</strong> und Zustimmung zur Datenschutzerklärung</li>
                  </ul>
                </div>

                <div className="bg-sky-50 rounded-xl p-4">
                  <p className="font-medium text-slate-900 mb-2">Bei der Nutzung der App:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Wanderungsdaten:</strong> Trailname, Ort, Datum, Distanz, Höhenmeter, Dauer, Schwierigkeit, Saison, Wasserverfügbarkeit, Notizen, Parkplatzinfos</li>
                    <li><strong>GPS-Koordinaten:</strong> Startpunkt und optionale Routenpunkte, die Sie selbst eingeben oder aufzeichnen</li>
                    <li><strong>Fotos:</strong> Von Ihnen hochgeladene Bilder (Sie bestätigen beim Upload, die Nutzungsrechte zu besitzen)</li>
                    <li><strong>Hundeprofil:</strong> Name, Rasse, Geburtsdatum, Foto (alles freiwillig)</li>
                    <li><strong>Soziale Daten:</strong> Kommentare, Bewertungen (1-5 Sterne), Freundschaftsanfragen</li>
                  </ul>
                </div>

                <div className="bg-sky-50 rounded-xl p-4">
                  <p className="font-medium text-slate-900 mb-2">Technische Daten (automatisch):</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Session-Token und technisch notwendige Browser-Speicher-Einträge</li>
                    <li>IP-Adresse (wird von Vercel- und Supabase-Infrastruktur protokolliert)</li>
                    <li>Browsertyp und Betriebssystem</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="border-t border-sky-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                2. Rechtsgrundlagen der Verarbeitung
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-slate-600 border-collapse">
                  <thead>
                    <tr className="bg-sky-100">
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
                    <tr className="bg-sky-50">
                      <td className="p-3">GPS-Koordinaten & Routendaten</td>
                      <td className="p-3">Kartendarstellung, Routenplanung, Journal</td>
                      <td className="p-3">Art. 6 Abs. 1 lit. b DSGVO</td>
                    </tr>
                    <tr>
                      <td className="p-3">Fotos</td>
                      <td className="p-3">Bebilderung von Touren und Profilen</td>
                      <td className="p-3">Art. 6 Abs. 1 lit. a DSGVO (Einwilligung)</td>
                    </tr>
                    <tr className="bg-sky-50">
                      <td className="p-3">Hundedaten</td>
                      <td className="p-3">Persönliches Profil</td>
                      <td className="p-3">Art. 6 Abs. 1 lit. a DSGVO (freiwillig)</td>
                    </tr>
                    <tr>
                      <td className="p-3">Kommentare & Bewertungen</td>
                      <td className="p-3">Community-Funktion</td>
                      <td className="p-3">Art. 6 Abs. 1 lit. b DSGVO bzw. lit. a DSGVO für freiwillige Inhalte</td>
                    </tr>
                    <tr className="bg-sky-50">
                      <td className="p-3">Session-Token</td>
                      <td className="p-3">Technisch notwendige Anmeldung</td>
                      <td className="p-3">Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)</td>
                    </tr>
                    <tr>
                      <td className="p-3">Technische Logs</td>
                      <td className="p-3">Sicherheit, Fehlerbehebung</td>
                      <td className="p-3">Art. 6 Abs. 1 lit. f DSGVO (Berechtigtes Interesse)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="border-t border-sky-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                3. Speicherdauer
              </h2>
              <div className="space-y-3 text-sm md:text-base text-slate-600 leading-relaxed">
                <ul className="list-disc pl-6 space-y-3">
                  <li><strong>Kontodaten (E-Mail):</strong> Bis zur Kontolöschung; danach Löschung innerhalb angemessener Bearbeitungsfrist.</li>
                  <li><strong>Wanderungen, Fotos, GPS-Daten:</strong> Bis zur manuellen Löschung durch Sie oder nach Bearbeitung einer Kontolöschung.</li>
                  <li><strong>Kommentare & Bewertungen:</strong> Bis zur Löschung durch Sie oder nach Bearbeitung einer Kontolöschung.</li>
                  <li><strong>Technische Logs:</strong> Vercel speichert Zugriffslogs typischerweise bis zu 30 Tage; Supabase Auth-Logs nach deren jeweiliger Standardaufbewahrung.</li>
                  <li><strong>Einwilligungsnachweis:</strong> Datum der Zustimmung zur Datenschutzerklärung wird gespeichert, soweit dies zum Nachweis erforderlich ist.</li>
                </ul>
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>Recht auf Vergessenwerden:</strong> Sie können Ihr Konto und alle Ihre Daten jederzeit
                    in den Profileinstellungen unter "Konto löschen" zur Löschung anfragen.
                    Die Anfrage wird per E-Mail vorbereitet und danach manuell bearbeitet.
                  </p>
                </div>
              </div>
            </section>

            <section className="border-t border-sky-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                4. Wer Zugriff auf Ihre Daten hat
              </h2>
              <div className="space-y-4 text-sm md:text-base text-slate-600 leading-relaxed">
                <div className="bg-sky-50 rounded-xl p-4">
                  <p className="font-medium text-slate-900 mb-2">Innerhalb der App:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Nur Sie</strong> sehen Ihre privaten Wanderungen und Kontoinformationen.</li>
                    <li><strong>Freunde</strong> sehen nur Inhalte, die Sie ausdrücklich für Freunde freigeben.</li>
                    <li><strong>Alle Nutzer</strong> sehen Touren-Daten aus unserem öffentlichen Google Sheet sowie von Ihnen veröffentlichte Inhalte nach den jeweiligen Sichtbarkeitseinstellungen.</li>
                    <li><strong>Administratoren</strong> können Inhalte zur Moderation und Freigabe einsehen.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="border-t border-sky-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                5. Auftragsverarbeiter & externe Dienste
              </h2>
              <div className="space-y-3 text-sm md:text-base text-slate-600">
                <p>Wir geben Ihre Daten <strong>nur an folgende Auftragsverarbeiter oder technische Dienste</strong> weiter:</p>

                <div className="space-y-3">
                  <div className="border border-sky-200 rounded-xl p-4">
                    <p className="font-semibold text-slate-900 mb-1">Supabase Inc. (Authentifizierung, Datenbank, Storage)</p>
                    <p>Speichert Nutzerkonten, Session-Tokens und App-Daten. Journal-Dateien werden in einem privaten Storage-Bucket gespeichert und in der App bei Bedarf über zeitlich begrenzte Links ausgeliefert.</p>
              <p className="mt-1 text-slate-500">Datenschutz: <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">supabase.com/privacy</a></p>
                  </div>

                  <div className="border border-sky-200 rounded-xl p-4">
                    <p className="font-semibold text-slate-900 mb-1">Vercel Inc. (Hosting & CDN)</p>
                    <p>Hostet die Web-App und verarbeitet technische Zugriffsdaten wie IP-Adresse und HTTP-Logs.</p>
              <p className="mt-1 text-slate-500">Datenschutz: <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">vercel.com/legal/privacy-policy</a></p>
                  </div>

                  <div className="border border-sky-200 rounded-xl p-4">
                    <p className="font-semibold text-slate-900 mb-1">Google LLC (Sign-in mit Google / OAuth)</p>
                    <p>Wenn Sie sich über "Mit Google anmelden" registrieren oder einloggen, überträgt Google Ihre E-Mail-Adresse, Ihren Namen und Ihr Profilbild an Supabase Auth.</p>
              <p className="mt-1 text-slate-500">Datenschutz: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">policies.google.com/privacy</a></p>
                  </div>

                  <div className="border border-sky-200 rounded-xl p-4">
                    <p className="font-semibold text-slate-900 mb-1">OpenStreetMap / CARTO (Kartenkacheln)</p>
                    <p>Lädt Kartenkacheln. Dabei wird Ihre IP-Adresse technisch bedingt an diese Dienste übertragen.</p>
              <p className="mt-1 text-slate-500"><a href="https://wiki.osmfoundation.org/wiki/Privacy_Policy" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">OSM Datenschutzrichtlinie</a></p>
                  </div>

                  <div className="border border-sky-200 rounded-xl p-4">
                    <p className="font-semibold text-slate-900 mb-1">Nominatim / OpenStreetMap (Ortssuche)</p>
                    <p>Wenn Sie im Routenplaner oder im Tagebuch einen Ort suchen, werden Suchtext und IP-Adresse kurzzeitig an Nominatim übertragen.</p>
              <p className="mt-1 text-slate-500"><a href="https://nominatim.org/privacy.html" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">nominatim.org/privacy.html</a></p>
                  </div>

                  <div className="border border-sky-200 rounded-xl p-4">
                    <p className="font-semibold text-slate-900 mb-1">BRouter und GraphHopper GmbH (Routenberechnung)</p>
                    <p>Beim Planen einer Route werden die von Ihnen gesetzten Wegpunkt-Koordinaten an externe Routing-Dienste übertragen. Aktuell verwendet die App BRouter als primären Dienst und GraphHopper als technischen Fallback. Es werden dabei keine Kontodaten oder Inhaltsdaten Ihrer App-Beiträge an diese Dienste übermittelt.</p>
              <p className="mt-1 text-slate-500"><a href="https://www.graphhopper.com/privacy/" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">graphhopper.com/privacy</a></p>
                  </div>

                  <div className="border border-sky-200 rounded-xl p-4">
                    <p className="font-semibold text-slate-900 mb-1">Open-Meteo (Wetterdaten)</p>
                    <p>Wenn Sie eine Tourendetailseite aufrufen, die einen Startpunkt hat, werden die GPS-Koordinaten des Startpunkts an Open-Meteo gesendet, um Wetterdaten zu laden.</p>
              <p className="mt-1 text-slate-500"><a href="https://open-meteo.com/en/terms" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">open-meteo.com/en/terms</a></p>
                  </div>

                  <div className="border border-sky-200 rounded-xl p-4">
                    <p className="font-semibold text-slate-900 mb-1">Stripe Inc. (Zahlungen, nur falls Premium-Zahlungen aktiviert werden)</p>
                    <p>Stripe wird erst dann eingesetzt, wenn Online-Zahlungen für Premium technisch aktiviert werden. Sobald das der Fall ist, verarbeitet Stripe Zahlungsdaten direkt; wir speichern keine Kreditkartendaten selbst.</p>
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

            <section className="border-t border-sky-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-slate-900 mb-4">
                6. Hochgeladene Fotos & Urheberrecht
              </h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800 leading-relaxed">
                <p><strong>Beim Hochladen von Fotos bestätigen Sie:</strong></p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Sie sind der Urheber oder besitzen die Nutzungsrechte an den Fotos.</li>
                  <li>Die abgebildeten Personen haben der Veröffentlichung zugestimmt (sofern erkennbar).</li>
                  <li>Fotos zu öffentlichen Touren können für andere berechtigte Nutzer innerhalb der App sichtbar werden.</li>
                  <li>Sie können Fotos jederzeit durch Bearbeiten der Wanderung entfernen.</li>
                </ul>
              </div>
            </section>

            <section className="border-t border-sky-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-slate-900 mb-4">
                7. Technisch notwendige Cookies & LocalStorage
              </h2>
              <div className="space-y-3 text-sm text-slate-600">
                <p>Diese App verwendet <strong>ausschließlich technisch notwendige</strong> Browser-Speicher-Einträge und ein einzelnes technisch notwendiges Cookie:</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-sky-100">
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
                      <tr className="bg-sky-50">
                        <td className="p-2 font-mono text-xs">doghike_cookie_consent</td>
                        <td className="p-2">LocalStorage: Speichert Ihre Auswahl zum Hinweis auf technisch notwendige Speicher</td>
                        <td className="p-2">Dauerhaft (bis Sie den Browser-Speicher löschen)</td>
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

            <section className="border-t border-sky-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5" />
                8. Ihre Rechte (Art. 15-21 DSGVO)
              </h2>
              <div className="space-y-3 text-sm md:text-base text-slate-600 leading-relaxed">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  <div className="bg-sky-50 rounded-xl p-4">
                    <p className="font-semibold text-slate-900 mb-1">Auskunft (Art. 15)</p>
                    <p className="text-sm">Welche Daten wir über Sie gespeichert haben.</p>
                  </div>
                  <div className="bg-sky-50 rounded-xl p-4">
                    <p className="font-semibold text-slate-900 mb-1">Berichtigung (Art. 16)</p>
                    <p className="text-sm">Falsche Daten korrigieren lassen.</p>
                  </div>
                  <div className="bg-sky-50 rounded-xl p-4">
                    <p className="font-semibold text-slate-900 mb-1">Löschung (Art. 17)</p>
                    <p className="text-sm">Vollständige Datenlöschung per Anfrage über die Profileinstellungen oder per E-Mail.</p>
                  </div>
                  <div className="bg-sky-50 rounded-xl p-4">
                    <p className="font-semibold text-slate-900 mb-1">Datenportabilität (Art. 20)</p>
                    <p className="text-sm">Ihre Daten in einem gängigen Format anfordern.</p>
                  </div>
                  <div className="bg-sky-50 rounded-xl p-4">
                    <p className="font-semibold text-slate-900 mb-1">Einschränkung (Art. 18)</p>
                    <p className="text-sm">Eingeschränkte Verarbeitung verlangen.</p>
                  </div>
                  <div className="bg-sky-50 rounded-xl p-4">
                    <p className="font-semibold text-slate-900 mb-1">Widerspruch (Art. 21)</p>
                    <p className="text-sm">Der Verarbeitung widersprechen.</p>
                  </div>
                  <div className="bg-sky-50 rounded-xl p-4 sm:col-span-2">
                    <p className="font-semibold text-slate-900 mb-1">Beschwerde bei Aufsichtsbehörde</p>
                    <p className="text-sm">
                      In Italien:{" "}
              <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">
                        Garante per la protezione dei dati personali
                      </a>
                    </p>
                  </div>
                </div>

          <div className="mt-4 rounded-xl bg-gradient-to-br from-brand-700 to-[#2777b8] p-4 text-white shadow-[0_12px_24px_rgba(16,47,74,0.16)]">
                  <p className="font-semibold mb-1">Anfragen stellen:</p>
            <p className="text-brand-50 text-sm">
                    Schreiben Sie an <strong>suedtirolmithund@gmail.com</strong> - wir antworten innerhalb von 30 Tagen.
                    Für Kontolöschung: Anfrage über die Profileinstellungen oder per E-Mail.
                  </p>
                </div>
              </div>
            </section>

            <section className="border-t border-sky-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-slate-900 mb-4">
                9. Datensicherheit
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-sm md:text-base text-slate-600">
                <li>Alle Übertragungen verschlüsselt über HTTPS/TLS</li>
                <li>Passwörter werden gehasht gespeichert</li>
                <li>Supabase Row-Level-Security (RLS) schützt private Datenbereiche</li>
                <li>Regelmäßige Sicherheitsupdates der Infrastruktur</li>
              </ul>
            </section>

            <section className="border-t border-sky-200 pt-6 md:pt-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-yellow-800 text-sm md:text-base leading-relaxed">
                  <strong>Öffentliche Inhalte:</strong> Kommentare und Bewertungen, die Sie abgeben,
                  sind für alle App-Nutzer sichtbar. Fotos, die Sie zu öffentlichen Touren hochladen,
                  können für andere Nutzer der App sichtbar werden. Bitte teilen Sie keine sensiblen
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
