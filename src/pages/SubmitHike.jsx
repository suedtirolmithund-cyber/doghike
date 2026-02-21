import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Upload, X, Loader2, Star, CheckCircle, Mountain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import StartPointPicker from "@/components/map/StartPointPicker";

export default function SubmitHike() {
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    trail_name: "",
    location: "",
    date: new Date().toISOString().split("T")[0],
    distance_km: "",
    elevation_gain_m: "",
    duration_hours: "",
    difficulty: "",
    dog_difficulty: "",
    season: "",
    water_availability: "",
    hazard_notes: "",
    parking_info: "",
    restaurant_info: "",
    photos: [],
    latitude: null,
    longitude: null,
    notes: "",
    rating: 5,
    dogs: [],
    submitted_by_name: "",
    submitted_by_email: "",
    status: "pending",
    photo_consent: false,
    publish_consent: false
  });

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const { data: myDogs = [] } = useQuery({
    queryKey: ["myDogs"],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Dog.filter({ created_by: user.email });
    },
    enabled: !!user?.email
  });

  const availableDogs = myDogs;

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

  const handleStartPointSelect = (lat, lng) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }));
  };

  const toggleDog = (dogId) => {
    setFormData(prev => ({
      ...prev,
      dogs: prev.dogs.includes(dogId)
        ? prev.dogs.filter(id => id !== dogId)
        : [...prev.dogs, dogId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.trail_name || !formData.location || !formData.distance_km || !formData.elevation_gain_m || !formData.duration_hours || !formData.difficulty || !formData.dog_difficulty || !formData.season || !formData.water_availability || !formData.parking_info || !formData.notes) {
      alert("Bitte fülle alle Pflichtfelder aus!");
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      alert("Bitte wähle den Ausgangspunkt auf der Karte aus!");
      return;
    }

    if (!formData.publish_consent) {
      alert("Bitte bestätige dein Einverständnis zur Veröffentlichung der Tour!");
      return;
    }

    if (!formData.photo_consent && formData.photos.length > 0) {
      alert("Bitte bestätige, dass du mit der öffentlichen Veröffentlichung der Fotos einverstanden bist!");
      return;
    }
    
    const dataToSave = {
      ...formData,
      distance_km: formData.distance_km ? Number(formData.distance_km) : null,
      elevation_gain_m: formData.elevation_gain_m ? Number(formData.elevation_gain_m) : null,
      duration_minutes: formData.duration_hours ? Math.round(Number(formData.duration_hours) * 60) : null,
      rating: formData.rating ? Number(formData.rating) : null
    };
    delete dataToSave.photo_consent;
    delete dataToSave.publish_consent;
    delete dataToSave.duration_hours;

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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Ort / Region *</Label>
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
                <Label htmlFor="difficulty">Schwierigkeit (Mensch) 👤 *</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 – Leicht</SelectItem>
                    <SelectItem value="2">2 – Mittel-leicht</SelectItem>
                    <SelectItem value="3">3 – Mittel</SelectItem>
                    <SelectItem value="4">4 – Anspruchsvoll</SelectItem>
                    <SelectItem value="5">5 – Schwer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dog_difficulty">Schwierigkeit (Hund) 🐕 *</Label>
                <Select
                  value={formData.dog_difficulty}
                  onValueChange={(value) => setFormData({ ...formData, dog_difficulty: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 – Leicht</SelectItem>
                    <SelectItem value="2">2 – Mittel-leicht</SelectItem>
                    <SelectItem value="3">3 – Mittel</SelectItem>
                    <SelectItem value="4">4 – Anspruchsvoll</SelectItem>
                    <SelectItem value="5">5 – Schwer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="season">Beste Jahreszeit *</Label>
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
                <Label htmlFor="water_availability">Wasser unterwegs 💧 *</Label>
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
                <Label htmlFor="distance">Strecke (km) *</Label>
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
                <Label htmlFor="elevation">Höhenmeter (m) *</Label>
                <Input
                  id="elevation"
                  type="number"
                  value={formData.elevation_gain_m}
                  onChange={(e) => setFormData({ ...formData, elevation_gain_m: e.target.value })}
                  placeholder="850"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Gehzeit (Stunden) *</Label>
                <Input
                  id="duration"
                  type="number"
                  step="0.5"
                  value={formData.duration_hours}
                  onChange={(e) => setFormData({ ...formData, duration_hours: e.target.value })}
                  placeholder="4"
                />
              </div>

            </div>

            <div className="space-y-2">
              <Label>📍 Ausgangspunkt auf der Karte wählen *</Label>
              <div className="border-2 border-stone-200 rounded-xl overflow-hidden">
                <StartPointPicker
                  initialPosition={formData.latitude && formData.longitude ? [formData.latitude, formData.longitude] : null}
                  onLocationSelect={handleStartPointSelect}
                  height="300px"
                />
              </div>
              {formData.latitude && formData.longitude ? (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  ✓ Startpunkt: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                </p>
              ) : (
                <p className="text-xs text-amber-600">
                  Bitte klicke auf die Karte, um den Ausgangspunkt zu markieren
                </p>
              )}
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

            {availableDogs.length > 0 && (
              <div className="space-y-3">
                <Label>🐕 Welche Hunde waren dabei?</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableDogs.map((dog) => (
                    <div
                      key={dog.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-stone-200 hover:bg-stone-50 cursor-pointer"
                      onClick={() => toggleDog(dog.id)}
                    >
                      <Checkbox
                        checked={formData.dogs.includes(dog.id)}
                        onCheckedChange={() => toggleDog(dog.id)}
                      />
                      <img
                        src={dog.photo_url || `https://api.dicebear.com/7.x/thumbs/svg?seed=${dog.name}`}
                        alt={dog.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-stone-800">{dog.name}</p>
                        {dog.breed && <p className="text-xs text-stone-500">{dog.breed}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
              <Label htmlFor="parking_info">🅿️ Ausgangspunkt & Parken *</Label>
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
              <Label htmlFor="hazard_notes">⚠️ Achtung - Gefahrenstellen (optional, kann leer bleiben)</Label>
              <Textarea
                id="hazard_notes"
                value={formData.hazard_notes}
                onChange={(e) => setFormData({ ...formData, hazard_notes: e.target.value })}
                placeholder="z.B. steile Passagen, Leitern, Seilsicherungen, Kühe auf der Alm..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Beschreibung & Tipps *</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Wegbeschaffenheit, Highlights, besondere Ausblicke..."
                rows={5}
              />
            </div>

            {/* Publish consent - always shown */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="publish_consent"
                  checked={formData.publish_consent}
                  onCheckedChange={(checked) => setFormData({ ...formData, publish_consent: checked })}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label htmlFor="publish_consent" className="cursor-pointer font-normal text-sm text-stone-700">
                    Ich bin damit einverstanden, dass diese Tour nach einer Prüfung öffentlich auf <strong>Südtirol mit Hund</strong> für alle Nutzer sichtbar veröffentlicht wird. *
                  </Label>
                </div>
              </div>
            </div>

            {/* Photo consent - only when photos uploaded */}
            {formData.photos.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="photo_consent"
                    checked={formData.photo_consent}
                    onCheckedChange={(checked) => setFormData({ ...formData, photo_consent: checked })}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor="photo_consent" className="cursor-pointer font-normal text-sm text-stone-700">
                      Ich bestätige, dass ich die Rechte an den hochgeladenen Fotos besitze und mit der öffentlichen Veröffentlichung auf dieser Plattform einverstanden bin. *
                    </Label>
                  </div>
                </div>
              </div>
            )}

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