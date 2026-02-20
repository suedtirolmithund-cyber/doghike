import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User, Mail, Trash2, AlertTriangle, Send, Shield, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function AccountSettings({ user }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(user?.full_name || "");
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSent, setContactSent] = useState(false);

  const updateNameMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast.success("Name aktualisiert");
    }
  });

  const sendContactMutation = useMutation({
    mutationFn: async ({ subject, message }) => {
      await base44.integrations.Core.SendEmail({
        to: "[kontakt@beispiel.de]",
        subject: `Kontaktanfrage: ${subject}`,
        body: `Von: ${user?.full_name} (${user?.email})\n\nBetreff: ${subject}\n\n${message}`
      });
    },
    onSuccess: () => {
      setContactSent(true);
      setContactSubject("");
      setContactMessage("");
      toast.success("Nachricht gesendet");
    }
  });

  const handleDeleteAccount = async () => {
    await base44.integrations.Core.SendEmail({
      to: "[kontakt@beispiel.de]",
      subject: "Kontoloeschanfrage",
      body: `Nutzer ${user?.full_name} (${user?.email}) hat die Löschung seines Kontos und aller Daten beantragt.\n\nDatum: ${new Date().toLocaleString("de-DE")}`
    });
    toast.success("Löschanfrage gesendet. Wir melden uns innerhalb von 72 Stunden.");
  };

  return (
    <div className="space-y-6">

      {/* Profildaten ändern */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200/50 shadow-sm">
        <h3 className="text-base font-semibold text-stone-800 mb-4 flex items-center gap-2">
          <User className="w-4 h-4" /> Profildaten ändern
        </h3>
        <div className="space-y-4">
          <div>
            <Label className="text-sm text-stone-600 mb-1 block">E-Mail-Adresse</Label>
            <Input value={user?.email || ""} disabled className="bg-stone-50 text-stone-500" />
            <p className="text-xs text-stone-400 mt-1">Die E-Mail-Adresse kann nicht geändert werden.</p>
          </div>
          <div>
            <Label className="text-sm text-stone-600 mb-1 block">Anzeigename</Label>
            <div className="flex gap-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dein Name"
              />
              <Button
                onClick={() => updateNameMutation.mutate({ full_name: name })}
                disabled={updateNameMutation.isPending || name === user?.full_name}
                className="bg-slate-800 hover:bg-slate-700 shrink-0"
              >
                {updateNameMutation.isPending ? "..." : "Speichern"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Datenschutz & Rechte */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200/50 shadow-sm">
        <h3 className="text-base font-semibold text-stone-800 mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4" /> Datenschutz & deine Rechte
        </h3>
        <p className="text-sm text-stone-600 mb-4">
          Du hast das Recht auf Auskunft, Berichtigung, Löschung und Datenportabilität gemäß DSGVO.
        </p>
        <Link to={createPageUrl("Datenschutz")}>
          <Button variant="outline" size="sm" className="text-stone-700">
            <ExternalLink className="w-3 h-3 mr-2" />
            Datenschutzerklärung lesen
          </Button>
        </Link>
      </div>

      {/* Kontakt / Datenlöschung anfragen */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200/50 shadow-sm">
        <h3 className="text-base font-semibold text-stone-800 mb-4 flex items-center gap-2">
          <Mail className="w-4 h-4" /> Kontakt & Datenanfragen
        </h3>
        {contactSent ? (
          <div className="text-center py-6">
            <p className="text-green-700 font-medium mb-2">✅ Nachricht gesendet!</p>
            <p className="text-sm text-stone-500">Wir melden uns innerhalb von 72 Stunden.</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => setContactSent(false)}>
              Neue Anfrage
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-stone-500">
              Anfragen zu deinen Daten (Auskunft, Berichtigung, Kopie) oder sonstige Fragen:
            </p>
            <Input
              placeholder="Betreff (z.B. Datenauskunft, Datenkopie...)"
              value={contactSubject}
              onChange={(e) => setContactSubject(e.target.value)}
            />
            <Textarea
              placeholder="Deine Nachricht..."
              rows={3}
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
            />
            <Button
              onClick={() => sendContactMutation.mutate({ subject: contactSubject, message: contactMessage })}
              disabled={sendContactMutation.isPending || !contactSubject.trim() || !contactMessage.trim()}
              className="bg-slate-800 hover:bg-slate-700 w-full"
            >
              <Send className="w-4 h-4 mr-2" />
              {sendContactMutation.isPending ? "Wird gesendet..." : "Absenden"}
            </Button>
          </div>
        )}
      </div>

      {/* Konto löschen */}
      <div className="bg-white rounded-2xl p-5 border border-red-200 shadow-sm">
        <h3 className="text-base font-semibold text-red-700 mb-2 flex items-center gap-2">
          <Trash2 className="w-4 h-4" /> Konto & Daten löschen
        </h3>
        <p className="text-sm text-stone-600 mb-4">
          Du kannst die Löschung deines Kontos und <strong>aller deiner Daten</strong> (Wanderungen, Fotos, Hundeprofil, Kommentare, Routen) beantragen.
          Wir bearbeiten deine Anfrage innerhalb von 72 Stunden.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Konto löschen beantragen
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Konto wirklich löschen?</AlertDialogTitle>
              <AlertDialogDescription>
                Damit beantragst du die dauerhafte Löschung deines Kontos und <strong>aller</strong> deiner gespeicherten Daten (Wanderungen, Fotos, Hundeprofil, Kommentare, Routen, Bewertungen). Dieser Vorgang kann nicht rückgängig gemacht werden.<br /><br />
                Wir senden dir eine Bestätigung per E-Mail und löschen deine Daten innerhalb von 72 Stunden.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Ja, Konto löschen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

    </div>
  );
}