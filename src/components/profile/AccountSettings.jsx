import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User, Mail, Trash2, AlertTriangle, Shield, ExternalLink } from "lucide-react";
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
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";

const SUPPORT_EMAIL = "suedtirolmithund@gmail.com";

export default function AccountSettings({ user }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.rpc("delete_own_account");
      if (error) throw error;

      await logout();
      toast.success("Dein Konto und alle zugehörigen Daten wurden gelöscht.");
      navigate(createPageUrl("Login"), { replace: true });
    } catch (error) {
      console.error("[AccountSettings] account deletion failed:", error);
      const message = String(error?.message || "").toLowerCase();

      if (message.includes("not_authenticated")) {
        toast.error("Du bist gerade nicht mehr angemeldet. Bitte melde dich neu an und versuche es erneut.");
      } else {
        toast.error("Dein Konto konnte gerade nicht gelöscht werden. Bitte versuche es noch einmal.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="doghike-glass-card p-5">
        <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <User className="w-4 h-4" /> Profildaten
        </h3>
        <div>
          <Label className="text-sm text-slate-600 mb-1 block">E-Mail-Adresse</Label>
          <Input value={user?.email || ""} disabled className="bg-sky-50 text-slate-500" />
          <p className="text-xs text-slate-400 mt-1">
            E-Mail-Änderungen können über{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=E-Mail-Änderung`}
              className="text-brand-400 hover:underline"
            >
              Kontaktanfrage
            </a>{" "}
            beantragt werden.
          </p>
        </div>
      </div>

      <div className="doghike-glass-card p-5">
        <h3 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4" /> Datenschutz & deine Rechte
        </h3>
        <div className="space-y-3 text-sm text-slate-600">
          <p>
            Du hast das Recht auf Auskunft, Berichtigung, Loeschung und Datenportabilitaet gemaess DSGVO.
            Deine Daten werden auf EU-Servern in Frankfurt (Supabase) gespeichert.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link to={createPageUrl("Datenschutz")}>
              <Button variant="outline" size="sm" className="text-slate-700">
                <ExternalLink className="w-3 h-3 mr-2" />
                Datenschutzerklaerung
              </Button>
            </Link>
            <a href={`mailto:${SUPPORT_EMAIL}?subject=DSGVO-Anfrage`}>
              <Button variant="outline" size="sm" className="text-slate-700">
                <Mail className="w-3 h-3 mr-2" />
                Datenauskunft anfragen
              </Button>
            </a>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-5 shadow-[0_14px_35px_rgba(16,47,74,0.08)] backdrop-blur-xl">
        <h3 className="text-base font-semibold text-red-700 mb-2 flex items-center gap-2">
          <Trash2 className="w-4 h-4" /> Konto & alle Daten löschen
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          Du kannst die vollstaendige Loeschung deines Kontos und <strong>aller deiner Daten</strong>{" "}
          direkt ausfuehren.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              disabled={isDeleting}
              className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              {isDeleting ? "Konto wird gelöscht..." : "Konto löschen"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Konto endgültig löschen?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-2 text-sm text-slate-600">
                  <p>
                    Damit loeschst du dein Konto und <strong>alle</strong> deine gespeicherten Daten:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Profil & E-Mail-Adresse</li>
                    <li>Alle Wanderungen & Fotos</li>
                    <li>Hundeprofil</li>
                    <li>Kommentare & Bewertungen</li>
                    <li>Freundschaften</li>
                    <li>Routen & GPS-Daten</li>
                  </ul>
                  <p className="font-medium text-red-600">
                    Diese Löschung ist endgültig und kann nicht rückgängig gemacht werden.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? "Wird gelöscht..." : "Jetzt endgültig löschen"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
