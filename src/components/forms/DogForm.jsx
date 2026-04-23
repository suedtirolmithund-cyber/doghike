import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { uploadFile, deleteStoredFile } from "@/lib/profilesApi";
import { useAuth } from "@/lib/AuthContext";
import { Upload, Loader2 } from "lucide-react";

export default function DogForm({ dog, onSave, onCancel }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: dog?.name || "",
    breed: dog?.breed || "",
    photo_url: dog?.photo_url || "",
    birth_date: dog?.birth_date || "",
    notes: dog?.notes || "",
    favorite_food: dog?.favorite_food || "",
    character: dog?.character || "",
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !user) return;

    setUploading(true);
    setUploadError(null);

    try {
      const previousPhotoUrl = formData.photo_url || null;
      const url = await uploadFile("dog-photos", user.id, file);
      setFormData((previous) => ({ ...previous, photo_url: url }));

      if (previousPhotoUrl && previousPhotoUrl !== url) {
        try {
          await deleteStoredFile(previousPhotoUrl, "dog-photos");
        } catch (cleanupError) {
          console.error("Dog photo cleanup failed:", cleanupError);
        }
      }
    } catch (error) {
      setUploadError("Das Foto konnte gerade nicht hochgeladen werden. Bitte versuche es noch einmal.");
      console.error("Dog photo upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-stone-100">
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
              <div className="w-full h-full flex items-center justify-center text-4xl">Hund</div>
            )}
          </div>
          <label className="absolute bottom-0 right-0 p-2 bg-slate-800 text-white rounded-full cursor-pointer hover:bg-slate-900 transition-colors shadow-lg">
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
          <p className="text-xs text-red-600 text-center max-w-xs">{uploadError}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(event) => setFormData({ ...formData, name: event.target.value })}
            placeholder="z.B. Luna"
            required
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
            placeholder="z.B. Leberwurst, Kaese..."
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

      <div className="flex gap-3 justify-end pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Abbrechen
          </Button>
        )}
        <Button
          type="submit"
          disabled={saving || uploading}
          className="bg-slate-800 hover:bg-slate-900"
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
