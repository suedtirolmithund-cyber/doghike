import { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User, Mail, Trash2, AlertTriangle, Shield, ExternalLink, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const SUPPORT_EMAIL = "suedtirolmithund@gmail.com";

export default function AccountSettings({ user }) {
  const [deleteRequested, setDeleteRequested] = useState(false);

  const handleDeleteAccount = async () => {
    const subject = encodeURIComponent("Löschanfrage Konto");
    const body = encodeURIComponent(
      `Hallo,\n\nich möchte die Löschung meines Kontos beantragen.\n\nE-Mail: ${user?.email || ""}\nUser ID: ${user?.id || ""}\n\nBitte bestätigt mir die Anfrage.\n`
    );

    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
    setDeleteRequested(true);
    toast.success("Löschanfrage vorbereitet. Bitte sende die E-Mail ab.");
  };

  if (deleteRequested) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-stone-200/50 shadow-sm text-center space-y-3">
        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
        <h3 className="font-semibold text-stone-800">Löschanfrage vorbereitet</h3>
        <p className="text-sm text-stone-500">
          Deine Mail-App wurde geöffnet. Bitte sende die E-Mail an <strong>{SUPPORT_EMAIL}</strong> ab,
          damit die Löschung deines Kontos bearbeitet werden kann.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-5 border border-stone-200/50 shadow-sm">
        <h3 className="text-base font-semibold text-stone-800 mb-4 flex items-center gap-2">
          <User className="w-4 h-4" /> Profildaten
        </h3>
        <div>
          <Label className="text-sm text-stone-600 mb-1 block">E-Mail-Adresse</Label>
          <Input value={user?.email || ""} disabled className="bg-stone-50 text-stone-500" />
          <p className="text-xs text-stone-400 mt-1">
            E-Mail-Änderungen können über{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=E-Mail-Aenderung`}
              className="text-emerald-600 hover:underline"
            >
              Kontaktanfrage
            </a>{" "}
            beantragt werden.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-stone-200/50 shadow-sm">
        <h3 className="text-base font-semibold text-stone-800 mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4" /> Datenschutz & deine Rechte
        </h3>
        <div className="space-y-3 text-sm text-stone-600">
          <p>
            Du hast das Recht auf Auskunft, Berichtigung, Löschung und Datenportabilität gemäß DSGVO.
            Deine Daten werden auf EU-Servern in Frankfurt (Supabase) gespeichert.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link to={createPageUrl("Datenschutz")}>
              <Button variant="outline" size="sm" className="text-stone-700">
                <ExternalLink className="w-3 h-3 mr-2" />
                Datenschutzerklärung
              </Button>
            </Link>
            <a href={`mailto:${SUPPORT_EMAIL}?subject=DSGVO-Anfrage`}>
              <Button variant="outline" size="sm" className="text-stone-700">
                <Mail className="w-3 h-3 mr-2" />
                Datenauskunft anfragen
              </Button>
            </a>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-red-200 shadow-sm">
        <h3 className="text-base font-semibold text-red-700 mb-2 flex items-center gap-2">
          <Trash2 className="w-4 h-4" /> Konto & alle Daten löschen
        </h3>
        <p className="text-sm text-stone-600 mb-4">
          Du kannst die vollständige Löschung deines Kontos und <strong>aller deiner Daten</strong>{" "}
          (Wanderungen, Fotos, Hundeprofil, Kommentare, Routen, Bewertungen) beantragen.
          Die Anfrage wird per E-Mail vorbereitet und danach manuell bearbeitet.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Konto löschen
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Konto-Löschung anfragen?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-2 text-sm text-stone-600">
                  <p>
                    Damit bereitest du eine E-Mail für die dauerhafte Löschung deines Kontos und{" "}
                    <strong>aller</strong> deiner gespeicherten Daten vor:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Profil & E-Mail-Adresse</li>
                    <li>Alle Wanderungen & Fotos</li>
                    <li>Hundeprofil</li>
                    <li>Kommentare & Bewertungen</li>
                    <li>Routen & GPS-Daten</li>
                  </ul>
                  <p className="font-medium text-red-600">
                    Die Löschung selbst wird nicht sofort in der App ausgeführt.
                  </p>
                  <p>
                    Es wird deine Mail-App geöffnet. Danach musst du die Anfrage noch absenden.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                E-Mail vorbereiten
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
