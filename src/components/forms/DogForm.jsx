import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { uploadFile, deleteStoredFile } from "@/lib/profilesApi";
import { getImageUploadErrorMessage } from "@/lib/uploadValidation";
import { useAuth } from "@/lib/AuthContext";
import { Dog, Upload, Loader2 } from "lucide-react";

export default function DogForm({ dog, onSave, onCancel }) {
  const { user } = useAuth();
  const originalPhotoUrl = dog?.photo_url || "";
  const [formData, setFormData] = useState({
    name: dog?.name || "",
    breed: dog?.breed || "",
    photo_url: originalPhotoUrl,
    birth_date: dog?.birth_date || "",
    notes: dog?.notes || "",
    favorite_food: dog?.favorite_food || "",
    character: dog?.character || "",
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [validationError, setValidationError] = useState("");
  const [temporaryUploadedPhotoUrl, setTemporaryUploadedPhotoUrl] = useState(null);

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !user) return;

    setUploading(true);
    setUploadError(null);

    try {
      const url = await uploadFile("dog-photos", user.id, file);
      setFormData((previous) => ({ ...previous, photo_url: url }));

      if (temporaryUploadedPhotoUrl && temporaryUploadedPhotoUrl !== url) {
        try {
          await deleteStoredFile(temporaryUploadedPhotoUrl, "dog-photos");
        } catch (cleanupError) {
          console.error("Dog photo cleanup failed:", cleanupError);
        }
      }

      setTemporaryUploadedPhotoUrl(url);
    } catch (error) {
      setUploadError(getImageUploadErrorMessage(error));
      console.error("Dog photo upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedName = formData.name.trim();

    if (!trimmedName) {
      setValidationError("Bitte gib einen Namen für deinen Hund ein.");
      return;
    }

    setValidationError("");
    setSaving(true);
    try {
      await onSave({ ...formData, name: trimmedName });

      if (
        originalPhotoUrl &&
        temporaryUploadedPhotoUrl &&
        originalPhotoUrl !== temporaryUploadedPhotoUrl
      ) {
        try {
          await deleteStoredFile(originalPhotoUrl, "dog-photos");
        } catch (cleanupError) {
          console.error("Dog photo cleanup failed after save:", cleanupError);
        }
      }

      setTemporaryUploadedPhotoUrl(null);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (temporaryUploadedPhotoUrl && temporaryUploadedPhotoUrl !== originalPhotoUrl) {
      try {
        await deleteStoredFile(temporaryUploadedPhotoUrl, "dog-photos");
      } catch (cleanupError) {
        console.error("Temporary dog photo cleanup failed:", cleanupError);
      }
    }

    onCancel?.();
  };

  return (
    <form onSubmit={handleSubmit} className="doghike-glass-card space-y-6 p-4 sm:p-5">
      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gradient-to-br from-brand-50 via-white to-brand-50">
            {formData.photo_url ? (
              <img
                src={formData.photo_url}
                alt={formData.name || "Hund"}
                className="w-full h-full object-cover"
                onError={(event) => {
                  event.target.onerror = null;
                  event.target.src = `https://api.dicebear.com/7.x/thumbs/svg?seed=${formData.name}&backgroundColor=f5f5f4`;
                }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-brand-400">
                <Dog className="h-12 w-12" />
              </div>
            )}
          </div>
          <label className="absolute bottom-0 right-0 p-2 bg-brand-400 text-white rounded-full cursor-pointer hover:bg-brand-600 transition-colors shadow-lg">
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
              disabled={uploading}
            />
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
          </label>
        </div>
        {uploadError && (
          <p className="text-xs text-brand-400 text-center max-w-xs">{uploadError}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(event) => {
              setFormData({ ...formData, name: event.target.value });
              if (validationError) {
                setValidationError("");
              }
            }}
            placeholder="z.B. Luna"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="breed">Rasse</Label>
          <Input
            id="breed"
            value={formData.breed}
            onChange={(event) => setFormData({ ...formData, breed: event.target.value })}
            placeholder="z.B. Border Collie oder Mischling"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="birth_date">Geburtsdatum</Label>
          <Input
            id="birth_date"
            type="date"
            value={formData.birth_date}
            onChange={(event) => setFormData({ ...formData, birth_date: event.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="character">Charakter</Label>
          <Input
            id="character"
            value={formData.character}
            onChange={(event) => setFormData({ ...formData, character: event.target.value })}
            placeholder="z.B. verspielt, ruhig, aktiv..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="favorite_food">Lieblingsfutter</Label>
          <Input
            id="favorite_food"
            value={formData.favorite_food}
            onChange={(event) => setFormData({ ...formData, favorite_food: event.target.value })}
            placeholder="z.B. Leberwurst, Käse..."
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notizen / Lieblingsroute</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(event) => setFormData({ ...formData, notes: event.target.value })}
          placeholder="z.B. Pragser Wildsee Rundweg, Drei Zinnen..."
          rows={3}
        />
      </div>

      {validationError && (
        <p className="text-sm text-brand-400">{validationError}</p>
      )}

      <div className="flex gap-3 justify-end pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={handleCancel}>
            Abbrechen
          </Button>
        )}
        <Button
          type="submit"
          disabled={saving || uploading}
          className="bg-brand-400 hover:bg-brand-600"
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Speichern...</>
          ) : (
            dog ? "Aktualisieren" : "Hund hinzufügen"
          )}
        </Button>
      </div>
    </form>
  );
}
