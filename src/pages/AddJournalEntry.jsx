import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import {
  ArrowLeft, Upload, X, Loader2, Star, FileText,
  Mountain, Clock, Ruler, TrendingUp, MapPin, AlertTriangle, Droplets, Dog
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { createJournalEntry, updateJournalEntry, getJournalEntry, uploadJournalFile } from "@/lib/journalApi";
import { Link } from "react-router-dom";

function StarPicker({ label, value, onChange, color = "text-yellow-400" }) {
  const [hover, setHover] = useState(0);
  return (
    <div>
      <Label className="text-sm text-stone-600 mb-1 block">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s === value ? 0 : s)}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
            className="focus:outline-none"
          >
            <Star className={`w-7 h-7 transition-colors ${
              s <= (hover || value) ? `fill-yellow-400 ${color}` : "text-stone-300"
            }`} />
          </button>
        ))}
        {value > 0 && (
          <button type="button" onClick={() => onChange(0)} className="ml-1 text-stone-400 hover:text-stone-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

const EMPTY_FORM = {
  title: "",
  date: new Date().toISOString().split("T")[0],
  location: "",
  distance_km: "",
  elevation_m: "",
  duration_minutes: "",
  difficulty: 0,
  description: "",
  photos: [],
  gpx_url: "",
  rating: 0,
  dog_suitable: true,
  water_available: false,
  dog_difficulty: 0,
  hazard_notes: "",
};

export default function AddJournalEntry() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");
  const queryClient = useQueryClient();

  const [form, setForm] = useState(EMPTY_FORM);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [gpxUploading, setGpxUploading] = useState(false);

  // Load existing entry for editing
  const { data: existing, isLoading: loadingEntry } = useQuery({
    queryKey: ["journal_entry", editId],
    queryFn: () => getJournalEntry(editId),
    enabled: !!editId,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title ?? "",
        date: existing.date ?? EMPTY_FORM.date,
        location: existing.location ?? "",
        distance_km: existing.distance_km ?? "",
        elevation_m: existing.elevation_m ?? "",
        duration_minutes: existing.duration_minutes ?? "",
        difficulty: existing.difficulty ?? 0,
        description: existing.description ?? "",
        photos: existing.photos ?? [],
        gpx_url: existing.gpx_url ?? "",
        rating: existing.rating ?? 0,
        dog_suitable: existing.dog_suitable ?? true,
        water_available: existing.water_available ?? false,
        dog_difficulty: existing.dog_difficulty ?? 0,
        hazard_notes: existing.hazard_notes ?? "",
      });
    }
  }, [existing]);

  const saveMutation = useMutation({
    mutationFn: (data) =>
      editId
        ? updateJournalEntry(editId, data)
        : createJournalEntry(user.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal", user?.id] });
      toast.success(editId ? "Eintrag aktualisiert" : "Wanderung gespeichert!");
      navigate(createPageUrl("Journal"));
    },
    onError: (e) => toast.error("Fehler: " + e.message),
  });

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setPhotoUploading(true);
    try {
      const urls = await Promise.all(files.map((f) => uploadJournalFile(user.id, f)));
      setForm((p) => ({ ...p, photos: [...p.photos, ...urls] }));
      toast.success(`${urls.length} Foto${urls.length > 1 ? "s" : ""} hochgeladen`);
    } catch {
      toast.error("Foto-Upload fehlgeschlagen. Bitte 'journal' Bucket in Supabase anlegen.");
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleGpxUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setGpxUploading(true);
    try {
      const url = await uploadJournalFile(user.id, file);
      setForm((p) => ({ ...p, gpx_url: url }));
      toast.success("GPX-Datei hochgeladen");
    } catch {
      toast.error("GPX-Upload fehlgeschlagen.");
    } finally {
      setGpxUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.date) {
      toast.error("Titel und Datum sind Pflichtfelder.");
      return;
    }
    saveMutation.mutate({
      ...form,
      distance_km: form.distance_km !== "" ? Number(form.distance_km) : null,
      elevation_m: form.elevation_m !== "" ? Number(form.elevation_m) : null,
      duration_minutes: form.duration_minutes !== "" ? Number(form.duration_minutes) : null,
      difficulty: form.difficulty || null,
      rating: form.rating || null,
      dog_difficulty: form.dog_difficulty || null,
    });
  };

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone-500 mb-4">Bitte zuerst anmelden.</p>
          <Link to={createPageUrl("Login")}>
            <Button className="bg-emerald-600 hover:bg-emerald-700">Anmelden</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loadingEntry) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-emerald-50/10 pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 md:py-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Link to={createPageUrl("Journal")}>
            <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-stone-600">
              <ArrowLeft className="w-4 h-4 mr-1" /> Zurück
            </Button>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-stone-800">
            {editId ? "Eintrag bearbeiten" : "Neue Wanderung"}
          </h1>
          <p className="text-stone-500 text-sm mt-0.5">
            {editId ? "Ändere deine Aufzeichnung" : "Halte dein Wandererlebnis fest"}
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Basis-Infos ─────────────────────────────── */}
          <section className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-5 space-y-4">
            <h2 className="font-semibold text-stone-700 text-sm uppercase tracking-wide flex items-center gap-2">
              <FileText className="w-4 h-4" /> Allgemein
            </h2>

            <div>
              <Label htmlFor="title">Titel *</Label>
              <Input id="title" value={form.title} onChange={(e) => set("title", e.target.value)}
                placeholder="z.B. Pragser Wildsee Rundweg" required className="mt-1" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Datum *</Label>
                <Input id="date" type="date" value={form.date} onChange={(e) => set("date", e.target.value)}
                  required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="location" className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Ort</Label>
                <Input id="location" value={form.location} onChange={(e) => set("location", e.target.value)}
                  placeholder="z.B. Prags, Südtirol" className="mt-1" />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Beschreibung / Notizen</Label>
              <Textarea id="description" value={form.description} onChange={(e) => set("description", e.target.value)}
                placeholder="Wie war die Wanderung? Besondere Momente, Tipps..."
                rows={4} className="mt-1" />
            </div>
          </section>

          {/* ── Stats ───────────────────────────────────── */}
          <section className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-5 space-y-4">
            <h2 className="font-semibold text-stone-700 text-sm uppercase tracking-wide flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Statistiken
            </h2>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="distance_km" className="flex items-center gap-1"><Ruler className="w-3.5 h-3.5" /> Distanz (km)</Label>
                <Input id="distance_km" type="number" step="0.1" min="0" value={form.distance_km}
                  onChange={(e) => set("distance_km", e.target.value)}
                  placeholder="z.B. 8.5" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="elevation_m" className="flex items-center gap-1"><Mountain className="w-3.5 h-3.5" /> Höhenmeter</Label>
                <Input id="elevation_m" type="number" min="0" value={form.elevation_m}
                  onChange={(e) => set("elevation_m", e.target.value)}
                  placeholder="z.B. 450" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="duration_minutes" className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Dauer (min)</Label>
                <Input id="duration_minutes" type="number" min="0" value={form.duration_minutes}
                  onChange={(e) => set("duration_minutes", e.target.value)}
                  placeholder="z.B. 180" className="mt-1" />
              </div>
            </div>

            <StarPicker label="Schwierigkeit (Mensch)" value={form.difficulty} onChange={(v) => set("difficulty", v)} />
          </section>

          {/* ── Hund ────────────────────────────────────── */}
          <section className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-5 space-y-4">
            <h2 className="font-semibold text-stone-700 text-sm uppercase tracking-wide flex items-center gap-2">
              <Dog className="w-4 h-4" /> Mit dem Hund
            </h2>

            <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
              <Label htmlFor="dog_suitable" className="cursor-pointer flex items-center gap-2">
                🐕 Hundefreundlich
              </Label>
              <Switch id="dog_suitable" checked={form.dog_suitable} onCheckedChange={(v) => set("dog_suitable", v)} />
            </div>

            <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
              <Label htmlFor="water_available" className="cursor-pointer flex items-center gap-2">
                <Droplets className="w-4 h-4 text-blue-500" /> Wasser verfügbar
              </Label>
              <Switch id="water_available" checked={form.water_available} onCheckedChange={(v) => set("water_available", v)} />
            </div>

            <StarPicker label="Schwierigkeit (Hund)" value={form.dog_difficulty} onChange={(v) => set("dog_difficulty", v)} />

            <div>
              <Label htmlFor="hazard_notes" className="flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Gefahrenhinweise
              </Label>
              <Textarea id="hazard_notes" value={form.hazard_notes} onChange={(e) => set("hazard_notes", e.target.value)}
                placeholder="z.B. Steinschlaggefahr, steile Abschnitte, kein Schatten..." rows={2} className="mt-1" />
            </div>
          </section>

          {/* ── Bewertung ───────────────────────────────── */}
          <section className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-5">
            <h2 className="font-semibold text-stone-700 text-sm uppercase tracking-wide mb-4 flex items-center gap-2">
              <Star className="w-4 h-4" /> Gesamtbewertung
            </h2>
            <StarPicker label="Wie hat dir die Wanderung gefallen?" value={form.rating} onChange={(v) => set("rating", v)} />
          </section>

          {/* ── Fotos ───────────────────────────────────── */}
          <section className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-5 space-y-4">
            <h2 className="font-semibold text-stone-700 text-sm uppercase tracking-wide flex items-center gap-2">
              <Upload className="w-4 h-4" /> Fotos
            </h2>

            {form.photos.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {form.photos.map((url, i) => (
                  <div key={i} className="relative group aspect-square">
                    <img src={url} alt="" className="w-full h-full object-cover rounded-lg" />
                    <button type="button"
                      onClick={() => set("photos", form.photos.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-stone-300 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors">
              <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" disabled={photoUploading} />
              {photoUploading ? (
                <><Loader2 className="w-6 h-6 text-stone-400 animate-spin" /><span className="text-sm text-stone-400">Lade hoch...</span></>
              ) : (
                <><Upload className="w-6 h-6 text-stone-400" /><span className="text-sm text-stone-500">Fotos hochladen</span><span className="text-xs text-stone-400">JPG, PNG, WEBP</span></>
              )}
            </label>
          </section>

          {/* ── GPX ─────────────────────────────────────── */}
          <section className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-5 space-y-3">
            <h2 className="font-semibold text-stone-700 text-sm uppercase tracking-wide flex items-center gap-2">
              <MapPin className="w-4 h-4" /> GPX-Route (optional)
            </h2>

            {form.gpx_url ? (
              <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-sm text-emerald-700 flex-1 truncate">GPX-Datei gespeichert</span>
                <button type="button" onClick={() => set("gpx_url", "")} className="text-stone-400 hover:text-red-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-3 p-4 border-2 border-dashed border-stone-300 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors">
                <input type="file" accept=".gpx" onChange={handleGpxUpload} className="hidden" disabled={gpxUploading} />
                {gpxUploading ? (
                  <><Loader2 className="w-5 h-5 text-stone-400 animate-spin" /><span className="text-sm text-stone-400">Lade hoch...</span></>
                ) : (
                  <><Upload className="w-5 h-5 text-stone-400" /><span className="text-sm text-stone-500">.gpx Datei hochladen</span></>
                )}
              </label>
            )}
          </section>

          {/* ── Submit ──────────────────────────────────── */}
          <div className="flex gap-3 justify-end pb-4">
            <Link to={createPageUrl("Journal")}>
              <Button type="button" variant="outline">Abbrechen</Button>
            </Link>
            <Button
              type="submit"
              disabled={saveMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 px-8"
            >
              {saveMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Speichern...</>
              ) : (
                editId ? "Aktualisieren" : "Wanderung speichern"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
