import { useEffect, useState } from "react";
import { Loader2, MoveHorizontal, MoveVertical } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

export default function ImagePositionEditorDialog({
  open,
  onOpenChange,
  sourceUrl,
  title = "Bild anpassen",
  description = "Ziehe den Ausschnitt so, wie er später zu sehen sein soll.",
  previewShape = "circle",
  confirmLabel = "Ausschnitt speichern",
  isSaving = false,
  onConfirm,
}) {
  const [focusX, setFocusX] = useState(50);
  const [focusY, setFocusY] = useState(50);

  useEffect(() => {
    if (!open) return;
    setFocusX(50);
    setFocusY(50);
  }, [open, sourceUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <p className="text-sm leading-relaxed text-slate-500">{description}</p>

          <div className="flex justify-center">
            <div
              className={`overflow-hidden border-4 border-white bg-brand-50 shadow-lg ${
                previewShape === "circle" ? "h-56 w-56 rounded-full" : "h-56 w-56 rounded-[28px]"
              }`}
            >
              {sourceUrl ? (
                <img
                  src={sourceUrl}
                  alt="Vorschau"
                  className="h-full w-full object-cover"
                  style={{ objectPosition: `${focusX}% ${focusY}%` }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
                  Kein Bild ausgewählt
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label className="flex items-center gap-2 text-sm text-slate-600">
                  <MoveHorizontal className="h-4 w-4" />
                  Links / rechts
                </Label>
                <span className="text-xs font-semibold text-slate-400">{Math.round(focusX)}%</span>
              </div>
              <Slider value={[focusX]} min={0} max={100} step={1} onValueChange={(value) => setFocusX(value[0] ?? 50)} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label className="flex items-center gap-2 text-sm text-slate-600">
                  <MoveVertical className="h-4 w-4" />
                  Oben / unten
                </Label>
                <span className="text-xs font-semibold text-slate-400">{Math.round(focusY)}%</span>
              </div>
              <Slider value={[focusY]} min={0} max={100} step={1} onValueChange={(value) => setFocusY(value[0] ?? 50)} />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Abbrechen
            </Button>
            <Button
              type="button"
              className="bg-brand-400 hover:bg-brand-600"
              disabled={!sourceUrl || isSaving}
              onClick={() => onConfirm?.({ focusX, focusY })}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Speichert...
                </>
              ) : (
                confirmLabel
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
