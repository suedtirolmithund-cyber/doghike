import { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/lib/AuthContext";
import { ArrowLeft, Mail, MessageCircle, Send, CheckCircle2, HelpCircle, Book, Shield, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const SUPPORT_EMAIL = "suedtirolmithund@gmail.com";

export default function Support() {
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error("Bitte fülle alle Felder aus");
      return;
    }

    const from = user?.email ? `\n\nVon: ${user.email}` : "";
    const body = encodeURIComponent(`Betreff: ${subject}\n\nNachricht:\n${message}${from}`);
    const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Support: ${subject}`)}&body=${body}`;
    window.open(mailto, "_blank");
    setSubmitted(true);
    toast.success("E-Mail-Programm wird geöffnet...");
  };

  const faqs = [
    {
      category: "Allgemein",
      icon: HelpCircle,
      questions: [
        {
          q: "Wie kann ich eine neue Wanderung hinzufügen?",
          a: "Gehe zu 'Mein Profil' -> 'Tagebuch' und klicke auf 'Neue Wanderung'. Fülle die Details aus, markiere den Startpunkt auf der Karte und lade optional Fotos hoch.",
        },
        {
          q: "Kann ich Wanderungen privat halten?",
          a: "Ja. Bei jeder Wanderung kannst du die Sichtbarkeit einstellen: Privat (nur du), Freunde (nur deine Freunde) oder Öffentlich (geht zur Admin-Prüfung).",
        },
        {
          q: "Wie funktioniert das Freunde-System?",
          a: "Gehe zu 'Freunde', suche nach Nutzer-Namen und sende eine Freundschaftsanfrage. Sobald diese akzeptiert wird, könnt ihr gegenseitig eure 'Freunde'-Wanderungen sehen.",
        },
      ],
    },
    {
      category: "Routenplanung",
      icon: Book,
      questions: [
        {
          q: "Wie plane ich eine neue Route?",
          a: "Gehe zu 'Routenplaner' und klicke auf die Karte, um Wegpunkte zu setzen. Die Route wird automatisch berechnet und bevorzugt Wanderwege.",
        },
        {
          q: "Kann ich GPX-Dateien hochladen?",
          a: "Ja, im Routenplaner gibt es einen GPX-Tab. Die Route wird dann automatisch auf der Karte angezeigt.",
        },
        {
          q: "Wie sehe ich das Höhenprofil einer Route?",
          a: "Sobald du eine Route mit mindestens 2 Wegpunkten erstellt hast, wird das Höhenprofil automatisch unter der Karte angezeigt.",
        },
      ],
    },
    {
      category: "Datenschutz & Sicherheit",
      icon: Shield,
      questions: [
        {
          q: "Wer kann meine Wanderungen sehen?",
          a: "Das hängt von deiner Sichtbarkeitseinstellung ab. Private Wanderungen siehst nur du, Freunde-Wanderungen sehen deine Freunde, öffentliche Wanderungen sind für alle sichtbar nach Admin-Freigabe.",
        },
        {
          q: "Wie kann ich mein Konto löschen?",
          a: "Gehe zu 'Mein Profil' -> Konto -> 'Konto löschen'. Dort wird eine Löschanfrage per E-Mail vorbereitet, die danach manuell bearbeitet wird.",
        },
        {
          q: "Werden meine GPS-Daten gespeichert?",
          a: "GPS-Koordinaten werden nur für die Routen gespeichert, die du bewusst erstellst. Es findet kein Background-Tracking statt.",
        },
      ],
    },
    {
      category: "Probleme & Bugs",
      icon: Bug,
      questions: [
        {
          q: "Die Karte lädt nicht",
          a: "Überprüfe deine Internetverbindung. Falls das Problem weiterhin besteht, versuche die Seite neu zu laden. Adblocker können Kartenkacheln blockieren.",
        },
        {
          q: "Ich kann keine Fotos hochladen",
          a: "Stelle sicher, dass die Dateigröße unter 10 MB liegt und es sich um JPG, PNG oder WebP-Dateien handelt.",
        },
        {
          q: "Ein Fehler tritt beim Speichern auf",
          a: "Bitte stelle sicher, dass du eingeloggt bist. Falls der Fehler weiterhin besteht, schreibe uns direkt an suedtirolmithund@gmail.com mit einer kurzen Beschreibung.",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-slate-50 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
        <Link to={createPageUrl("Dashboard")}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Zurück
          </Button>
        </Link>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-stone-200/50 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <MessageCircle className="w-8 h-8 text-slate-700" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-stone-800">Hilfe & Support</h1>
                <p className="text-stone-500 text-sm mt-0.5">
                  Schreib uns direkt: <a href={`mailto:${SUPPORT_EMAIL}`} className="text-blue-600 underline font-medium">{SUPPORT_EMAIL}</a>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 md:p-8 border border-stone-200/50 shadow-sm">
            <h2 className="text-xl font-semibold text-stone-800 mb-6">Häufig gestellte Fragen (FAQ)</h2>
            {faqs.map((category, index) => {
              const Icon = category.icon;
              return (
                <div key={index} className="mb-6 last:mb-0">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="w-5 h-5 text-slate-600" />
                    <h3 className="font-medium text-stone-800">{category.category}</h3>
                  </div>
                  <Accordion type="single" collapsible className="space-y-2">
                    {category.questions.map((item, questionIndex) => (
                      <AccordionItem
                        key={questionIndex}
                        value={`${index}-${questionIndex}`}
                        className="border border-stone-200 rounded-lg px-4"
                      >
                        <AccordionTrigger className="text-left hover:no-underline">
                          <span className="text-sm md:text-base font-medium text-stone-700">{item.q}</span>
                        </AccordionTrigger>
                        <AccordionContent className="text-sm md:text-base text-stone-600 pb-4">
                          {item.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-2xl p-6 md:p-8 border border-stone-200/50 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Mail className="w-6 h-6 text-slate-700" />
              <h2 className="text-xl font-semibold text-stone-800">Nachricht senden</h2>
            </div>

            {submitted ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-16 h-16 text-brand-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-stone-800 mb-2">E-Mail-Programm geöffnet!</h3>
                <p className="text-stone-500 text-sm mb-6">
                  Falls es nicht geklappt hat, schreib direkt an{" "}
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="text-blue-600 underline">{SUPPORT_EMAIL}</a>.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSubmitted(false);
                    setSubject("");
                    setMessage("");
                  }}
                >
                  Neue Nachricht
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Betreff</label>
                  <Input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Worum geht es?" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Nachricht</label>
                  <Textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Beschreibe dein Anliegen..." rows={5} required />
                </div>
                {user && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                    Antwort kommt an: <strong>{user.email}</strong>
                  </div>
                )}
                <Button type="submit" className="w-full bg-slate-800 hover:bg-slate-900">
                  <Send className="w-4 h-4 mr-2" /> Nachricht senden
                </Button>
              </form>
            )}
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Weitere Ressourcen</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { page: "Datenschutz", icon: Shield, label: "Datenschutz", desc: "Wie wir deine Daten schützen" },
                { page: "Legal", icon: Book, label: "Rechtliches", desc: "Haftungsausschluss & Hinweise" },
                { page: "Impressum", icon: Mail, label: "Impressum", desc: "Angaben zum Betreiber" },
              ].map(({ page, icon: Icon, label, desc }) => (
                <Link key={page} to={createPageUrl(page)}>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-all cursor-pointer">
                    <Icon className="w-6 h-6 mb-2" />
                    <p className="font-medium">{label}</p>
                    <p className="text-sm opacity-80 mt-1">{desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
