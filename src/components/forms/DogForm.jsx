import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { Upload, Loader2 } from "lucide-react";

export default function DogForm({ dog, onSave, onCancel }) {
  const [formData, setFormData] = useState(dog || {
    name: "",
    breed: "",
    photo_url: "",
    birth_date: "",
    notes: ""
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData(prev => ({ ...prev, photo_url: file_url }));
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(formData);
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col items-center gap-4 mb-6">
        <div className="relative">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-stone-100">
            {formData.photo_url ? (
              <img
                src={formData.photo_url}
                alt={formData.name || "Dog"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-stone-400">
                🐕
              </div>
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
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Luna"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="breed">Rasse oder Mischling</Label>
          <Input
            id="breed"
            value={formData.breed}
            onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
            placeholder="z.B. Border Collie oder Mischling"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="birth_date">Geburtsdatum</Label>
          <Input
            id="birth_date"
            type="date"
            value={formData.birth_date}
            onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Beschreibung</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Lieblingsrouten, Besonderheiten, Trainingsnotizen..."
          rows={3}
        />
      </div>

      <div className="flex gap-3 justify-end pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Abbrechen
          </Button>
        )}
        <Button
          type="submit"
          disabled={saving}
          className="bg-slate-800 hover:bg-slate-900"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Speichern...
            </>
          ) : (
            dog ? "Hund aktualisieren" : "Hund hinzufügen"
          )}
        </Button>
      </div>
    </form>
  );
}