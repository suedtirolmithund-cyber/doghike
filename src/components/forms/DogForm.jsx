import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { uploadFile } from "@/lib/profilesApi";
import { useAuth } from "@/lib/AuthContext";
import { Upload, Loader2 } from "lucide-react";

export default function DogForm({ dog, onSave, onCancel }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState(dog || {
    name: "",
    breed: "",
    photo_url: "",
    birth_date: "",
    notes: "",
    favorite_food: "",
    character: "",
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;
    setUploading(true);
    setUploadError(null);
    try {
      const url = await uploadFile("dog-photos", user.id, file);
      setFormData((prev) => ({ ...prev, photo_url: url }));
    } catch (err) {
      setUploadError("Foto-Upload fehlgeschlagen. Bitte prüfe ob der Bucket 'dog-photos' in Supabase angelegt ist.");
      console.error("Dog photo upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Photo upload */}
      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-stone-100">
            {formData.photo_url ? (
              <img
                src={formData.photo_url}
                alt={formData.name || "Hund"}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.onerror = null; e.target.src = `https://api.dicebear.com/7.x/thumbs/svg?seed=${formData.name}&backgroundColor=f5f5f4`; }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl">🐕</div>
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
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="z.B. Luna"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="breed">Rasse</Label>
          <Input
            id="breed"
            value={formData.breed}
            onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
            placeholder="z.B. Border Collie oder Mischling"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="birth_date">Geburtsdatum</Label>
          <Input
            id="birth_date"
            type="date"
            value={formData.birth_date}
            onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="character">Charakter</Label>
          <Input
            id="character"
            value={formData.character}
            onChange={(e) => setFormData({ ...formData, character: e.target.value })}
            placeholder="z.B. verspielt, ruhig, aktiv..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="favorite_food">Lieblingsfutter</Label>
          <Input
            id="favorite_food"
            value={formData.favorite_food}
            onChange={(e) => setFormData({ ...formData, favorite_food: e.target.value })}
            placeholder="z.B. Leberwurst, Käse..."
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notizen / Lieblingsroute</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
