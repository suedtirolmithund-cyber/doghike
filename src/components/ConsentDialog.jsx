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

export default function ConsentDialog({ type, onAccept, onDecline, open = true }) {
  const [accepted, setAccepted] = useState(false);

  const configs = {
    registration: {
      title: "Datenschutz und Nutzungsbedingungen",
      description:
        "Bitte bestätige, dass du unseren Datenschutzerklärungen zustimmst, bevor du fortfährst.",
      checkbox:
        "Ich akzeptiere die Datenschutzerklärung und Nutzungsbedingungen",
    },
    photo: {
      title: "Foto-Freigabe bestätigen",
      description:
        "Diese Fotos werden öffentlich geteilt und können von anderen Nutzern gesehen werden.",
      checkbox:
        "Ich akzeptiere, dass diese Fotos öffentlich sichtbar sind",
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

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen && type !== "registration") {
        onDecline?.();
      }
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
            <Checkbox
              id="consent"
              checked={accepted}
              onCheckedChange={setAccepted}
            />
            <Label
              htmlFor="consent"
              className="text-sm font-medium cursor-pointer flex-1"
            >
              {config.checkbox}
            </Label>
          </div>

          <div className="flex gap-3">
            {type !== "registration" && (
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
                if (accepted) {
                  onAccept();
                }
              }}
              disabled={!accepted}
              className="flex-1"
            >
              Akzeptieren
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}