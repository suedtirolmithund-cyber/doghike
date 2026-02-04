import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Upload, X, Loader2, Star, CheckCircle, Mountain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SubmitHike() {
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    trail_name: "",
    location: "",
    date: new Date().toISOString().split("T")[0],
    distance_km: "",
    elevation_gain_m: "",
    duration_minutes: "",
    difficulty: "moderate",
    dog_difficulty: "moderate",
    season: "all_year",
    water_availability: "moderate",
    hazard_notes: "",
    parking_info: "",
    restaurant_info: "",
    photos: [],
    latitude: "",
    longitude: "",
    notes: "",
    weather: "sunny",
    rating: 5,
    submitted_by_name: "",
    submitted_by_email: "",
    status: "pending"
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Hike.create(data),
    onSuccess: () => setSubmitted(true)
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const dataToSave = {
      ...formData,
      distance_km: formData.distance_km ? Number(formData.distance_km) : null,
      elevation_gain_m: formData.elevation_gain_m ? Number(formData.elevation_gain_m) : null,
      duration_minutes: formData.duration_minutes ? Number(formData.duration_minutes) : null,
      latitude: formData.latitude ? Number(formData.latitude) : null,
      longitude: formData.longitude ? Number(formData.longitude) : null,
      rating: formData.rating ? Number(formData.rating) : null,
      dogs: []
    };

    createMutation.mutate(dataToSave);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-slate-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-8 border border-stone-200/50 shadow-lg text-center max-w-md"
        >
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-medium text-stone-800 mb-3">Vielen Dank!</h2>
          <p className="text-stone-600 mb-6">
            Dein Tourenvorschlag wurde eingereicht und wird geprüft. Nach der Freigabe erscheint er auf der Seite.
          </p>
          <Link to={createPageUrl("Dashboard")}>
            <Button className="bg-slate-800 hover:bg-slate-900">
              Zurück zur Startseite
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link to={createPageUrl("Dashboard")}>
            <Button variant="ghost" className="mb-4 text-stone-600">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück
            </Button>
          </Link>
          <h1 className="text-3xl font-light text-stone-800">Tour einreichen</h1>
          <p className="text-stone-500 mt-1">Teile deine hundefreundliche Wanderung mit der Community</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-8 border border-stone-200/50 shadow-sm"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Contact Info */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-amber-800 text-sm">
                ℹ️ Deine Tour wird nach einer kurzen Prüfung veröffentlicht.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="submitted_by_name">Dein Name *</Label>
                <Input
                  id="submitted_by_name"
                  value={formData.submitted_by_name}
                  onChange={(e) => setFormData({ ...formData, submitted_by_name: e.target.value })}
                  placeholder="Max Mustermann"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="submitted_by_email">Deine E-Mail *</Label>
                <Input
                  id="submitted_by_email"
                  type="email"
                  value={formData.submitted_by_email}
                  onChange={(e) => setFormData({ ...formData, submitted_by_email: e.target.value })}
                  placeholder="max@beispiel.de"
                  required
                />
              </div>
            </div>

            <hr className="my-6" />

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
                <Label htmlFor="date">Datum der Wanderung</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
                    <SelectItem value="easy">Leicht</SelectItem>
                    <SelectItem value="moderate">Mittel</SelectItem>
                    <SelectItem value="challenging">Anspruchsvoll</SelectItem>
                    <SelectItem value="difficult">Schwer</SelectItem>
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
                    <SelectItem value="easy">Leicht</SelectItem>
                    <SelectItem value="moderate">Mittel</SelectItem>
                    <SelectItem value="challenging">Anspruchsvoll</SelectItem>
                    <SelectItem value="difficult">Schwer</SelectItem>
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
                <Label htmlFor="weather">Wetter</Label>
                <Select
                  value={formData.weather}
                  onValueChange={(value) => setFormData({ ...formData, weather: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sunny">☀️ Sonnig</SelectItem>
                    <SelectItem value="partly_cloudy">⛅ Teilweise bewölkt</SelectItem>
                    <SelectItem value="cloudy">☁️ Bewölkt</SelectItem>
                    <SelectItem value="rainy">🌧️ Regnerisch</SelectItem>
                    <SelectItem value="snowy">❄️ Schnee</SelectItem>
                    <SelectItem value="foggy">🌫️ Nebelig</SelectItem>
                  </SelectContent>
                </Select>
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

            <div className="space-y-3">
              <Label>Fotos</Label>
              <div className="flex flex-wrap gap-4">
                {formData.photos?.map((url, index) => (
                  <div key={url} className="relative group">
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
                  </div>
                ))}
                
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
                      <span className="text-xs text-stone-400 mt-1">Fotos</span>
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
                rows={5}
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Link to={createPageUrl("Dashboard")}>
                <Button type="button" variant="outline">
                  Abbrechen
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="bg-slate-800 hover:bg-slate-900"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Wird eingereicht...
                  </>
                ) : (
                  <>
                    <Mountain className="w-4 h-4 mr-2" />
                    Tour einreichen
                  </>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}