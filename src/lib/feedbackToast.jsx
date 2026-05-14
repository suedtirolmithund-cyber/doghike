import { CheckCircle2, Heart, ImagePlus, Mail, PawPrint, UserPlus } from "lucide-react";
import { toast } from "sonner";

function successToast(title, description, icon) {
  toast.success(title, {
    description,
    icon,
    duration: 2800,
  });
}

export function showSavedFeedback(title = "Gespeichert", description = "Deine Änderung ist jetzt sicher da.") {
  successToast(title, description, <CheckCircle2 className="h-4 w-4 text-brand-500" />);
}

export function showSentFeedback(title = "Gesendet", description = "Deine Nachricht ist angekommen.") {
  successToast(title, description, <Mail className="h-4 w-4 text-brand-500" />);
}

export function showUploadedFeedback(title = "Hochgeladen", description = "Deine Datei ist jetzt dabei.") {
  successToast(title, description, <ImagePlus className="h-4 w-4 text-brand-500" />);
}

export function showFriendFeedback(title = "Freund hinzugefügt", description = "Jetzt könnt ihr Touren teilen.") {
  successToast(title, description, <UserPlus className="h-4 w-4 text-brand-500" />);
}

export function showDogFeedback(title = "Wanderbuddy gespeichert", description = "Dein Hund ist jetzt mit dabei.") {
  successToast(title, description, <PawPrint className="h-4 w-4 text-brand-500" />);
}

export function showSavedTourFeedback(title = "Zur Merkliste hinzugefügt", description = "Die Tour wartet jetzt auf dich.") {
  successToast(title, description, <Heart className="h-4 w-4 text-brand-500" />);
}
