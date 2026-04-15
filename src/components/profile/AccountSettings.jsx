import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
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

export default function AccountSettings({ user }) {
  const [deleteRequested, setDeleteRequested] = useState(false);

  const handleDeleteAccount = async () => {
    // Sign the user out immediately so they can't continue using the app
    await supabase.auth.signOut();
    setDeleteRequested(true);
    toast.success("Abgemeldet. Dein Konto wird innerhalb von 72 Stunden gelöscht.");
  };

  if (deleteRequested) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-stone-200/50 shadow-sm text-center space-y-3">
        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
        <h3 className="font-semibold text-stone-800">Löschanfrage registriert</h3>
        <p className="text-sm text-stone-500">
          Du wirst abgemeldet. Dein Konto und alle deine Daten werden innerhalb von 72 Stunden gelöscht.
          Schreib uns an <strong>[kontakt@beispiel.de]</strong>, falls du Fragen hast.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Profildaten */}
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
              href="mailto:[kontakt@beispiel.de]?subject=E-Mail-Änderung"
              className="text-emerald-600 hover:underline"
            >
              Kontaktanfrage
            </a>{" "}
            beantragt werden.
          </p>
        </div>
      </div>

      {/* Datenschutz */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200/50 shadow-sm">
        <h3 className="text-base font-semibold text-stone-800 mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4" /> Datenschutz & deine Rechte
        </h3>
        <div className="space-y-3 text-sm text-stone-600">
          <p>Du hast das Recht auf Auskunft, Berichtigung, Löschung und Datenportabilität gemäß DSGVO.
          Deine Daten werden auf EU-Servern in Frankfurt (Supabase) gespeichert.</p>
          <div className="flex flex-wrap gap-2">
            <Link to={createPageUrl("Datenschutz")}>
              <Button variant="outline" size="sm" className="text-stone-700">
                <ExternalLink className="w-3 h-3 mr-2" />
                Datenschutzerklärung
              </Button>
            </Link>
            <a href="mailto:[kontakt@beispiel.de]?subject=DSGVO-Anfrage">
              <Button variant="outline" size="sm" className="text-stone-700">
                <Mail className="w-3 h-3 mr-2" />
                Datenauskunft anfragen
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Konto löschen */}
      <div className="bg-white rounded-2xl p-5 border border-red-200 shadow-sm">
        <h3 className="text-base font-semibold text-red-700 mb-2 flex items-center gap-2">
          <Trash2 className="w-4 h-4" /> Konto & alle Daten löschen
        </h3>
        <p className="text-sm text-stone-600 mb-4">
          Du kannst die vollständige Löschung deines Kontos und <strong>aller deiner Daten</strong>{" "}
          (Wanderungen, Fotos, Hundeprofil, Kommentare, Routen, Bewertungen) beantragen.
          Dies entspricht deinem <strong>Recht auf Vergessenwerden (Art. 17 DSGVO)</strong>.
          Deine Daten werden innerhalb von 72 Stunden gelöscht.
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
              <AlertDialogTitle>Konto wirklich löschen?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-2 text-sm text-stone-600">
                  <p>
                    Damit beantragst du die dauerhafte Löschung deines Kontos und{" "}
                    <strong>aller</strong> deiner gespeicherten Daten:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Profil & E-Mail-Adresse</li>
                    <li>Alle Wanderungen & Fotos</li>
                    <li>Hundeprofil</li>
                    <li>Kommentare & Bewertungen</li>
                    <li>Routen & GPS-Daten</li>
                  </ul>
                  <p className="font-medium text-red-600">
                    Dieser Vorgang kann nicht rückgängig gemacht werden.
                  </p>
                  <p>
                    Du wirst sofort abgemeldet. Daten werden innerhalb von 72 Stunden gelöscht.
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
                Ja, Konto löschen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

    </div>
  );
}
