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
          <p className="text-xs text-stone-400 mb-8">Letzte Aktualisierung: Februar 2026</p>

          <div className="space-y-6 md:space-y-8">

            {/* Einleitung */}
            <section>
              <p className="text-sm md:text-base text-stone-600 leading-relaxed">
                Der Schutz Ihrer persönlichen Daten ist uns ein besonderes Anliegen. Wir verarbeiten
                Ihre Daten ausschließlich auf Grundlage der gesetzlichen Bestimmungen der
                EU-Datenschutz-Grundverordnung (DSGVO). In dieser Erklärung informieren wir Sie
                transparent darüber, welche Daten wir erheben, warum, wie lange wir sie speichern,
                wer Zugriff hat und welche Rechte Sie haben.
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
                    <li><strong>Name</strong> (Vorname, Nachname)</li>
                    <li><strong>E-Mail-Adresse</strong></li>
                    <li><strong>Passwort</strong> (verschlüsselt, nicht im Klartext gespeichert)</li>
                  </ul>
                </div>

                <div className="bg-stone-50 rounded-xl p-4">
                  <p className="font-medium text-stone-800 mb-2">Bei der Nutzung der App:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Wanderungsdaten:</strong> Trailname, Ort, Datum, Distanz, Höhenmeter, Dauer, Schwierigkeit, Saison, Wasserverfügbarkeit, Notizen, Parkplatzinfos</li>
                    <li><strong>GPS-Koordinaten:</strong> Startpunkt (Breitengrad/Längengrad) und optionale Routenpunkte, die Sie selbst eingeben oder aufzeichnen</li>
                    <li><strong>Fotos:</strong> Bilder, die Sie zu Wanderungen oder Ihrem Hundeprofil hochladen (gespeichert in der Cloud, öffentlich zugänglich wenn Wanderung öffentlich)</li>
                    <li><strong>Hundeprofil:</strong> Name, Rasse, Geburtsdatum, Foto, Charakter, Lieblingsfutter (alles optional, von Ihnen freiwillig angegeben)</li>
                    <li><strong>Soziale Daten:</strong> Follow-Verbindungen (wer folgt wem), Kommentare, Bewertungen (1–5 Sterne)</li>
                    <li><strong>Benachrichtigungen:</strong> Inhalte von System- und Nutzerbenachrichtigungen</li>
                    <li><strong>Gespeicherte Touren:</strong> Liste der von Ihnen mit Lesezeichen versehenen Wanderungen</li>
                    <li><strong>Zeitstempel:</strong> Erstellungs- und Änderungszeitpunkte aller Inhalte</li>
                  </ul>
                </div>

                <div className="bg-stone-50 rounded-xl p-4">
                  <p className="font-medium text-stone-800 mb-2">Technische Daten (automatisch):</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>IP-Adresse (wird von der Hosting-Infrastruktur protokolliert)</li>
                    <li>Browsertyp und Betriebssystem</li>
                    <li>Zugriffszeitpunkte</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 2. Warum */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                2. Warum wir diese Daten speichern
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
                      <td className="p-3">Name & E-Mail</td>
                      <td className="p-3">Kontoverwaltung, Anmeldung, Kommunikation</td>
                      <td className="p-3">Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)</td>
                    </tr>
                    <tr className="bg-stone-50">
                      <td className="p-3">GPS-Koordinaten & Routendaten</td>
                      <td className="p-3">Darstellung auf der Karte, Routenplanung</td>
                      <td className="p-3">Art. 6 Abs. 1 lit. b DSGVO</td>
                    </tr>
                    <tr>
                      <td className="p-3">Fotos</td>
                      <td className="p-3">Bebilderung von Touren und Hundeprofilen</td>
                      <td className="p-3">Art. 6 Abs. 1 lit. a DSGVO (Einwilligung durch Upload)</td>
                    </tr>
                    <tr className="bg-stone-50">
                      <td className="p-3">Hundedaten</td>
                      <td className="p-3">Persönliches Profil, Touren mit Hunden verknüpfen</td>
                      <td className="p-3">Art. 6 Abs. 1 lit. a DSGVO (freiwillig)</td>
                    </tr>
                    <tr>
                      <td className="p-3">Kommentare & Bewertungen</td>
                      <td className="p-3">Community-Funktion, Erfahrungsaustausch</td>
                      <td className="p-3">Art. 6 Abs. 1 lit. a DSGVO</td>
                    </tr>
                    <tr className="bg-stone-50">
                      <td className="p-3">Follow-Verbindungen</td>
                      <td className="p-3">Soziale Funktionen, Freundes-Feed</td>
                      <td className="p-3">Art. 6 Abs. 1 lit. a DSGVO</td>
                    </tr>
                    <tr>
                      <td className="p-3">Technische Daten</td>
                      <td className="p-3">Sicherheit, Fehlerbehebung, Missbrauchsschutz</td>
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
                3. Wie lange wir Daten speichern
              </h2>
              <div className="space-y-3 text-sm md:text-base text-stone-600 leading-relaxed">
                <ul className="list-disc pl-6 space-y-3">
                  <li>
                    <strong>Kontodaten (Name, E-Mail):</strong> Solange Ihr Konto aktiv ist. Nach Kontolöschung werden diese Daten innerhalb von 30 Tagen gelöscht.
                  </li>
                  <li>
                    <strong>Wanderungen, Fotos, GPS-Daten:</strong> Solange Sie die Inhalte nicht selbst löschen oder Ihr Konto schließen. Öffentlich gestellte Inhalte können bis zur expliziten Löschanfrage bestehen bleiben.
                  </li>
                  <li>
                    <strong>Kommentare & Bewertungen:</strong> Bis zur Löschung durch den Nutzer oder nach Kontolöschung (innerhalb von 30 Tagen).
                  </li>
                  <li>
                    <strong>Hundedaten:</strong> Bis zur manuellen Löschung durch den Nutzer oder nach Kontolöschung.
                  </li>
                  <li>
                    <strong>Technische Logs (IP-Adressen):</strong> Werden von der Hosting-Infrastruktur (Base44/AWS) typischerweise 90 Tage aufbewahrt.
                  </li>
                </ul>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4">
                  <p className="text-amber-800 text-sm">
                    <strong>Hinweis:</strong> Wenn Sie Ihr Konto löschen möchten, kontaktieren Sie uns unter [kontakt@beispiel.de]. Wir löschen alle Ihre personenbezogenen Daten, sofern keine gesetzlichen Aufbewahrungspflichten bestehen.
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
                    <li><strong>Nur Sie</strong> sehen Ihre privaten Wanderungen, Hundedaten und Kontoinformationen.</li>
                    <li><strong>Ihre Freunde (Follower/Following)</strong> sehen Wanderungen mit Sichtbarkeit „Freunde".</li>
                    <li><strong>Alle Nutzer</strong> sehen Wanderungen, die Sie explizit als „öffentlich" markieren, inkl. der zugehörigen Fotos.</li>
                    <li><strong>Administratoren</strong> haben Zugriff auf alle Inhalte zur Moderation (z.B. Prüfung eingereicher Touren).</li>
                  </ul>
                </div>
                <div className="bg-stone-50 rounded-xl p-4">
                  <p className="font-medium text-stone-800 mb-2">Externe Zugriffe:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Base44 (Hosting):</strong> Verwaltet die Datenbankinfrastruktur und hat technischen Zugriff auf alle gespeicherten Daten als Auftragsverarbeiter.</li>
                    <li>Kein weiterer Dritter hat regulären Zugriff auf Ihre personenbezogenen Daten.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 5. Datenweitergabe an Dritte */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4 flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                5. Datenweitergabe an Dritte / externe Dienste
              </h2>
              <div className="space-y-4 text-sm md:text-base text-stone-600 leading-relaxed">
                <p>Wir nutzen folgende externe Dienste, an die Daten übermittelt werden können:</p>

                <div className="space-y-3">
                  <div className="border border-stone-200 rounded-xl p-4">
                    <p className="font-semibold text-stone-800 mb-1">🏗️ Base44 (Infrastruktur & Hosting)</p>
                    <p>Unsere App läuft auf der Base44-Plattform. Alle Nutzer- und App-Daten werden auf Base44-Servern (EU-Rechenzentren) gespeichert. Base44 agiert als Auftragsverarbeiter gemäß Art. 28 DSGVO.</p>
                    <p className="mt-1 text-stone-500">Übermittelte Daten: alle gespeicherten App-Daten.</p>
                  </div>

                  <div className="border border-stone-200 rounded-xl p-4">
                    <p className="font-semibold text-stone-800 mb-1">🗺️ OpenStreetMap / Leaflet (Kartendarstellung)</p>
                    <p>Für die Kartendarstellung werden Kartenkacheln von OpenStreetMap-Servern geladen. Dabei wird Ihre IP-Adresse an die OpenStreetMap Foundation (UK) übermittelt. GPS-Koordinaten Ihrer Wanderungen verlassen unsere Server <strong>nicht</strong> – sie werden nur lokal im Browser zur Darstellung genutzt.</p>
                    <p className="mt-1 text-stone-500">Übermittelte Daten: IP-Adresse, abgerufene Kartenregion.</p>
                    <p className="mt-1"><a href="https://wiki.osmfoundation.org/wiki/Privacy_Policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">OSM Datenschutzrichtlinie</a></p>
                  </div>

                  <div className="border border-stone-200 rounded-xl p-4">
                    <p className="font-semibold text-stone-800 mb-1">☁️ Cloud-Speicher (Fotos)</p>
                    <p>Von Ihnen hochgeladene Fotos werden in einem Cloud-Speicher der Base44-Plattform abgelegt. Öffentliche Fotos sind über eine URL weltweit abrufbar.</p>
                    <p className="mt-1 text-stone-500">Übermittelte Daten: Bilddateien.</p>
                  </div>

                  <div className="border border-stone-200 rounded-xl p-4 bg-green-50 border-green-200">
                    <p className="font-semibold text-green-800 mb-1">✅ Nicht genutzt</p>
                    <p className="text-green-700">Diese App verwendet <strong>kein Google Analytics, kein Facebook Pixel, kein Stripe</strong> und keine sonstigen Werbe- oder Tracking-Dienste.</p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-blue-800 text-sm">
                    <strong>Weitergabe an Behörden:</strong> Wir geben Daten nur weiter, wenn wir gesetzlich dazu verpflichtet sind (z.B. auf richterliche Anordnung).
                  </p>
                </div>
              </div>
            </section>

            {/* 6. Ihre Rechte */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5" />
                6. Ihre Rechte als betroffene Person
              </h2>
              <div className="space-y-3 text-sm md:text-base text-stone-600 leading-relaxed">
                <p>Sie haben gemäß DSGVO folgende Rechte – kostenlos und ohne besonderen Grund:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <div className="bg-stone-50 rounded-xl p-4">
                    <p className="font-semibold text-stone-800 mb-1">📋 Auskunft (Art. 15)</p>
                    <p className="text-sm">Sie können jederzeit erfahren, welche Daten wir über Sie gespeichert haben.</p>
                  </div>
                  <div className="bg-stone-50 rounded-xl p-4">
                    <p className="font-semibold text-stone-800 mb-1">✏️ Berichtigung (Art. 16)</p>
                    <p className="text-sm">Sie können falsche oder unvollständige Daten berichtigen lassen.</p>
                  </div>
                  <div className="bg-stone-50 rounded-xl p-4">
                    <p className="font-semibold text-stone-800 mb-1">🗑️ Löschung (Art. 17)</p>
                    <p className="text-sm">Sie können die vollständige Löschung Ihres Kontos und aller Ihrer Daten verlangen.</p>
                  </div>
                  <div className="bg-stone-50 rounded-xl p-4">
                    <p className="font-semibold text-stone-800 mb-1">⏸️ Einschränkung (Art. 18)</p>
                    <p className="text-sm">Sie können verlangen, dass wir Ihre Daten nur noch eingeschränkt verarbeiten.</p>
                  </div>
                  <div className="bg-stone-50 rounded-xl p-4">
                    <p className="font-semibold text-stone-800 mb-1">📦 Datenportabilität (Art. 20)</p>
                    <p className="text-sm">Sie können Ihre Daten in einem maschinenlesbaren Format (JSON/CSV) erhalten.</p>
                  </div>
                  <div className="bg-stone-50 rounded-xl p-4">
                    <p className="font-semibold text-stone-800 mb-1">🚫 Widerspruch (Art. 21)</p>
                    <p className="text-sm">Sie können der Verarbeitung Ihrer Daten jederzeit widersprechen.</p>
                  </div>
                  <div className="bg-stone-50 rounded-xl p-4 sm:col-span-2">
                    <p className="font-semibold text-stone-800 mb-1">🏛️ Beschwerde bei Aufsichtsbehörde</p>
                    <p className="text-sm">Sie haben das Recht, sich bei der zuständigen Datenschutzbehörde zu beschweren. In Südtirol/Italien: <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Garante per la protezione dei dati personali</a>.</p>
                  </div>
                </div>

                <div className="mt-4 bg-slate-800 text-white rounded-xl p-4">
                  <p className="font-semibold mb-1">Anfragen stellen:</p>
                  <p className="text-slate-300 text-sm">Schreiben Sie uns an <strong>[kontakt@beispiel.de]</strong> – wir antworten innerhalb von 30 Tagen.</p>
                </div>
              </div>
            </section>

            {/* Datensicherheit */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4">
                Datensicherheit
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-sm md:text-base text-stone-600">
                <li>Alle Datenübertragungen erfolgen verschlüsselt über HTTPS/TLS</li>
                <li>Passwörter werden gehasht gespeichert (nie im Klartext)</li>
                <li>Zugriff auf Daten wird über ein Rechtesystem (RLS) geregelt: Jeder Nutzer sieht nur seine eigenen privaten Daten</li>
                <li>Regelmäßige Sicherheitsupdates der Infrastruktur</li>
              </ul>
            </section>

            {/* Öffentliche Inhalte Warnung */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-amber-800 text-sm md:text-base leading-relaxed">
                  <strong>⚠️ Wichtig – Öffentliche Inhalte:</strong> Wanderungen, die Sie auf „öffentlich" stellen, sowie die dazugehörigen Fotos, GPS-Startpunkte und Beschreibungen sind für <strong>alle Internetnutzer</strong> sichtbar – auch ohne Anmeldung. Bitte achten Sie darauf, keine sensiblen persönlichen Informationen in öffentlichen Beiträgen zu teilen.
                </p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}