import { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
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

export default function Support() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me(),
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data) => {
      // Send email to support
      await base44.integrations.Core.SendEmail({
        to: "[support@beispiel.de]", // Replace with actual support email
        subject: `Support-Anfrage: ${data.subject}`,
        body: `
Von: ${user?.full_name} (${user?.email})

Betreff: ${data.subject}

Nachricht:
${data.message}

---
Gesendet über die Support-Seite
        `
      });
    },
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Nachricht gesendet");
    },
    onError: () => {
      toast.error("Fehler beim Senden");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error("Bitte fülle alle Felder aus");
      return;
    }
    sendMessageMutation.mutate({ subject, message });
  };

  const faqs = [
    {
      category: "Allgemein",
      icon: HelpCircle,
      questions: [
        {
          q: "Wie kann ich eine neue Wanderung hinzufügen?",
          a: "Klicke auf 'Mein Profil' und dann auf 'Wanderung hinzufügen'. Fülle die Details aus, markiere den Startpunkt auf der Karte und lade optional Fotos hoch."
        },
        {
          q: "Kann ich Wanderungen privat halten?",
          a: "Ja! Bei jeder Wanderung kannst du die Sichtbarkeit einstellen: Privat (nur du), Freunde (nur deine Freunde) oder Öffentlich (alle Nutzer)."
        },
        {
          q: "Wie funktioniert das Freunde-System?",
          a: "Du kannst anderen Nutzern Freundschaftsanfragen senden. Sobald diese akzeptiert werden, könnt ihr gegenseitig eure 'Freunde'-Wanderungen sehen."
        }
      ]
    },
    {
      category: "Routenplanung",
      icon: Book,
      questions: [
        {
          q: "Wie plane ich eine neue Route?",
          a: "Gehe zu 'Routenplaner', klicke auf die Karte um Wegpunkte zu setzen. Die Route wird automatisch berechnet und bevorzugt dabei Wanderwege."
        },
        {
          q: "Kann ich GPX-Dateien hochladen?",
          a: "Ja, im Routenplaner kannst du GPX-Dateien hochladen. Die Route wird dann automatisch auf der Karte angezeigt."
        },
        {
          q: "Wie sehe ich das Höhenprofil einer Route?",
          a: "Sobald du eine Route mit mindestens 2 Wegpunkten erstellt hast, wird das Höhenprofil automatisch unter der Karte angezeigt."
        }
      ]
    },
    {
      category: "Datenschutz & Sicherheit",
      icon: Shield,
      questions: [
        {
          q: "Wer kann meine Wanderungen sehen?",
          a: "Das hängt von deiner Sichtbarkeitseinstellung ab. Private Wanderungen sieht nur du, Freunde-Wanderungen sehen deine Freunde, öffentliche Wanderungen sind für alle sichtbar."
        },
        {
          q: "Wie kann ich mein Konto löschen?",
          a: "Gehe zu 'Mein Profil' → Einstellungen → 'Konto löschen'. Beachte, dass alle deine Daten dabei dauerhaft gelöscht werden."
        },
        {
          q: "Werden meine GPS-Daten gespeichert?",
          a: "GPS-Koordinaten werden nur für die Routen gespeichert, die du bewusst erstellst. Es findet keine Tracking im Hintergrund statt."
        }
      ]
    },
    {
      category: "Probleme & Bugs",
      icon: Bug,
      questions: [
        {
          q: "Die Karte lädt nicht",
          a: "Überprüfe deine Internetverbindung. Falls das Problem weiterhin besteht, versuche die Seite neu zu laden (F5 oder Cmd+R)."
        },
        {
          q: "Ich kann keine Fotos hochladen",
          a: "Stelle sicher, dass die Dateigröße unter 10 MB liegt und es sich um JPG, PNG oder HEIC-Dateien handelt."
        },
        {
          q: "Benachrichtigungen werden nicht angezeigt",
          a: "Überprüfe in den Browser-Einstellungen, ob Benachrichtigungen für diese Website erlaubt sind."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-slate-50 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
        <Link to={createPageUrl("Dashboard")}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
        </Link>

        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-stone-200/50 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <MessageCircle className="w-8 h-8 text-slate-700" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-stone-800">Hilfe & Support</h1>
                <p className="text-stone-600 mt-1">Wir sind für dich da</p>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-stone-200/50 shadow-sm">
            <h2 className="text-xl font-semibold text-stone-800 mb-6">
              Häufig gestellte Fragen (FAQ)
            </h2>
            
            {faqs.map((category, idx) => {
              const Icon = category.icon;
              return (
                <div key={idx} className="mb-6 last:mb-0">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="w-5 h-5 text-slate-600" />
                    <h3 className="font-medium text-stone-800">{category.category}</h3>
                  </div>
                  
                  <Accordion type="single" collapsible className="space-y-2">
                    {category.questions.map((item, qIdx) => (
                      <AccordionItem 
                        key={qIdx} 
                        value={`${idx}-${qIdx}`}
                        className="border border-stone-200 rounded-lg px-4"
                      >
                        <AccordionTrigger className="text-left hover:no-underline">
                          <span className="text-sm md:text-base font-medium text-stone-700">
                            {item.q}
                          </span>
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

          {/* Contact Form */}
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-stone-200/50 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Mail className="w-6 h-6 text-slate-700" />
              <h2 className="text-xl font-semibold text-stone-800">Kontaktiere uns</h2>
            </div>

            {submitted ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-stone-800 mb-2">
                  Nachricht gesendet!
                </h3>
                <p className="text-stone-600 mb-6">
                  Wir melden uns so schnell wie möglich bei dir.
                </p>
                <Button
                  onClick={() => {
                    setSubmitted(false);
                    setSubject("");
                    setMessage("");
                  }}
                  variant="outline"
                >
                  Neue Nachricht senden
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Betreff
                  </label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Worum geht es?"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Nachricht
                  </label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Beschreibe dein Anliegen..."
                    rows={6}
                    required
                  />
                </div>

                {user && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                    📧 Wir antworten an: <strong>{user.email}</strong>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-slate-800 hover:bg-slate-900"
                  disabled={sendMessageMutation.isPending}
                >
                  {sendMessageMutation.isPending ? (
                    "Wird gesendet..."
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Nachricht senden
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>

          {/* Additional Resources */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Weitere Ressourcen</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Link to={createPageUrl("Datenschutz")}>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-all cursor-pointer">
                  <Shield className="w-6 h-6 mb-2" />
                  <p className="font-medium">Datenschutz</p>
                  <p className="text-sm opacity-80 mt-1">Wie wir deine Daten schützen</p>
                </div>
              </Link>
              <Link to={createPageUrl("Legal")}>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-all cursor-pointer">
                  <Book className="w-6 h-6 mb-2" />
                  <p className="font-medium">Rechtliches</p>
                  <p className="text-sm opacity-80 mt-1">Haftungsausschluss & Nutzungsbedingungen</p>
                </div>
              </Link>
              <Link to={createPageUrl("Impressum")}>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-all cursor-pointer">
                  <Mail className="w-6 h-6 mb-2" />
                  <p className="font-medium">Impressum</p>
                  <p className="text-sm opacity-80 mt-1">Angaben zum Betreiber</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}