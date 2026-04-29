import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Camera, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/lib/AuthContext";
import { deleteUploadedPublicHikePhoto, getPublicHikeById, updatePublicHike, uploadPublicHikePhoto } from "@/lib/publicHikesApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DIFFICULTY_LEVELS, SEASON_LEVELS, TOUR_ICONS, WATER_LEVELS } from "@/lib/difficultyConfig";

function buildInitialFormData(hike) {
  return {
    title: hike?.trail_name || "",
    location: hike?.location || "",
    country: hike?.country || "italy",
    date: hike?.date || "",
    distance_km: hike?.distance_km ?? "",
    elevation_gain_m: hike?.elevation_gain_m ?? "",
    duration_minutes: hike?.duration_minutes ?? "",
    difficulty: hike?.difficulty || "unset",
    dog_difficulty: hike?.dog_difficulty || "unset",
    water_availability: hike?.water_availability || "unset",
    season: hike?.season || "unset",
    hazard_notes: hike?.hazard_notes || "",
    parking_info: hike?.parking_info || "",
    restaurant_info: hike?.restaurant_info || "",
    notes: hike?.notes || "",
    tagsText: Array.isArray(hike?.tags) ? hike.tags.join(", ") : "",
    status: hike?.status || "approved",
    is_premium: hike?.is_premium ? "true" : "false",
    latitude: hike?.latitude ?? "",
    longitude: hike?.longitude ?? "",
    photoUrls: Array.isArray(hike?.photos) ? hike.photos : [],
  };
}

