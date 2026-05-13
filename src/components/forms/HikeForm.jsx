import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { uploadJournalFile } from "@/lib/journalApi";
import { getImageUploadErrorMessage } from "@/lib/uploadValidation";
import { useAuth } from "@/lib/AuthContext";
import { Upload, X, Loader2, Star, Map as MapIcon, Trash2, MapPin, HelpCircle } from "lucide-react";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import RouteEditor from "@/components/map/RouteEditor";
import StartPointPicker from "@/components/map/StartPointPicker";
import ConsentDialog from "@/components/ConsentDialog";
import WaterIcon from "@/components/icons/WaterIcon";
import { DIFFICULTY_LEVELS, SEASON_LEVELS, TOUR_ICONS, WATER_LEVELS } from "@/lib/difficultyConfig";
import { hoursInputToMinutes, minutesToHoursInput } from "@/lib/duration";
import { getAvatarDataUrl } from "@/lib/fallbackImages";

function buildInitialFormData(hike) {
  if (!hike) {
    return {
      trail_name: "",
      location: "",
      country: "italy",
      date: new Date().toISOString().split("T")[0],
      distance_km: "",
      elevation_gain_m: "",
      duration_minutes: "",
      difficulty: "3",
      dog_difficulty: "3",
      season: "all_year",
      water_availability: "moderate",
      grazing_animals: false,
      muzzle_recommended: false,
      hazard_notes: "",
      parking_info: "",
      restaurant_info: "",
      dogs: [],
      photos: [],
      latitude: "",
      longitude: "",
      route_coordinates: [],
      notes: "",
      rating: 5,
      visibility: "private",
    };
  }

  return {
    ...hike,
    grazing_animals: hike?.grazing_animals ?? false,
    muzzle_recommended: hike?.muzzle_recommended ?? false,
    duration_minutes: minutesToHoursInput(hike.duration_minutes),
  };
}

