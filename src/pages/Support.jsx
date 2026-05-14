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
import { sendSupportMessage } from "@/lib/supportApi";

const SUPPORT_EMAIL = "suedtirolmithund@gmail.com";

export default function Support() {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!subject.trim() || !message.trim()) {
      toast.error("Bitte fülle alle Felder aus");
      return;
    }

    if (!user?.email && !email.trim()) {
      toast.error("Bitte gib eine E-Mail-Adresse an, damit wir dir antworten können.");
      return;
    }

    setSubmitting(true);

    try {
      const result = await sendSupportMessage({
        subject: subject.trim(),
        message: message.trim(),
        email: user?.email || email.trim(),
        category: "feedback",
        pageUrl: typeof window !== "undefined" ? window.location.href : "",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      });

      setSubmitted(true);
      toast.success(
        result?.delivery === "email_sent"
          ? "Deine Nachricht wurde gesendet."
          : "Deine Nachricht wurde gespeichert."
      );
    } catch (error) {
      const code = String(error?.code || error?.message || "").toLowerCase();

      if (code.includes("email_send_failed")) {
        toast.error("Deine Nachricht wurde gespeichert, aber nicht per E-Mail weitergeleitet.");
      } else {
        toast.error("Deine Nachricht konnte gerade nicht gesendet werden. Bitte versuche es noch einmal.");
      }
    } finally {
      setSubmitting(false);
    }
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
          a: "Gehe zu 'Mein Profil' -> Konto -> 'Konto löschen'. Dort kannst du die Löschung direkt auslösen.",
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
          a: "Stelle sicher, dass die Dateigröße unter 15 MB liegt und es sich um JPG, PNG oder WebP-Dateien handelt.",
        },
        {
          q: "Ein Fehler tritt beim Speichern auf",
          a: "Bitte stelle sicher, dass du eingeloggt bist. Falls der Fehler weiterhin besteht, schreibe uns direkt an suedtirolmithund@gmail.com mit einer kurzen Beschreibung.",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50/20 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
        <Link to={createPageUrl("Dashboard")}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Zurück
          </Button>
        </Link>

        <div className="space-y-6">
          <div className="doghike-glass-card p-6 md:p-8">
            <div className="doghike-page-header mb-2">
              <div className="doghike-page-icon">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <h1 className="doghike-page-title">Hilfe & Support</h1>
                <p className="doghike-page-subtitle">
                  Schreib uns direkt: <a href={`mailto:${SUPPORT_EMAIL}`} className="text-brand-600 underline font-medium">{SUPPORT_EMAIL}</a>
                </p>
              </div>
            </div>
          </div>

          <div className="doghike-glass-card p-6 md:p-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Häufig gestellte Fragen (FAQ)</h2>
            {faqs.map((category, index) => {
              const Icon = category.icon;
              return (
                <div key={index} className="mb-6 last:mb-0">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="w-5 h-5 text-brand-600" />
                    <h3 className="font-medium text-slate-900">{category.category}</h3>
                  </div>
                  <Accordion type="single" collapsible className="space-y-2">
                    {category.questions.map((item, questionIndex) => (
                      <AccordionItem
                        key={questionIndex}
                        value={`${index}-${questionIndex}`}
                        className="rounded-lg border border-brand-100/80 bg-white/50 px-4"
                      >
                        <AccordionTrigger className="text-left hover:no-underline">
                          <span className="text-sm md:text-base font-medium text-slate-700">{item.q}</span>
                        </AccordionTrigger>
                        <AccordionContent className="text-sm md:text-base text-slate-600 pb-4">
                          {item.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              );
            })}
          </div>

          <div className="doghike-glass-card p-6 md:p-8">
            <div className="flex items-center gap-2 mb-6">
              <Mail className="w-6 h-6 text-brand-700" />
              <h2 className="text-xl font-semibold text-slate-900">Nachricht senden</h2>
            </div>

            {submitted ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-16 h-16 text-brand-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Nachricht angekommen!</h3>
                <p className="text-slate-500 text-sm mb-6">
                  Wir haben deine Nachricht gespeichert. Falls du noch etwas ergänzen willst, schreib direkt an{" "}
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="text-brand-600 underline">{SUPPORT_EMAIL}</a>.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSubmitted(false);
                    setEmail(user?.email || "");
                    setSubject("");
                    setMessage("");
                  }}
                >
                  Neue Nachricht
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {!user?.email && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Deine E-Mail-Adresse</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="name@example.com"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Betreff</label>
                  <Input
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    placeholder="Worum geht es?"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nachricht</label>
                  <Textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Beschreibe dein Anliegen..."
                    rows={5}
                    required
                  />
                </div>

                {user?.email && (
                  <div className="doghike-soft-panel p-3 text-sm text-brand-800">
                    Antwortadresse für Rückfragen: <strong>{user.email}</strong>
                  </div>
                )}

                <Button type="submit" disabled={submitting} className="w-full bg-brand-400 hover:bg-brand-600 disabled:opacity-60">
                  {submitting ? (
                    <>Wird gesendet...</>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" /> Nachricht senden
                    </>
                  )}
                </Button>

                <div className="text-center text-sm text-slate-500">
                  Oder direkt per E-Mail an{" "}
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="text-brand-600 underline">
                    {SUPPORT_EMAIL}
                  </a>
                </div>
              </form>
            )}
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-[#501F14] via-[#A8003C] to-[#F9C030] p-6 md:p-8 text-white shadow-[0_18px_42px_rgba(168,0,60,0.16)]">
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
