import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { base44 } from "@/api/base44Client";
import { Upload, X, Loader2, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function HikeForm({ hike, dogs = [], onSave, onCancel }) {
  const [formData, setFormData] = useState(hike || {
    trail_name: "",
    location: "",
    date: new Date().toISOString().split("T")[0],
    distance_km: "",
    elevation_gain_m: "",
    duration_minutes: "",
    difficulty: "3",
    dog_difficulty: "3",
    season: "all_year",
    water_availability: "moderate",
    hazard_notes: "",
    parking_info: "",
    restaurant_info: "",
    dogs: [],
    photos: [],
    latitude: "",
    longitude: "",
    notes: "",
    rating: 5
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const uploadedUrls = [];

    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      uploadedUrls.push(file_url);
    }

    setFormData(prev => ({
      ...prev,
      photos: [...(prev.photos || []), ...uploadedUrls]
    }));
    setUploading(false);
  };

  const removePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const toggleDog = (dogId) => {
    setFormData(prev => ({
      ...prev,
      dogs: prev.dogs?.includes(dogId)
        ? prev.dogs.filter(id => id !== dogId)
        : [...(prev.dogs || []), dogId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    const dataToSave = {
      ...formData,
      distance_km: formData.distance_km ? Number(formData.distance_km) : null,
      elevation_gain_m: formData.elevation_gain_m ? Number(formData.elevation_gain_m) : null,
      duration_minutes: formData.duration_minutes ? Number(formData.duration_minutes) : null,
      latitude: formData.latitude ? Number(formData.latitude) : null,
      longitude: formData.longitude ? Number(formData.longitude) : null,
      rating: formData.rating ? Number(formData.rating) : null
    };

    await onSave(dataToSave);
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="trail_name">Name der Tour *</Label>
          <Input
            id="trail_name"
            value={formData.trail_name}
            onChange={(e) => setFormData({ ...formData, trail_name: e.target.value })}
            placeholder="z.B. Drei Zinnen Umrundung"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Ort / Region</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="z.B. Sexten, Südtirol"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Datum *</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="difficulty">Schwierigkeit (Mensch) 👤</Label>
          <Select
            value={formData.difficulty}
            onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Wählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Stufe 1</SelectItem>
              <SelectItem value="2">Stufe 2</SelectItem>
              <SelectItem value="3">Stufe 3</SelectItem>
              <SelectItem value="4">Stufe 4</SelectItem>
              <SelectItem value="5">Stufe 5</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dog_difficulty">Schwierigkeit (Hund) 🐕</Label>
          <Select
            value={formData.dog_difficulty}
            onValueChange={(value) => setFormData({ ...formData, dog_difficulty: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Wählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Stufe 1</SelectItem>
              <SelectItem value="2">Stufe 2</SelectItem>
              <SelectItem value="3">Stufe 3</SelectItem>
              <SelectItem value="4">Stufe 4</SelectItem>
              <SelectItem value="5">Stufe 5</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="season">Beste Jahreszeit</Label>
          <Select
            value={formData.season}
            onValueChange={(value) => setFormData({ ...formData, season: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Wählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="spring">🌸 Frühling</SelectItem>
              <SelectItem value="summer">☀️ Sommer</SelectItem>
              <SelectItem value="autumn">🍂 Herbst</SelectItem>
              <SelectItem value="winter">❄️ Winter</SelectItem>
              <SelectItem value="all_year">🍃 Ganzjährig</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="water_availability">Wasser unterwegs 💧</Label>
          <Select
            value={formData.water_availability}
            onValueChange={(value) => setFormData({ ...formData, water_availability: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Wählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">🚫 Kein Wasser</SelectItem>
              <SelectItem value="little">💧 Wenig Wasser</SelectItem>
              <SelectItem value="moderate">💧💧 Etwas Wasser</SelectItem>
              <SelectItem value="plenty">💧💧💧 Viel Wasser</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="distance">Strecke (km)</Label>
          <Input
            id="distance"
            type="number"
            step="0.1"
            value={formData.distance_km}
            onChange={(e) => setFormData({ ...formData, distance_km: e.target.value })}
            placeholder="12.5"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="elevation">Höhenmeter (m)</Label>
          <Input
            id="elevation"
            type="number"
            value={formData.elevation_gain_m}
            onChange={(e) => setFormData({ ...formData, elevation_gain_m: e.target.value })}
            placeholder="850"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Gehzeit (Minuten)</Label>
          <Input
            id="duration"
            type="number"
            value={formData.duration_minutes}
            onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
            placeholder="240"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="latitude">Breitengrad (Ausgangspunkt)</Label>
          <Input
            id="latitude"
            type="number"
            step="any"
            value={formData.latitude}
            onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
            placeholder="46.6185"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="longitude">Längengrad (Ausgangspunkt)</Label>
          <Input
            id="longitude"
            type="number"
            step="any"
            value={formData.longitude}
            onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
            placeholder="12.3024"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Bewertung</Label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setFormData({ ...formData, rating: star })}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                className={`w-8 h-8 ${
                  star <= (formData.rating || 0)
                    ? "fill-amber-400 text-amber-400"
                    : "text-stone-300"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {dogs.length > 0 && (
        <div className="space-y-3">
          <Label>Hunde auf dieser Tour</Label>
          <div className="flex flex-wrap gap-4">
            {dogs.map((dog) => (
              <label
                key={dog.id}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  formData.dogs?.includes(dog.id)
                    ? "border-slate-700 bg-slate-50"
                    : "border-stone-200 hover:border-stone-300"
                }`}
              >
                <Checkbox
                  checked={formData.dogs?.includes(dog.id)}
                  onCheckedChange={() => toggleDog(dog.id)}
                />
                <img
                  src={dog.photo_url || `https://api.dicebear.com/7.x/thumbs/svg?seed=${dog.name}`}
                  alt={dog.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <span className="font-medium text-stone-700">{dog.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <Label>Fotos</Label>
        <div className="flex flex-wrap gap-4">
          <AnimatePresence>
            {formData.photos?.map((url, index) => (
              <motion.div
                key={url}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative group"
              >
                <img
                  src={url}
                  alt={`Foto ${index + 1}`}
                  className="w-24 h-24 object-cover rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          
          <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-stone-300 rounded-xl cursor-pointer hover:border-slate-500 transition-colors">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
              disabled={uploading}
            />
            {uploading ? (
              <Loader2 className="w-6 h-6 text-stone-400 animate-spin" />
            ) : (
              <>
                <Upload className="w-6 h-6 text-stone-400" />
                <span className="text-xs text-stone-400 mt-1">Fotos hinzufügen</span>
              </>
            )}
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="parking_info">🅿️ Ausgangspunkt & Parken (optional)</Label>
        <Textarea
          id="parking_info"
          value={formData.parking_info}
          onChange={(e) => setFormData({ ...formData, parking_info: e.target.value })}
          placeholder="z.B. Großer Parkplatz am Pragser Wildsee, Adresse: Via Prags 107..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="restaurant_info">🍽️ Einkehrmöglichkeiten (optional)</Label>
        <Textarea
          id="restaurant_info"
          value={formData.restaurant_info}
          onChange={(e) => setFormData({ ...formData, restaurant_info: e.target.value })}
          placeholder="z.B. Seekofel Hütte (2324m), Auronzo-Hütte am Drei Zinnen Blick..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="hazard_notes">⚠️ Achtung - Gefahrenstellen (optional)</Label>
        <Textarea
          id="hazard_notes"
          value={formData.hazard_notes}
          onChange={(e) => setFormData({ ...formData, hazard_notes: e.target.value })}
          placeholder="z.B. steile Passagen, Leitern, Seilsicherungen, Kühe auf der Alm..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Beschreibung & Tipps</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Wegbeschaffenheit, Highlights, besondere Ausblicke..."
          rows={4}
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
              Wird gespeichert...
            </>
          ) : (
            hike ? "Tour aktualisieren" : "Tour hinzufügen"
          )}
        </Button>
      </div>
    </form>
  );
}