export default function HikeForm({ hike, dogs = [], onSave, onCancel, submitLabel }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState(() => buildInitialFormData(hike));
  const [uploading, setUploading] = useState(false);
   const [saving, setSaving] = useState(false);
   const [showRouteEditor, setShowRouteEditor] = useState(false);
   const [showStartPointPicker, setShowStartPointPicker] = useState(false);
   const [showPhotoConsent, setShowPhotoConsent] = useState(false);
   const [showVisibilityConfirm, setShowVisibilityConfirm] = useState(false);
   const [pendingVisibility, setPendingVisibility] = useState(null);

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (files.length > 0) {
      setShowPhotoConsent(true);
    }
  };

  const handlePhotoUploadConfirmed = async (files) => {
    setUploading(true);
    try {
      const uploadedUrls = [];

      for (const file of files) {
        const file_url = await uploadJournalFile(user?.id ?? "admin", file);
        uploadedUrls.push(file_url);
      }

      setFormData(prev => ({
        ...prev,
        photos: [...(prev.photos || []), ...uploadedUrls]
      }));
      setShowPhotoConsent(false);
    } catch (error) {
      toast.error(
        getImageUploadErrorMessage(
          error,
          "Die Fotos wollten gerade nicht hochladen. Versuch es gleich noch einmal."
        )
      );
    } finally {
      setUploading(false);
    }
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

  const handleGPXUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const text = await file.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "text/xml");
      
      const trkpts = xmlDoc.getElementsByTagName("trkpt");
      const coordinates = [];
      
      for (let i = 0; i < trkpts.length; i++) {
        const lat = parseFloat(trkpts[i].getAttribute("lat"));
        const lon = parseFloat(trkpts[i].getAttribute("lon"));
        coordinates.push([lat, lon]);
      }
      
      if (coordinates.length > 0) {
        setFormData(prev => ({
          ...prev,
          route_coordinates: coordinates,
          latitude: prev.latitude || coordinates[0][0],
          longitude: prev.longitude || coordinates[0][1]
        }));
      }
    } catch (error) {
      console.error("Fehler beim Parsen der GPX-Datei:", error);
      toast.error("Die GPX-Datei lässt sich nicht lesen. Prüfe kurz das Format.");
    }
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const missing = [];
    if (!formData.trail_name?.trim()) missing.push("Name der Tour");
    
    if (!formData.latitude || !formData.longitude) missing.push("Ausgangspunkt");

    if (formData.visibility === "friends" || formData.visibility === "public") {
      if (!formData.location?.trim()) missing.push("Ort / Region");
      if (!formData.distance_km) missing.push("Strecke (km)");
      if (!formData.elevation_gain_m) missing.push("Höhenmeter");
      if (!formData.duration_minutes) missing.push("Gehzeit");
      if (!formData.difficulty) missing.push("Schwierigkeit (Mensch)");
      if (!formData.dog_difficulty) missing.push("Schwierigkeit (Hund)");
      if (!formData.water_availability) missing.push("Wasser unterwegs");
      if (!formData.season) missing.push("Beste Jahreszeit");
      if (!formData.notes?.trim()) missing.push("Beschreibung & Tipps");
      if (!Array.isArray(formData.photos) || formData.photos.length === 0) missing.push("Mindestens 1 Foto");
    }

    if (missing.length > 0) {
      if (formData.visibility === "private") {
        toast.error(`Bitte fülle noch diese Pflichtfelder aus: ${missing.join(", ")}`, {
          duration: 7000,
        });
        return;
      }

      if (formData.visibility === "public") {
        toast.error(`Um eine Tour öffentlich zu machen, müssen alle Pflichtfelder ausgefüllt sein: ${missing.join(", ")}`, {
          duration: 7000,
        });
        return;
      }

      toast.error(`Um eine Tour mit Freunden zu teilen, müssen alle Pflichtfelder ausgefüllt sein: ${missing.join(", ")}`, {
        duration: 7000,
      });
      return;
    }
    
    setSaving(true);
    
    const dataToSave = {
      ...formData,
      distance_km: formData.distance_km ? Number(formData.distance_km) : null,
      elevation_gain_m: formData.elevation_gain_m ? Number(formData.elevation_gain_m) : null,
      duration_minutes: hoursInputToMinutes(formData.duration_minutes),
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
          <Label htmlFor="country">Land {TOUR_ICONS.country}</Label>
          <Select
            value={formData.country || "italy"}
            onValueChange={(value) => setFormData({ ...formData, country: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Land wählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="italy">🇮🇹 Italien</SelectItem>
              <SelectItem value="austria">🇦🇹 Österreich</SelectItem>
              <SelectItem value="germany">🇩🇪 Deutschland</SelectItem>
              <SelectItem value="switzerland">🇨🇭 Schweiz</SelectItem>
              <SelectItem value="other">{TOUR_ICONS.country} Anderes</SelectItem>
            </SelectContent>
          </Select>
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
          <div className="flex items-center justify-between">
            <Label htmlFor="difficulty">Schwierigkeit (Mensch) {TOUR_ICONS.human}</Label>
            <a href={createPageUrl("DifficultyHelp")} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-brand-600 hover:underline">
              <HelpCircle className="w-3 h-3" /> Was bedeutet das?
            </a>
          </div>
          <Select
            value={formData.difficulty}
            onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Wählen" />
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTY_LEVELS.map((level) => (
                <SelectItem key={level.value} value={level.value}>{level.short} · {level.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="dog_difficulty">Schwierigkeit (Hund) {TOUR_ICONS.dog}</Label>
            <a href={createPageUrl("DifficultyHelp")} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-brand-600 hover:underline">
              <HelpCircle className="w-3 h-3" /> Was bedeutet das?
            </a>
          </div>
          <Select
            value={formData.dog_difficulty}
            onValueChange={(value) => setFormData({ ...formData, dog_difficulty: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Wählen" />
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTY_LEVELS.map((level) => (
                <SelectItem key={level.value} value={level.value}>{level.short} · {level.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="season">Beste Jahreszeit {TOUR_ICONS.season}</Label>
          <Select
            value={formData.season}
            onValueChange={(value) => setFormData({ ...formData, season: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Wählen" />
            </SelectTrigger>
            <SelectContent>
              {SEASON_LEVELS.map((season) => (
                <SelectItem key={season.value} value={season.value}>
                  {season.icon} {season.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="water_availability" className="flex items-center gap-1">
              Wasser unterwegs <WaterIcon value="little" />
            </Label>
            <a href={createPageUrl("WaterHelp")} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-brand-600 hover:underline">
              <HelpCircle className="w-3 h-3" /> Was bedeutet das?
            </a>
          </div>
          <Select
            value={formData.water_availability}
            onValueChange={(value) => setFormData({ ...formData, water_availability: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Wählen" />
            </SelectTrigger>
            <SelectContent>
              {WATER_LEVELS.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  <span className="inline-flex items-center gap-1">
                    <WaterIcon value={level.value} /> {level.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Hinweise für Hunde (optional)</Label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, grazing_animals: !formData.grazing_animals })}
              className={`rounded-full border px-3 py-2 text-sm transition-all ${
                formData.grazing_animals
                  ? "border-brand-200 bg-brand-100/80 font-medium text-slate-700"
                  : "border-brand-100 bg-white/70 text-slate-500 hover:border-brand-200 hover:bg-brand-50/70"
              }`}
            >
              {TOUR_ICONS.grazing} Weidetiere
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, muzzle_recommended: !formData.muzzle_recommended })}
              className={`rounded-full border px-3 py-2 text-sm transition-all ${
                formData.muzzle_recommended
                  ? "border-brand-200 bg-brand-100/80 font-medium text-slate-700"
                  : "border-brand-100 bg-white/70 text-slate-500 hover:border-brand-200 hover:bg-brand-50/70"
              }`}
            >
              {TOUR_ICONS.muzzle} Maulkorb
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Optional für alle Touren. Du kannst keinen, einen oder beide Hinweise angeben.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="distance">{TOUR_ICONS.distance} Strecke (km)</Label>
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
          <Label htmlFor="elevation">{TOUR_ICONS.elevation} Höhenmeter (m)</Label>
          <Input
            id="elevation"
            type="number"
            value={formData.elevation_gain_m}
            onChange={(e) => setFormData({ ...formData, elevation_gain_m: e.target.value })}
            placeholder="850"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">{TOUR_ICONS.duration} Gehzeit (Stunden)</Label>
          <Input
            id="duration"
            type="number"
            step="0.1"
            value={formData.duration_minutes}
            onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
            placeholder="4"
          />
        </div>
      </div>

      {/* Start Point Section */}
      <div className="space-y-4 rounded-2xl border border-brand-100/70 bg-white/70 p-5 shadow-[0_12px_28px_rgba(168,0,60,0.08)] backdrop-blur-sm md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-lg">{TOUR_ICONS.location} Ausgangspunkt *</Label>
            <p className="text-sm text-slate-500 mt-1">
              Wähle den Startpunkt deiner Wanderung auf der Karte aus
            </p>
          </div>
          {formData.latitude && formData.longitude && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFormData({ ...formData, latitude: "", longitude: "", location: "" })}
              className="text-brand-400 hover:text-brand-500"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Zurücksetzen
            </Button>
          )}
        </div>

        {formData.latitude && formData.longitude && (
          <div className="p-3 bg-white rounded-lg border border-brand-200">
            <p className="text-sm text-brand-600 font-medium mb-1">
              {TOUR_ICONS.check} Ausgangspunkt gesetzt
            </p>
            <p className="text-xs text-slate-600">
              {formData.location && `${TOUR_ICONS.location} ${formData.location} • `}
              {formData.latitude.toFixed(5)}, {formData.longitude.toFixed(5)}
            </p>
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setShowStartPointPicker(!showStartPointPicker)}
        >
          <MapPin className="w-4 h-4 mr-2" />
          {showStartPointPicker ? "Karte schließen" : "Ausgangspunkt auf Karte wählen"}
        </Button>

        {showStartPointPicker && (
          <StartPointPicker
            latitude={formData.latitude ? Number(formData.latitude) : null}
            longitude={formData.longitude ? Number(formData.longitude) : null}
            onSelect={(data) => {
              setFormData({
                ...formData,
                latitude: data.latitude,
                longitude: data.longitude,
                location: data.location || formData.location
              });
            }}
          />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      </div>

      {/* Route Section */}
      <div className="space-y-4 rounded-2xl border border-brand-100/70 bg-white/70 p-5 shadow-[0_12px_28px_rgba(168,0,60,0.08)] backdrop-blur-sm md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-lg">{TOUR_ICONS.map} Routenverlauf (optional)</Label>
            <p className="text-sm text-slate-500 mt-1">
              Zeichne die komplette Wanderroute oder lade eine GPX-Datei hoch
            </p>
          </div>
          {formData.route_coordinates?.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFormData({ ...formData, route_coordinates: [] })}
              className="text-brand-400 hover:text-brand-500"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Route löschen
            </Button>
          )}
        </div>

        {formData.route_coordinates?.length > 0 && (
          <div className="p-3 bg-white rounded-lg border border-brand-200">
            <p className="text-sm text-brand-600 font-medium">
              {TOUR_ICONS.check} Route mit {formData.route_coordinates.length} Wegpunkten
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label>
            <input
              type="file"
              accept=".gpx"
              onChange={handleGPXUpload}
              className="hidden"
              disabled={uploading}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={uploading}
              onClick={(e) => e.currentTarget.previousElementSibling.click()}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Lade GPX...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  GPX-Datei hochladen
                </>
              )}
            </Button>
          </label>

          <Button
            type="button"
            variant="outline"
            onClick={() => setShowRouteEditor(!showRouteEditor)}
          >
            <MapIcon className="w-4 h-4 mr-2" />
            {showRouteEditor ? "Fertig" : "Route zeichnen"}
          </Button>
        </div>

        {showRouteEditor && (
          <div className="space-y-2">
            <div className="rounded-xl border border-brand-200/70 bg-brand-50/60 p-2">
              <p className="text-xs text-brand-700">
                {TOUR_ICONS.tip} Klicke auf die Karte, um Wegpunkte hinzuzufügen. Der erste Punkt wird automatisch als Ausgangspunkt verwendet.
              </p>
            </div>
            <RouteEditor
              coordinates={formData.route_coordinates || []}
              startPoint={
                formData.latitude && formData.longitude
                  ? [Number(formData.latitude), Number(formData.longitude)]
                  : null
              }
              onChange={(coords) => {
                setFormData({ ...formData, route_coordinates: coords });
                if (coords.length > 0 && !formData.latitude) {
                  setFormData(prev => ({
                    ...prev,
                    latitude: coords[0][0],
                    longitude: coords[0][1]
                  }));
                }
              }}
            />
          </div>
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
                    ? "fill-brand-100 text-brand-100"
                    : "text-slate-300"
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
                    ? "border-brand-400 bg-brand-50/60"
                    : "border-brand-100 hover:border-brand-100"
                }`}
              >
                <Checkbox
                  checked={formData.dogs?.includes(dog.id)}
                  onCheckedChange={() => toggleDog(dog.id)}
                />
                <img
                  src={dog.photo_url || getAvatarDataUrl(dog.name)}
                  alt={dog.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <span className="font-medium text-slate-700">{dog.name}</span>
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
                  className="absolute -top-2 -right-2 p-1 bg-brand-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          
          <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-brand-100 rounded-xl cursor-pointer hover:border-brand-400 transition-colors">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files);
                if (files.length > 0) {
                  const fileList = e.target.files;
                  handlePhotoUploadConfirmed(fileList);
                }
              }}
              className="hidden"
              disabled={uploading}
              id="photo-input"
            />
            {uploading ? (
              <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
            ) : (
              <>
                <Upload className="w-6 h-6 text-slate-400" />
                <span className="text-xs text-slate-400 mt-1">Fotos hinzufügen</span>
              </>
            )}
          </label>
          </div>
          </div>

          <ConsentDialog
          type="photo"
          open={showPhotoConsent}
          onAccept={() => {
          const input = document.getElementById('photo-input');
          if (input?.files) {
            handlePhotoUploadConfirmed(input.files);
          }
          }}
          onDecline={() => setShowPhotoConsent(false)}
          />

      <div className="space-y-2">
        <Label htmlFor="parking_info">{TOUR_ICONS.parking} Ausgangspunkt & Parken (optional)</Label>
        <Textarea
          id="parking_info"
          value={formData.parking_info}
          onChange={(e) => setFormData({ ...formData, parking_info: e.target.value })}
          placeholder="z.B. Großer Parkplatz am Pragser Wildsee, Adresse: Via Prags 107..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="restaurant_info">{TOUR_ICONS.restaurant} Einkehrmöglichkeiten (optional)</Label>
        <Textarea
          id="restaurant_info"
          value={formData.restaurant_info}
          onChange={(e) => setFormData({ ...formData, restaurant_info: e.target.value })}
          placeholder="z.B. Seekofel Hütte (2324m), Auronzo-Hütte am Drei Zinnen Blick..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="hazard_notes">{TOUR_ICONS.hazard} Achtung - Gefahrenstellen (optional)</Label>
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

      <div className="space-y-2 p-4 bg-brand-50 border border-brand-100 rounded-xl">
        <Label htmlFor="visibility" className="text-base font-semibold">Sichtbarkeit der Tour</Label>
        <Select
          value={formData.visibility}
          onValueChange={(value) => {
            if (hike && hike.visibility === "public" && value !== "public") {
              setPendingVisibility(value);
              setShowVisibilityConfirm(true);
              return;
            }
            setFormData({ ...formData, visibility: value });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Wählen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="private">{TOUR_ICONS.private} Privat (nur für mich)</SelectItem>
            <SelectItem value="friends">{TOUR_ICONS.friends} Mit Freunden teilen</SelectItem>
            <SelectItem value="public">{TOUR_ICONS.public} Öffentlich (für alle sichtbar)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-slate-600 mt-2 bg-white p-2 rounded border border-brand-200">
          {formData.visibility === "private" && `${TOUR_ICONS.private} Nur du kannst diese Tour sehen – nur die Grundangaben sind Pflicht, weitere Felder bleiben optional.`}
          {formData.visibility === "friends" && `${TOUR_ICONS.friends} Nur Freunde können diese Tour sehen – für das Teilen müssen alle Pflichtfelder ausgefüllt sein.`}
          {formData.visibility === "public" && `${TOUR_ICONS.public} Alle Nutzer können diese Tour sehen – für eine öffentliche Tour müssen alle Pflichtfelder ausgefüllt sein.`}
        </p>
        {hike && hike.visibility === "public" && formData.visibility !== "public" && (
          <p className="text-xs text-brand-400 font-medium mt-2">
            {TOUR_ICONS.hazard} Achtung: Du änderst die Sichtbarkeit von öffentlich - die Tour wird dann aus der öffentlichen Liste entfernt!
          </p>
        )}
      </div>

      <AlertDialog open={showVisibilityConfirm} onOpenChange={setShowVisibilityConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Öffentliche Tour ändern?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Tour ist aktuell öffentlich. Wenn du sie auf privat oder nur für Freunde änderst,
              wird sie aus der öffentlichen Liste entfernt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingVisibility(null)}>
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingVisibility) {
                  setFormData((prev) => ({ ...prev, visibility: pendingVisibility }));
                }
                setPendingVisibility(null);
              }}
            >
              Fortfahren
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex gap-3 justify-end pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Abbrechen
          </Button>
        )}
        <Button
          type="submit"
          disabled={saving}
          className="bg-[#A8003C] hover:bg-[#7C3020]"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Einen Moment...
            </>
          ) : (
            submitLabel || (hike ? "Tour aktualisieren" : "Tour hinzufügen")
          )}
        </Button>
      </div>
    </form>
  );
}
