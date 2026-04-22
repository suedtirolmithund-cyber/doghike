import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Shield, Lock, Eye, Database, Building2, Clock, Users, Share2 } from "lucide-react";
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
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-6 h-6 md:w-8 md:h-8 text-slate-700" />
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800">Datenschutzerklärung</h1>
          </div>
          <p className="text-xs text-stone-400 mb-8">Letzte Aktualisierung: April 2026</p>

          <div className="space-y-6 md:space-y-8">

            {/* Einleitung */}
            <section>
              <p className="text-sm md:text-base text-stone-600 leading-relaxed">
                Der Schutz Ihrer persönlichen Daten ist uns ein besonderes Anliegen. Wir verarbeiten
                Ihre Daten ausschließlich auf Grundlage der gesetzlichen Bestimmungen der
                EU-Datenschutz-Grundverordnung (DSGVO / Verordnung (EU) 2016/679) sowie des
                italienischen Datenschutzgesetzes (D.Lgs. 196/2003 in der geänderten Fassung).
                In dieser Erklärung informieren wir Sie transparent darüber, welche Daten wir erheben,
                warum, wie lange wir sie speichern, wer Zugriff hat und welche Rechte Sie haben.
              </p>
            </section>

            {/* Verantwortlicher */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Verantwortlicher (Titolare del trattamento)
              </h2>
              <div className="space-y-2 text-sm md:text-base text-stone-600 bg-stone-50 rounded-xl p-4">
                <p><strong>Julia Schwärzer</strong></p>
                <p>Südtirol, Italien</p>
                <p>E-Mail: <a href="mailto:suedtirolmithund@gmail.com" className="text-blue-600 underline"><strong>suedtirolmithund@gmail.com</strong></a></p>
                <p>Website: <a href="https://www.mithundenunterwegsinsuedtirol.it" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">www.mithundenunterwegsinsuedtirol.it</a></p>
                <p>App: <a href="https://doghike-suedtirol.vercel.app" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">doghike-suedtirol.vercel.app</a></p>
              </div>
            </section>

            {/* 1. Welche Daten */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4 flex items-center gap-2">
                <Database className="w-5 h-5" />
                1. Welche Daten wir speichern
              </h2>
              <div className="space-y-4 text-sm md:text-base text-stone-600 leading-relaxed">

                <div className="bg-stone-50 rounded-xl p-4">
                  <p className="font-medium text-stone-800 mb-2">Bei der Registrierung:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>E-Mail-Adresse</strong> (Pflichtfeld)</li>
                    <li><strong>Passwort</strong> (verschlüsselt gehasht, nie im Klartext gespeichert)</li>
                    <li><strong>Anzeigename</strong> (optional, von Ihnen frei wählbar)</li>
                    <li><strong>Zeitpunkt der Registrierung</strong> und Zustimmung zur Datenschutzerklärung</li>
                  </ul>
                </div>

                <div className="bg-stone-50 rounded-xl p-4">
                  <p className="font-medium text-stone-800 mb-2">Bei der Nutzung der App:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Wanderungsdaten:</strong> Trailname, Ort, Datum, Distanz, Höhenmeter, Dauer, Schwierigkeit, Saison, Wasserverfügbarkeit, Notizen, Parkplatzinfos</li>
                    <li><strong>GPS-Koordinaten:</strong> Startpunkt und optionale Routenpunkte, die Sie selbst eingeben</li>
                    <li><strong>Fotos:</strong> Von Ihnen hochgeladene Bilder (Sie bestätigen beim Upload, die Nutzungsrechte zu besitzen)</li>
                    <li><strong>Hundeprofil:</strong> Name, Rasse, Geburtsdatum, Foto (alles freiwillig)</li>
                    <li><strong>Soziale Daten:</strong> Kommentare, Bewertungen (1–5 Sterne)</li>
                  </ul>
                </div>

                <div className="bg-stone-50 rounded-xl p-4">
                  <p className="font-medium text-stone-800 mb-2">Technische Daten (automatisch):</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Session-Token (im Browser-LocalStorage, technisch notwendig)</li>
                    <li>IP-Adresse (wird von Netlify/Supabase-Infrastruktur protokolliert)</li>
                    <li>Browsertyp und Betriebssystem</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 2. Warum */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                2. Rechtsgrundlagen der Verarbeitung
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-stone-600 border-collapse">
                  <thead>
                    <tr className="bg-stone-100">
                      <th className="text-left p-3 font-semibold text-stone-800 rounded-tl-lg">Datenart</th>
                      <th className="text-left p-3 font-semibold text-stone-800">Zweck</th>
                      <th className="text-left p-3 font-semibold text-stone-800 rounded-tr-lg">Rechtsgrundlage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    <tr>
                      <td className="p-3">E-Mail & Passwort</td>
                      <td className="p-3">Authentifizierung, Kontoverwaltung</td>
                      <td className="p-3">Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)</td>
                    </tr>
                    <tr className="bg-stone-50">
                      <td className="p-3">GPS-Koordinaten & Routendaten</td>
                      <td className="p-3">Kartendarstellung, Routenplanung</td>
                      <td className="p-3">Art. 6 Abs. 1 lit. b DSGVO</td>
                    </tr>
                    <tr>
                      <td className="p-3">Fotos</td>
                      <td className="p-3">Bebilderung von Touren und Profilen</td>
                      <td className="p-3">Art. 6 Abs. 1 lit. a DSGVO (Einwilligung)</td>
                    </tr>
                    <tr className="bg-stone-50">
                      <td className="p-3">Hundedaten</td>
                      <td className="p-3">Persönliches Profil</td>
                      <td className="p-3">Art. 6 Abs. 1 lit. a DSGVO (freiwillig)</td>
                    </tr>
                    <tr>
                      <td className="p-3">Kommentare & Bewertungen</td>
                      <td className="p-3">Community-Funktion</td>
                      <td className="p-3">Art. 6 Abs. 1 lit. a DSGVO (Einwilligung)</td>
                    </tr>
                    <tr className="bg-stone-50">
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

            {/* 3. Wie lange */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                3. Speicherdauer
              </h2>
              <div className="space-y-3 text-sm md:text-base text-stone-600 leading-relaxed">
                <ul className="list-disc pl-6 space-y-3">
                  <li><strong>Kontodaten (E-Mail):</strong> Bis zur Kontolöschung; danach Löschung innerhalb von 30 Tagen.</li>
                  <li><strong>Wanderungen, Fotos, GPS-Daten:</strong> Bis zur manuellen Löschung durch Sie oder nach Kontolöschung.</li>
                  <li><strong>Kommentare & Bewertungen:</strong> Bis zur Löschung durch Sie oder nach Kontolöschung.</li>
                  <li><strong>Technische Logs:</strong> Vercel speichert Zugriffslogs typischerweise bis zu 30 Tage; Supabase Auth-Logs bis zu 90 Tage.</li>
                  <li><strong>Einwilligungsnachweis:</strong> Datum der Zustimmung zur Datenschutzerklärung wird gespeichert (gesetzliche Nachweispflicht).</li>
                </ul>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4">
                  <p className="text-amber-800 text-sm">
                    <strong>Recht auf Vergessenwerden:</strong> Sie können Ihr Konto und alle Ihre Daten jederzeit
                    in den Profileinstellungen unter „Konto löschen" beantragen.
                    Die Anfrage wird per E-Mail vorbereitet und danach manuell bearbeitet.
                  </p>
                </div>
              </div>
            </section>

            {/* 4. Wer Zugriff hat */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                4. Wer Zugriff auf Ihre Daten hat
              </h2>
              <div className="space-y-4 text-sm md:text-base text-stone-600 leading-relaxed">
                <div className="bg-stone-50 rounded-xl p-4">
                  <p className="font-medium text-stone-800 mb-2">Innerhalb der App:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Nur Sie</strong> sehen Ihre privaten Wanderungen und Kontoinformationen.</li>
                    <li><strong>Alle Nutzer</strong> sehen Touren-Daten aus unserem öffentlichen Google Sheet (keine personenbezogenen Daten).</li>
                    <li><strong>Administratoren</strong> können Inhalte zur Moderation einsehen.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 5. Datenweitergabe */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4 flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                5. Auftragsverarbeiter & externe Dienste
              </h2>
              <div className="space-y-3 text-sm md:text-base text-stone-600">
                <p>Wir geben Ihre Daten <strong>nur an folgende Auftragsverarbeiter</strong> weiter, die vertraglich zur DSGVO-Konformität verpflichtet sind:</p>

                <div className="space-y-3">
                  <div className="border border-stone-200 rounded-xl p-4">
                    <p className="font-semibold text-stone-800 mb-1">🔐 Supabase Inc. (Authentifizierung & Datenbank)</p>
                    <p>Speichert Nutzerkonten (E-Mail, Passwort-Hash), Session-Tokens und App-Daten.
                      <strong> Rechenzentrum: EU-West-1 (Frankfurt, Deutschland)</strong> — Ihre Daten verlassen die EU nicht.</p>
                    <p className="mt-1 text-stone-500">Datenschutz: <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">supabase.com/privacy</a></p>
                  </div>

                  <div className="border border-stone-200 rounded-xl p-4">
                    <p className="font-semibold text-stone-800 mb-1">🌐 Vercel Inc. (Hosting & CDN)</p>
                    <p>Hostet die Web-App (doghike-suedtirol.vercel.app). Vercel protokolliert IP-Adressen und HTTP-Logs bei Zugriffen (bis 30 Tage). Vercel hat ein DPA und nutzt EU-Edge-Nodes.</p>
                    <p className="mt-1 text-stone-500">Datenschutz: <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">vercel.com/legal/privacy-policy</a></p>
                  </div>

                  <div className="border border-stone-200 rounded-xl p-4">
                    <p className="font-semibold text-stone-800 mb-1">🔑 Google LLC (Sign-in mit Google / OAuth)</p>
                    <p>Wenn Sie sich über „Mit Google anmelden" registrieren oder einloggen, überträgt Google Ihre E-Mail-Adresse, Ihren Namen und Ihr Profilbild an Supabase Auth. Google erfährt dabei den Zeitpunkt des Logins. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung). Google LLC sitzt in den USA; Datenübertragung erfolgt auf Basis von EU-Standardvertragsklauseln (SCCs).</p>
                    <p className="mt-1 text-stone-500">Datenschutz: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">policies.google.com/privacy</a></p>
                  </div>

                  <div className="border border-stone-200 rounded-xl p-4">
                    <p className="font-semibold text-stone-800 mb-1">🗺️ OpenStreetMap / CARTO (Kartenkacheln)</p>
                    <p>Lädt Kartenkacheln. Dabei wird Ihre IP-Adresse kurzzeitig übertragen. Ihre eigenen GPS-Koordinaten werden <strong>nicht</strong> an diese Dienste gesendet — die Karte wird lokal im Browser gerendert.</p>
                    <p className="mt-1 text-stone-500"><a href="https://wiki.osmfoundation.org/wiki/Privacy_Policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">OSM Datenschutzrichtlinie</a></p>
                  </div>

                  <div className="border border-stone-200 rounded-xl p-4">
                    <p className="font-semibold text-stone-800 mb-1">🔍 Nominatim / OpenStreetMap (Ortssuche)</p>
                    <p>Wenn Sie im Routenplaner oder im Tagebuch einen Ort suchen, wird Ihr Suchtext und Ihre IP-Adresse kurzzeitig an den Nominatim-Dienst von OpenStreetMap übertragen. Es werden keine persönlichen Daten dauerhaft gespeichert.</p>
                    <p className="mt-1 text-stone-500"><a href="https://nominatim.org/privacy.html" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">nominatim.org/privacy.html</a></p>
                  </div>

                  <div className="border border-stone-200 rounded-xl p-4">
                    <p className="font-semibold text-stone-800 mb-1">🧭 GraphHopper GmbH (Routenberechnung)</p>
                    <p>Beim Planen einer Route werden die von Ihnen gesetzten Wegpunkt-Koordinaten (Breitengrad, Längengrad) an die GraphHopper API gesendet, um die Wanderroute zu berechnen. GraphHopper ist ein deutsches Unternehmen (DSGVO-konform). Es werden keine Nutzerdaten dauerhaft gespeichert.</p>
                    <p className="mt-1 text-stone-500"><a href="https://www.graphhopper.com/privacy/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">graphhopper.com/privacy</a></p>
                  </div>

                  <div className="border border-stone-200 rounded-xl p-4">
                    <p className="font-semibold text-stone-800 mb-1">🌤️ Open-Meteo (Wetterdaten)</p>
                    <p>Wenn Sie eine Tourendetailseite aufrufen, die einen Startpunkt hat, werden die GPS-Koordinaten des Startpunkts an Open-Meteo gesendet, um die aktuelle Wettervorhersage zu laden. Open-Meteo ist ein Open-Source-Dienst mit EU-Servern. Es werden keine personenbezogenen Daten gespeichert.</p>
                    <p className="mt-1 text-stone-500"><a href="https://open-meteo.com/en/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">open-meteo.com/en/terms</a></p>
                  </div>

                  <div className="border border-stone-200 rounded-xl p-4">
                    <p className="font-semibold text-stone-800 mb-1">💳 Stripe Inc. (Zahlungen, nur bei Premium)</p>
                    <p>Wird nur für Premium-Zahlungen genutzt. Stripe verarbeitet Zahlungsdaten direkt — wir speichern keine Kreditkartendaten. Stripe ist PCI DSS Level 1 zertifiziert und DSGVO-konform (SCCs für US-Transfer).</p>
                    <p className="mt-1 text-stone-500"><a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">stripe.com/privacy</a></p>
                  </div>

                  <div className="border border-emerald-200 rounded-xl p-4 bg-emerald-50">
                    <p className="font-semibold text-emerald-800 mb-1">✅ Ausdrücklich nicht verwendet</p>
                    <p className="text-emerald-700">
                      <strong>Kein Google Analytics, kein Facebook Pixel, keine Werbe-Cookies,
                      kein Tracking, keine Datenweitergabe an Werbenetzwerke.</strong> Google wird
                      ausschließlich für den optionalen OAuth-Login verwendet (nicht für Tracking).
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-blue-800 text-sm">
                    <strong>Behörden:</strong> Wir geben Daten nur weiter, wenn wir gesetzlich dazu
                    verpflichtet sind (z.B. auf richterliche Anordnung nach Art. 6 Abs. 1 lit. c DSGVO).
                  </p>
                </div>
              </div>
            </section>

            {/* 6. Fotos */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4">
                6. Hochgeladene Fotos & Urheberrecht
              </h2>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 leading-relaxed">
                <p><strong>Beim Hochladen von Fotos bestätigen Sie:</strong></p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Sie sind der Urheber oder besitzen die Nutzungsrechte an den Fotos.</li>
                  <li>Die abgebildeten Personen haben der Veröffentlichung zugestimmt (sofern erkennbar).</li>
                  <li>Öffentliche Fotos sind weltweit über eine URL abrufbar.</li>
                  <li>Sie können Fotos jederzeit durch Bearbeiten der Wanderung entfernen.</li>
                </ul>
              </div>
            </section>

            {/* 7. Cookies */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4">
                7. Cookies & LocalStorage
              </h2>
              <div className="space-y-3 text-sm text-stone-600">
                <p>Diese App verwendet <strong>ausschließlich technisch notwendige</strong> Einträge im Browser-LocalStorage:</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-stone-100">
                        <th className="text-left p-2 font-semibold text-stone-800">Name</th>
                        <th className="text-left p-2 font-semibold text-stone-800">Zweck</th>
                        <th className="text-left p-2 font-semibold text-stone-800">Dauer</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      <tr>
                        <td className="p-2 font-mono text-xs">sb-*-auth-token</td>
                        <td className="p-2">Supabase Session (Anmeldung aufrecht erhalten)</td>
                        <td className="p-2">1 Stunde (auto-refresh)</td>
                      </tr>
                      <tr className="bg-stone-50">
                        <td className="p-2 font-mono text-xs">doghike_cookie_consent</td>
                        <td className="p-2">Speichert Ihre Cookie-Einwilligung</td>
                        <td className="p-2">Dauerhaft (bis Sie den Browser-Speicher löschen)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p>Es werden <strong>keine Werbe-Cookies oder Third-Party-Cookies</strong> gesetzt.</p>
              </div>
            </section>

            {/* 8. Ihre Rechte */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5" />
                8. Ihre Rechte (Art. 15–21 DSGVO)
              </h2>
              <div className="space-y-3 text-sm md:text-base text-stone-600 leading-relaxed">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  <div className="bg-stone-50 rounded-xl p-4">
                    <p className="font-semibold text-stone-800 mb-1">📋 Auskunft (Art. 15)</p>
                    <p className="text-sm">Welche Daten wir über Sie gespeichert haben.</p>
                  </div>
                  <div className="bg-stone-50 rounded-xl p-4">
                    <p className="font-semibold text-stone-800 mb-1">✏️ Berichtigung (Art. 16)</p>
                    <p className="text-sm">Falsche Daten korrigieren lassen.</p>
                  </div>
                  <div className="bg-stone-50 rounded-xl p-4">
                    <p className="font-semibold text-stone-800 mb-1">🗑️ Löschung (Art. 17)</p>
                    <p className="text-sm">Vollständige Datenlöschung — direkt in den Profileinstellungen.</p>
                  </div>
                  <div className="bg-stone-50 rounded-xl p-4">
                    <p className="font-semibold text-stone-800 mb-1">📦 Datenportabilität (Art. 20)</p>
                    <p className="text-sm">Ihre Daten als JSON/CSV erhalten.</p>
                  </div>
                  <div className="bg-stone-50 rounded-xl p-4">
                    <p className="font-semibold text-stone-800 mb-1">⏸️ Einschränkung (Art. 18)</p>
                    <p className="text-sm">Eingeschränkte Verarbeitung verlangen.</p>
                  </div>
                  <div className="bg-stone-50 rounded-xl p-4">
                    <p className="font-semibold text-stone-800 mb-1">🚫 Widerspruch (Art. 21)</p>
                    <p className="text-sm">Der Verarbeitung widersprechen.</p>
                  </div>
                  <div className="bg-stone-50 rounded-xl p-4 sm:col-span-2">
                    <p className="font-semibold text-stone-800 mb-1">🏛️ Beschwerde bei Aufsichtsbehörde</p>
                    <p className="text-sm">
                      In Italien:{" "}
                      <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                        Garante per la protezione dei dati personali
                      </a>
                      {" "}— Via Isonzo 21/b, 00198 Roma, Tel. 06 696771
                    </p>
                  </div>
                </div>

                <div className="mt-4 bg-slate-800 text-white rounded-xl p-4">
                  <p className="font-semibold mb-1">Anfragen stellen:</p>
                  <p className="text-slate-300 text-sm">
                    Schreiben Sie an <strong>suedtirolmithund@gmail.com</strong> — wir antworten innerhalb von 30 Tagen.
                    Für Kontolöschung: direkt in den Profileinstellungen oder per E-Mail.
                  </p>
                </div>
              </div>
            </section>

            {/* Datensicherheit */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4">
                9. Datensicherheit
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-sm md:text-base text-stone-600">
                <li>Alle Übertragungen verschlüsselt über HTTPS/TLS</li>
                <li>Passwörter werden gehasht gespeichert (bcrypt, nie im Klartext)</li>
                <li>Supabase Row-Level-Security (RLS): jeder Nutzer sieht nur seine eigenen Daten</li>
                <li>Daten in EU-Rechenzentrum Frankfurt (Supabase EU-West-1)</li>
                <li>Regelmäßige Sicherheitsupdates der gesamten Infrastruktur</li>
              </ul>
            </section>

            {/* Öffentliche Inhalte */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-amber-800 text-sm md:text-base leading-relaxed">
                  <strong>⚠️ Öffentliche Inhalte:</strong> Kommentare und Bewertungen, die Sie abgeben,
                  sind für alle App-Nutzer sichtbar. Fotos, die Sie zu öffentlichen Touren hochladen,
                  sind über eine URL weltweit abrufbar. Bitte teilen Sie keine sensiblen
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