export default function EditPublicHike() {
  const [searchParams] = useSearchParams();
  const hikeId = searchParams.get("id");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAdmin, isLoadingAuth } = useAuth();
  const [formData, setFormData] = useState(null);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const uploadedDuringEditRef = useRef(new Set());
  const savedPhotoUrlsRef = useRef(new Set());

  const { data: hike, isLoading } = useQuery({
    queryKey: ["publicHikeEditor", hikeId],
    queryFn: () => getPublicHikeById(hikeId),
    enabled: !!hikeId && isAdmin,
  });
  const detailId = hike?._public_hike_id ? hike.route_id || String(hike._public_hike_id) : hike?.id;

  useEffect(() => {
    if (hike && !formData) {
      setFormData(buildInitialFormData(hike));
      savedPhotoUrlsRef.current = new Set(Array.isArray(hike.photos) ? hike.photos : []);
    }
  }, [hike, formData]);

  useEffect(() => {
    return () => {
      const uploadedUrls = [...uploadedDuringEditRef.current];
      if (uploadedUrls.length === 0) return;

      uploadedUrls.forEach((photoUrl) => {
        deleteUploadedPublicHikePhoto(photoUrl).catch((error) => {
          console.error("[EditPublicHike] abandoned photo cleanup failed:", error.message);
        });
      });
    };
  }, []);

  const handlePhotoUpload = async (event) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (!user?.id || files.length === 0) return;

    setIsUploadingPhotos(true);
    try {
      const uploadedUrls = [];

      for (const file of files) {
        const photoUrl = await uploadPublicHikePhoto(user.id, file);
        uploadedUrls.push(photoUrl);
        uploadedDuringEditRef.current.add(photoUrl);
      }

      setFormData((prev) => ({
        ...prev,
        photoUrls: [...prev.photoUrls, ...uploadedUrls],
      }));
      toast.success(`${uploadedUrls.length} Bild${uploadedUrls.length !== 1 ? "er" : ""} hochgeladen`);
    } catch {
      toast.error("Die Bilder konnten gerade nicht hochgeladen werden. Bitte versuche es noch einmal.");
    } finally {
      setIsUploadingPhotos(false);
    }
  };

  const removePhotoUrl = async (photoUrl) => {
    setFormData((prev) => ({
      ...prev,
      photoUrls: prev.photoUrls.filter((url) => url !== photoUrl),
    }));

    if (uploadedDuringEditRef.current.has(photoUrl)) {
      uploadedDuringEditRef.current.delete(photoUrl);
      try {
        await deleteUploadedPublicHikePhoto(photoUrl);
      } catch {
        toast.error("Das entfernte Bild konnte im Speicher nicht aufgeräumt werden.");
      }
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!hike?._public_hike_id) {
        throw new Error("missing_public_hike_id");
      }

      const photoUrls = formData.photoUrls
        .map((url) => url.trim())
        .filter(Boolean);
      const tags = formData.tagsText
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      return updatePublicHike(hike._public_hike_id, {
        title: formData.title.trim(),
        location: formData.location.trim() || null,
        country: formData.country || null,
        date: formData.date || null,
        distance_km: formData.distance_km === "" ? null : Number(formData.distance_km),
        elevation_gain_m: formData.elevation_gain_m === "" ? null : Number(formData.elevation_gain_m),
        duration_minutes: formData.duration_minutes === "" ? null : Number(formData.duration_minutes),
        difficulty: formData.difficulty === "unset" ? null : Number(formData.difficulty),
        dog_difficulty: formData.dog_difficulty === "unset" ? null : Number(formData.dog_difficulty),
        water_availability: formData.water_availability === "unset"
          ? null
          : WATER_LEVELS.find((level) => level.value === formData.water_availability)?.numeric ?? null,
        season: formData.season === "unset" ? null : formData.season || null,
        hazard_notes: formData.hazard_notes.trim() || null,
        parking_info: formData.parking_info.trim() || null,
        restaurant_info: formData.restaurant_info.trim() || null,
        notes: formData.notes.trim() || null,
        tags,
        status: formData.status || "draft",
        is_premium: formData.is_premium === "true",
        latitude: formData.latitude === "" ? null : Number(formData.latitude),
        longitude: formData.longitude === "" ? null : Number(formData.longitude),
        photoUrls,
      });
    },
    onSuccess: () => {
      const finalPhotoUrls = formData.photoUrls.filter(Boolean);
      const savedPhotoUrls = savedPhotoUrlsRef.current;
      uploadedDuringEditRef.current.forEach((photoUrl) => {
        if (finalPhotoUrls.includes(photoUrl) || savedPhotoUrls.has(photoUrl)) {
          uploadedDuringEditRef.current.delete(photoUrl);
        }
      });
      queryClient.invalidateQueries({ queryKey: ["allHikes"] });
      queryClient.invalidateQueries({ queryKey: ["hike"] });
      toast.success("Öffentliche Tour gespeichert");
      navigate(createPageUrl("HikeDetail") + `?id=${encodeURIComponent(detailId)}&source=sheets`);
    },
    onError: () => {
      toast.error("Die öffentliche Tour konnte gerade nicht gespeichert werden. Bitte versuche es noch einmal.");
    },
  });

  if (isLoadingAuth || isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-xl text-stone-700 mb-4">Nur Admins können öffentliche Touren bearbeiten.</p>
          <Link to={createPageUrl("Hikes")}>
            <Button>Zurück zu den Touren</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!hike || !formData) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-xl text-stone-700 mb-4">Öffentliche Tour nicht gefunden</p>
          <Link to={createPageUrl("Hikes")}>
            <Button>Zurück zu den Touren</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link to={createPageUrl("HikeDetail") + `?id=${encodeURIComponent(detailId)}&source=sheets`}>
            <Button variant="ghost" className="pl-0 text-stone-600 hover:text-stone-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück zur Tour
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-stone-800">Öffentliche Tour bearbeiten</h1>
            <p className="text-stone-500 mt-1">Änderungen werden direkt in Supabase gespeichert.</p>
          </div>

          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate();
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Titel</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Ort</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Land</Label>
                <Select value={formData.country} onValueChange={(value) => setFormData((prev) => ({ ...prev, country: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Nicht gesetzt" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="italy">Italien</SelectItem>
                    <SelectItem value="austria">Österreich</SelectItem>
                    <SelectItem value="germany">Deutschland</SelectItem>
                    <SelectItem value="switzerland">Schweiz</SelectItem>
                    <SelectItem value="other">Anderes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Datum</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="distance_km">{TOUR_ICONS.distance} Distanz (km)</Label>
                <Input
                  id="distance_km"
                  type="number"
                  step="0.1"
                  value={formData.distance_km}
                  onChange={(e) => setFormData((prev) => ({ ...prev, distance_km: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="elevation_gain_m">{TOUR_ICONS.elevation} Höhenmeter</Label>
                <Input
                  id="elevation_gain_m"
                  type="number"
                  value={formData.elevation_gain_m}
                  onChange={(e) => setFormData((prev) => ({ ...prev, elevation_gain_m: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration_minutes">Dauer (Minuten)</Label>
                <Input
                  id="duration_minutes"
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, duration_minutes: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>{TOUR_ICONS.season} Jahreszeit</Label>
                <Select value={formData.season} onValueChange={(value) => setFormData((prev) => ({ ...prev, season: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Nicht gesetzt" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unset">Nicht gesetzt</SelectItem>
                    {SEASON_LEVELS.map((season) => (
                      <SelectItem key={season.value} value={season.value}>
                        {season.icon} {season.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{TOUR_ICONS.human} Schwierigkeit Mensch</Label>
                <Select value={formData.difficulty} onValueChange={(value) => setFormData((prev) => ({ ...prev, difficulty: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Nicht gesetzt" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unset">Nicht gesetzt</SelectItem>
                    {DIFFICULTY_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.short} · {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{TOUR_ICONS.dog} Schwierigkeit Hund</Label>
                <Select value={formData.dog_difficulty} onValueChange={(value) => setFormData((prev) => ({ ...prev, dog_difficulty: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Nicht gesetzt" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unset">Nicht gesetzt</SelectItem>
                    {DIFFICULTY_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.short} · {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>💧 Wasser</Label>
                <Select value={formData.water_availability} onValueChange={(value) => setFormData((prev) => ({ ...prev, water_availability: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Nicht gesetzt" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unset">Nicht gesetzt</SelectItem>
                    {WATER_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.icon} {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Premium</Label>
                <Select value={formData.is_premium} onValueChange={(value) => setFormData((prev) => ({ ...prev, is_premium: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Nein</SelectItem>
                    <SelectItem value="true">Ja</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="latitude">Breitengrad</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="0.000001"
                  value={formData.latitude}
                  onChange={(e) => setFormData((prev) => ({ ...prev, latitude: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="longitude">Längengrad</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="0.000001"
                  value={formData.longitude}
                  onChange={(e) => setFormData((prev) => ({ ...prev, longitude: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags, mit Komma getrennt</Label>
              <Input
                id="tags"
                value={formData.tagsText}
                onChange={(e) => setFormData((prev) => ({ ...prev, tagsText: e.target.value }))}
                placeholder="See, Schatten, Rundweg, Hütte"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parking_info">Parken</Label>
              <Textarea
                id="parking_info"
                value={formData.parking_info}
                onChange={(e) => setFormData((prev) => ({ ...prev, parking_info: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="restaurant_info">Einkehr</Label>
              <Textarea
                id="restaurant_info"
                value={formData.restaurant_info}
                onChange={(e) => setFormData((prev) => ({ ...prev, restaurant_info: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hazard_notes">Gefahrenhinweise</Label>
              <Textarea
                id="hazard_notes"
                value={formData.hazard_notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, hazard_notes: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Beschreibung</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                rows={5}
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="photo_upload">Fotos</Label>
              <label>
                <input
                  id="photo_upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={isUploadingPhotos || saveMutation.isPending}
                />
                <Button type="button" variant="outline" asChild disabled={isUploadingPhotos || saveMutation.isPending}>
                  <span className="cursor-pointer">
                    {isUploadingPhotos ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4 mr-2" />
                    )}
                    Bilder auswählen
                  </span>
                </Button>
              </label>

              {Array.isArray(formData.photoUrls) && formData.photoUrls.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {formData.photoUrls.map((photoUrl, index) => (
                    <div key={`${photoUrl}-${index}`} className="relative overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
                      <img
                        src={photoUrl}
                        alt={`Foto ${index + 1}`}
                        className="h-32 w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePhotoUrl(photoUrl)}
                        className="absolute top-2 right-2 rounded-full bg-white/90 p-1.5 text-stone-700 shadow-sm hover:bg-white"
                        title="Bild entfernen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-stone-500">Noch keine Fotos ausgewählt.</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saveMutation.isPending} className="bg-brand-400 hover:bg-brand-600 text-white">
                {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Speichern
              </Button>
              <Link to={createPageUrl("HikeDetail") + `?id=${encodeURIComponent(detailId)}&source=sheets`}>
                <Button type="button" variant="outline">Abbrechen</Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
