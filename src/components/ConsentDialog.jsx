import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { createPageUrl } from "@/utils";

export default function ConsentDialog({
  type,
  onAccept,
  onDecline,
  open = true,
  isSubmitting = false,
  errorMessage = null,
}) {
  const [accepted, setAccepted] = useState(false);

  const configs = {
    registration: {
      title: "Datenschutz und Nutzungsbedingungen",
      description:
        "Bitte bestätige, dass du unserer Datenschutzerklärung und den Nutzungsbedingungen zustimmst, bevor du fortfährst.",
      checkbox:
        "Ich akzeptiere die Datenschutzerklärung und Nutzungsbedingungen",
    },
    registration_update: {
      title: "Datenschutz und Nutzungsbedingungen",
      description:
        "Bitte bestätige einmalig die aktuelle Datenschutzerklärung und die aktuellen Nutzungsbedingungen, bevor du die App weiter nutzt.",
      checkbox:
        "Ich akzeptiere die aktuelle Datenschutzerklärung und die aktuellen Nutzungsbedingungen",
    },
    photo: {
      title: "Foto-Freigabe & Urheberrecht",
      description:
        "Bitte bestätige, dass du die Nutzungsrechte an diesen Fotos besitzt und der Veröffentlichung zustimmst.",
      checkbox:
        "Ich bestätige, dass ich der Urheber oder Rechteinhaber dieser Fotos bin, und stimme der öffentlichen Veröffentlichung zu (Art. 6 Abs. 1 lit. a DSGVO).",
    },
    community: {
      title: "Öffentlicher Beitrag",
      description:
        "Dein Kommentar oder Rating wird öffentlich angezeigt und mit deinem Namen verknüpft.",
      checkbox:
        "Ich akzeptiere, dass mein Beitrag öffentlich sichtbar ist",
    },
  };

  const config = configs[type] || configs.registration;
  const isRegistrationConsent = type === "registration" || type === "registration_update";
  const canDecline = !isRegistrationConsent;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && canDecline) {
          onDecline?.();
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg bg-brand-50/70 p-3">
            <Checkbox
              id="consent"
              checked={accepted}
              onCheckedChange={(checked) => setAccepted(checked === true)}
            />
            <Label
              htmlFor="consent"
              className="flex-1 cursor-pointer text-sm font-medium"
            >
              {isRegistrationConsent ? (
                <>
                  Ich akzeptiere die aktuelle{" "}
                  <a
                    href={createPageUrl("Datenschutz")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Datenschutzerklärung
                  </a>{" "}
                  und die aktuellen{" "}
                  <a
                    href={createPageUrl("AGB")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Nutzungsbedingungen
                  </a>
                </>
              ) : (
                config.checkbox
              )}
            </Label>
          </div>

          {errorMessage && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {errorMessage}
            </p>
          )}

          <div className="flex gap-3">
            {canDecline && (
              <Button
                variant="outline"
                onClick={onDecline}
                className="flex-1"
              >
                Ablehnen
              </Button>
            )}
            <Button
              onClick={() => {
                if (accepted && !isSubmitting) {
                  onAccept();
                }
              }}
              disabled={!accepted || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Speichern..." : "Akzeptieren"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
