import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Shield, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Legal() {
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
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800">Rechtliche Hinweise</h1>
          </div>

          <div className="space-y-6 md:space-y-8">
            {/* Haftungsausschluss */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-amber-600" />
                <h2 className="text-lg md:text-xl font-semibold text-stone-800">Haftungsausschluss</h2>
              </div>
              
              <div className="space-y-4 text-stone-600 leading-relaxed">
                <p>
                  Die auf dieser Plattform bereitgestellten Informationen zu Wanderungen, Routen und 
                  hundefreundlichen Aktivitäten dienen ausschließlich zu Informationszwecken.
                </p>

                <p className="font-medium text-stone-800">
                  Nutzung auf eigene Verantwortung:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    Die Teilnahme an Wanderungen und Outdoor-Aktivitäten erfolgt auf eigene Gefahr. 
                    Der Betreiber dieser Plattform übernimmt keinerlei Haftung für Unfälle, Verletzungen, 
                    Schäden oder Verluste, die sich aus der Nutzung der bereitgestellten Informationen ergeben.
                  </li>
                  <li>
                    Jeder Nutzer ist selbst dafür verantwortlich, die körperliche Verfassung und Eignung 
                    seines Hundes sowie seine eigene Fitness für die geplante Aktivität einzuschätzen.
                  </li>
                  <li>
                    Die Informationen über Schwierigkeitsgrade, Wegbeschaffenheit und Gefahrenstellen 
                    basieren auf Erfahrungen einzelner Nutzer und können sich jederzeit ändern.
                  </li>
                  <li>
                    Wetter- und Wegebedingungen können sich schnell ändern. Es liegt in der Verantwortung 
                    des Nutzers, sich vor Antritt einer Wanderung über aktuelle Bedingungen zu informieren.
                  </li>
                </ul>

                <p className="font-medium text-stone-800 mt-6">
                  Verantwortung für Hunde:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    Hundebesitzer sind vollständig für das Verhalten und die Sicherheit ihres Hundes verantwortlich.
                  </li>
                  <li>
                    Die Einhaltung lokaler Vorschriften (z.B. Leinenpflicht, Naturschutzgebiete) liegt 
                    in der Verantwortung des Hundebesitzers.
                  </li>
                  <li>
                    Der Betreiber haftet nicht für Schäden, die durch Hunde verursacht werden.
                  </li>
                </ul>

                <p className="font-medium text-stone-800 mt-6">
                  Keine Gewährleistung:
                </p>
                <p>
                  Wir übernehmen keine Gewährleistung für die Richtigkeit, Vollständigkeit oder 
                  Aktualität der auf dieser Plattform bereitgestellten Informationen. Routen, 
                  Beschreibungen und Empfehlungen werden von der Community erstellt und können 
                  Fehler enthalten.
                </p>
              </div>
            </section>

            {/* Nutzergenerierte Inhalte */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4">
                Nutzergenerierte Inhalte
              </h2>
              <div className="space-y-3 md:space-y-4 text-sm md:text-base text-stone-600 leading-relaxed">
                <p>
                  Die auf dieser Plattform veröffentlichten Wanderungen, Kommentare, Fotos und 
                  Bewertungen werden von Nutzern erstellt. Der Betreiber prüft diese Inhalte nicht 
                  auf Richtigkeit und übernimmt keine Verantwortung für deren Inhalt.
                </p>
                <p>
                  Nutzer sind selbst dafür verantwortlich, dass ihre Beiträge keine Rechte Dritter 
                  verletzen und der Wahrheit entsprechen.
                </p>
              </div>
            </section>

            {/* Notfall */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <h2 className="text-lg md:text-xl font-semibold text-stone-800 mb-4">
                Im Notfall
              </h2>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-800 font-medium mb-2">
                  🚨 Notruf Südtirol/Italien: 112
                </p>
                <p className="text-red-700 text-sm">
                  Bergrettung Südtirol: +39 0471 797 397
                </p>
              </div>
            </section>

            {/* Änderungen */}
            <section className="border-t border-stone-200 pt-6 md:pt-8">
              <p className="text-sm text-stone-500">
                Der Betreiber behält sich das Recht vor, diese rechtlichen Hinweise jederzeit 
                zu ändern oder zu ergänzen. Die Nutzung der Plattform erfolgt unter Anerkennung 
                dieser Bedingungen.
              </p>
              <p className="text-sm text-stone-500 mt-2">
                Letzte Aktualisierung: Februar 2026
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}