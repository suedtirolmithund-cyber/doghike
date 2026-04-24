import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { getRoute, updateRoute, deleteRoute } from "@/lib/routesApi";
import { uploadJournalFile } from "@/lib/journalApi";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MapContainer, TileLayer, Polyline, Marker } from "react-leaflet";
import EditableRouteDrawer from "@/components/routes/EditableRouteDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Map, Route, Clock, Navigation, Eye, EyeOff, Trash2, TrendingUp, CheckCircle2, Star, Lock, Users, Upload, X, Loader2, Pencil, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import ExpandableText from "@/components/ExpandableText";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export default function RouteDetail() {
  const [searchParams] = useSearchParams();
  const routeId = searchParams.get("id");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [showJournalDialog, setShowJournalDialog] = useState(false);
  const [completeData, setCompleteData] = useState({
    completed_date: format(new Date(), "yyyy-MM-dd"),
    completed_duration_minutes: "",
    completed_notes: "",
    completed_rating: 0,
    completed_visibility: "private",
    difficulty: "",
    dog_difficulty: "",
    season: "",
    water_availability: "",
    hazard_notes: "",
    parking_info: "",
    restaurant_info: "",
    photos: [],
    dogs: [],
  });
  const [hoverRating, setHoverRating] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [editingRoute, setEditingRoute] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { user } = useAuth();

  const updateCoordinatesMutation = useMutation({
    mutationFn: (data) => updateRoute(routeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["route", routeId] });
      setEditingRoute(false);
    },
  });

  const { data: route, isLoading } = useQuery({
    queryKey: ["route", routeId],
    queryFn: () => getRoute(routeId),
    enabled: !!routeId,
  });

  const { data: myDogs = [] } = useQuery({
    queryKey: ["dogs", user?.id],
    queryFn: async () => {
      const { getDogs } = await import("@/lib/profilesApi");
      return getDogs(user.id);
    },
    enabled: !!user?.id,
  });

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0 || !user) return;
    setUploading(true);
    try {
      const urls = await Promise.all(files.map((f) => uploadJournalFile(user.id, f)));
      setCompleteData((prev) => ({ ...prev, photos: [...(prev.photos || []), ...urls] }));
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index) => {
    setCompleteData(prev => ({ ...prev, photos: prev.photos.filter((_, i) => i !== index) }));
  };

  const toggleDog = (dogId) => {
    setCompleteData(prev => ({
      ...prev,
      dogs: prev.dogs.includes(dogId) ? prev.dogs.filter(id => id !== dogId) : [...prev.dogs, dogId],
    }));
  };

  const deleteRouteMutation = useMutation({
    mutationFn: () => deleteRoute(routeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userRoutes", user?.id] });
      navigate(createPageUrl("Profile"));
    },
  });

  const completeRouteMutation = useMutation({
    mutationFn: (data) => updateRoute(routeId, { completed: true, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["route", routeId] });
      setShowCompleteForm(false);
      setShowJournalDialog(true); // Prompt to create journal entry
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-slate-50 flex items-center justify-center">
        <p className="text-stone-600">Lade Route...</p>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-stone-700 mb-4">Route nicht gefunden</p>
          <Link to={createPageUrl("Profile")}>
            <Button>Zurück zum Profil</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === route.user_id;
  const RouteIcon = route.route_type === "recorded" ? Navigation : Map;

  // Build URL to pre-fill AddJournalEntry from route data
  const journalParams = new URLSearchParams({
    prefill_title: route.name || "",
    prefill_location: route.start_location || "",
    prefill_distance: route.distance_km ?? "",
    prefill_elevation: route.elevation_gain_m ?? "",
    prefill_duration: route.duration_minutes || "",
    prefill_description: [
      route.completed_notes,
      route.notes,
      route.description,
    ].filter(Boolean).join("\n\n"),
  });
  const journalUrl = createPageUrl("AddJournalEntry") + "?" + journalParams.toString();

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-slate-50 pb-24 md:pb-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <Link to={createPageUrl("Profile")}>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zur�ck
          </Button>
        </Link>

        <div className="space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 border border-stone-200/50 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <RouteIcon className="w-5 h-5 text-slate-700" />
                  <span className="text-sm text-stone-500">
                    {route.route_type === "recorded" ? "GPS-Aufzeichnung" : "Geplante Route"}
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-stone-800 mb-2">
                  {route.name}
                </h1>
                {route.start_location && (
                  <p className="text-stone-600">📍 {route.start_location}</p>
                )}
              </div>

              {isOwner && (
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  <Link to={journalUrl}>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      <BookOpen className="w-4 h-4 mr-1.5" />
                      Als Wanderung eintragen
                    </Button>
                  </Link>
                  <Link to={createPageUrl("EditRoute") + `?id=${routeId}`}>
                    <Button size="sm" variant="outline">
                      <Pencil className="w-4 h-4 mr-1.5" />
                      Bearbeiten
                    </Button>
                  </Link>
                  <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Route löschen?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Diese Route wird dauerhaft gelöscht. Das kann nicht rückgängig gemacht werden.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteRouteMutation.mutate()}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Löschen
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm">
              {route.route_type === "planned" ? (
                <span className="flex items-center gap-1 text-stone-500">
                  <EyeOff className="w-4 h-4" />
                  Private Planung
                </span>
              ) : route.is_public ? (
                <span className="flex items-center gap-1 text-green-600">
                  <Eye className="w-4 h-4" />
                  �ffentlich
                </span>
              ) : (
                <span className="flex items-center gap-1 text-stone-500">
                  <EyeOff className="w-4 h-4" />
                  Privat
                </span>
              )}
              <span className="text-stone-400">•</span>
              <span className="text-stone-500">
                {route.created_at ? format(new Date(route.created_at), "dd.MM.yyyy") : ""}
              </span>
            </div>
          </motion.div>

          {/* Map */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 border border-stone-200/50 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-stone-800">Routenverlauf</h2>
              {isOwner && route.route_type === "planned" && !editingRoute && (
                <Button variant="outline" size="sm" onClick={() => setEditingRoute(true)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Punkte bearbeiten
                </Button>
              )}
            </div>

            {editingRoute ? (
              <div className="space-y-4">
                <EditableRouteDrawer
                  initialCoordinates={route.waypoints}
                  onSave={(routeData) => {
                    updateCoordinatesMutation.mutate({
                      waypoints: routeData.coordinates,
                      distance_km: routeData.distance_km,
                      elevation_gain_m: routeData.elevation_gain_m,
                      duration_minutes: routeData.duration_minutes,
                    });
                  }}
                />
                <Button variant="outline" onClick={() => setEditingRoute(false)} className="w-full">
                  Abbrechen
                </Button>
              </div>
            ) : (
              <div className="h-96 md:h-[500px] rounded-xl overflow-hidden border border-stone-200">
                {route.waypoints?.length > 0 ? (
                  <MapContainer
                    center={route.waypoints[0]}
                    zoom={13}
                    style={{ height: "100%", width: "100%" }}
                    scrollWheelZoom={false}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; OpenStreetMap'
                    />
                    <Polyline positions={route.waypoints} color="#1e293b" weight={4} />
                    <Marker position={route.waypoints[0]} />
                    {route.waypoints.length > 1 && (
                      <Marker position={route.waypoints[route.waypoints.length - 1]} />
                    )}
                  </MapContainer>
                ) : (
                  <div className="h-full flex items-center justify-center bg-stone-50 text-stone-400 text-sm">
                    Keine Wegpunkte vorhanden
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 border border-stone-200/50 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-stone-800 mb-4">Details</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <Route className="w-5 h-5 mx-auto mb-2 text-slate-700" />
                <p className="text-2xl font-bold text-slate-800">{route.distance_km ?? "–"}</p>
                <p className="text-xs text-stone-500">Kilometer</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <Clock className="w-5 h-5 mx-auto mb-2 text-slate-700" />
                <p className="text-2xl font-bold text-slate-800">
                  {route.duration_minutes
                    ? Math.floor(route.duration_minutes / 60) > 0
                      ? `${Math.floor(route.duration_minutes / 60)}h ${route.duration_minutes % 60}min`
                      : `${route.duration_minutes}min`
                    : "–"}
                </p>
                <p className="text-xs text-stone-500">Gehzeit</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <TrendingUp className="w-5 h-5 mx-auto mb-2 text-slate-700" />
                <p className="text-2xl font-bold text-slate-800">
                  {route.elevation_gain_m ? `+${route.elevation_gain_m}` : "–"}
                </p>
                <p className="text-xs text-stone-500">Höhenmeter</p>
              </div>
              {route.avg_speed_kmh && (
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <Navigation className="w-5 h-5 mx-auto mb-2 text-slate-700" />
                  <p className="text-2xl font-bold text-slate-800">{route.avg_speed_kmh}</p>
                  <p className="text-xs text-stone-500">km/h ⌀</p>
                </div>
              )}
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <Map className="w-5 h-5 mx-auto mb-2 text-slate-700" />
                <p className="text-2xl font-bold text-slate-800">{route.waypoints?.length ?? 0}</p>
                <p className="text-xs text-stone-500">Wegpunkte</p>
              </div>
            </div>

            {route.description && (
              <div className="mb-4">
                <h3 className="font-medium text-stone-800 mb-2">Beschreibung</h3>
                <ExpandableText text={route.description} />
              </div>
            )}

            {route.notes && (
              <div>
                <h3 className="font-medium text-stone-800 mb-2">Notizen</h3>
                <ExpandableText text={route.notes} />
              </div>
            )}
          </motion.div>

          {/* Complete Route Section */}
          {isOwner && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-6 border border-stone-200/50 shadow-sm"
            >
              {route.completed ? (
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 rounded-full p-2">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-green-700">Tour erledigt! 🎉</p>
                    {route.completed_date && (
                      <p className="text-sm text-stone-500">Am {format(new Date(route.completed_date), "dd.MM.yyyy")}</p>
                    )}
                    {route.completed_rating > 0 && (
                      <div className="flex gap-0.5 mt-1">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`w-4 h-4 ${s <= route.completed_rating ? "fill-yellow-400 text-yellow-400" : "text-stone-300"}`} />
                        ))}
                      </div>
                    )}
                    {route.completed_notes && (
                      <p className="text-sm text-stone-600 mt-1">{route.completed_notes}</p>
                    )}
                    {route.completed_duration_minutes && (
                      <p className="text-sm text-stone-500 mt-1">
                        Dauer: {Math.floor(route.completed_duration_minutes / 60) > 0
                          ? `${Math.floor(route.completed_duration_minutes / 60)}h ${route.completed_duration_minutes % 60}min`
                          : `${route.completed_duration_minutes}min`}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCompleteForm(true)}
                    className="text-stone-500"
                  >
                    Bearbeiten
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-stone-800">Tour gemacht?</h3>
                    <p className="text-sm text-stone-500">Markiere diese Route als erledigt</p>
                  </div>
                  <Button
                    onClick={() => setShowCompleteForm(true)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Als erledigt markieren
                  </Button>
                </div>
              )}

              <AnimatePresence>
                {showCompleteForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-stone-200 mt-4 pt-4 space-y-4">
                      <h4 className="font-medium text-stone-800">Tour-Details ergänzen</h4>

                      {/* Date */}
                      <div>
                        <label className="text-sm font-medium text-stone-700 mb-1 block">Datum der Tour</label>
                        <Input
                          type="date"
                          value={completeData.completed_date}
                          onChange={(e) => setCompleteData({ ...completeData, completed_date: e.target.value })}
                        />
                      </div>

                      {/* Duration */}
                      <div>
                        <label className="text-sm font-medium text-stone-700 mb-1 block">Tatsächliche Gehzeit (Minuten)</label>
                        <Input
                          type="number"
                          placeholder="z.B. 150"
                          value={completeData.completed_duration_minutes}
                          onChange={(e) => setCompleteData({ ...completeData, completed_duration_minutes: Number(e.target.value) })}
                        />
                      </div>

                      {/* Difficulty */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-stone-700 mb-1 block">Schwierigkeit (Mensch) 👤</label>
                          <Select value={completeData.difficulty} onValueChange={(v) => setCompleteData({ ...completeData, difficulty: v })}>
                            <SelectTrigger><SelectValue placeholder="Wählen" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 – Leicht</SelectItem>
                              <SelectItem value="2">2 – Mittel-leicht</SelectItem>
                              <SelectItem value="3">3 – Mittel</SelectItem>
                              <SelectItem value="4">4 – Anspruchsvoll</SelectItem>
                              <SelectItem value="5">5 – Schwer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-stone-700 mb-1 block">Schwierigkeit (Hund) 🐕</label>
                          <Select value={completeData.dog_difficulty} onValueChange={(v) => setCompleteData({ ...completeData, dog_difficulty: v })}>
                            <SelectTrigger><SelectValue placeholder="Wählen" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 – Leicht</SelectItem>
                              <SelectItem value="2">2 – Mittel-leicht</SelectItem>
                              <SelectItem value="3">3 – Mittel</SelectItem>
                              <SelectItem value="4">4 – Anspruchsvoll</SelectItem>
                              <SelectItem value="5">5 – Schwer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Season & Water */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-stone-700 mb-1 block">Beste Jahreszeit</label>
                          <Select value={completeData.season} onValueChange={(v) => setCompleteData({ ...completeData, season: v })}>
                            <SelectTrigger><SelectValue placeholder="Wählen" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="spring">🌸 Frühling</SelectItem>
                              <SelectItem value="summer">☀️ Sommer</SelectItem>
                              <SelectItem value="autumn">🍂 Herbst</SelectItem>
                              <SelectItem value="winter">❄️ Winter</SelectItem>
                              <SelectItem value="all_year">🍃 Ganzjährig</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-stone-700 mb-1 block">Wasser unterwegs 💧</label>
                          <Select value={completeData.water_availability} onValueChange={(v) => setCompleteData({ ...completeData, water_availability: v })}>
                            <SelectTrigger><SelectValue placeholder="Wählen" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">🚫 Kein Wasser</SelectItem>
                              <SelectItem value="little">💧 Wenig Wasser</SelectItem>
                              <SelectItem value="moderate">💧💧 Etwas Wasser</SelectItem>
                              <SelectItem value="plenty">💧💧💧 Viel Wasser</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Rating */}
                      <div>
                        <label className="text-sm font-medium text-stone-700 mb-2 block">Bewertung</label>
                        <div className="flex gap-1">
                          {[1,2,3,4,5].map(star => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setCompleteData({ ...completeData, completed_rating: star })}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                            >
                              <Star className={`w-8 h-8 transition-colors ${star <= (hoverRating || completeData.completed_rating) ? "fill-yellow-400 text-yellow-400" : "text-stone-300"}`} />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Dogs */}
                      {myDogs.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-stone-700 mb-2 block">🐕 Welche Hunde waren dabei?</label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {myDogs.map((dog) => (
                              <div
                                key={dog.id}
                                className="flex items-center gap-3 p-3 rounded-lg border border-stone-200 hover:bg-stone-50 cursor-pointer"
                                onClick={() => toggleDog(dog.id)}
                              >
                                <Checkbox checked={completeData.dogs.includes(dog.id)} onCheckedChange={() => toggleDog(dog.id)} />
                                <img src={dog.photo_url || `https://api.dicebear.com/7.x/thumbs/svg?seed=${dog.name}`} alt={dog.name} className="w-8 h-8 rounded-full object-cover" />
                                <div>
                                  <p className="text-sm font-medium text-stone-800">{dog.name}</p>
                                  {dog.breed && <p className="text-xs text-stone-500">{dog.breed}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Photos */}
                      <div>
                        <label className="text-sm font-medium text-stone-700 mb-2 block">Fotos</label>
                        <div className="flex flex-wrap gap-3">
                          {completeData.photos?.map((url, index) => (
                            <div key={url} className="relative group">
                              <img src={url} alt={`Foto ${index + 1}`} className="w-20 h-20 object-cover rounded-xl" />
                              <button
                                type="button"
                                onClick={() => removePhoto(index)}
                                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          <label className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-stone-300 rounded-xl cursor-pointer hover:border-slate-500 transition-colors">
                            <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
                            {uploading ? <Loader2 className="w-5 h-5 text-stone-400 animate-spin" /> : <><Upload className="w-5 h-5 text-stone-400" /><span className="text-xs text-stone-400 mt-1">Fotos</span></>}
                          </label>
                        </div>
                      </div>

                      {/* Parking */}
                      <div>
                        <label className="text-sm font-medium text-stone-700 mb-1 block">🅿️ Ausgangspunkt & Parken</label>
                        <Textarea
                          placeholder="z.B. Großer Parkplatz am Pragser Wildsee..."
                          value={completeData.parking_info}
                          onChange={(e) => setCompleteData({ ...completeData, parking_info: e.target.value })}
                          rows={2}
                        />
                      </div>

                      {/* Restaurant */}
                      <div>
                        <label className="text-sm font-medium text-stone-700 mb-1 block">🍽️ Einkehrmöglichkeiten (optional)</label>
                        <Textarea
                          placeholder="z.B. Seekofel Hütte (2324m)..."
                          value={completeData.restaurant_info}
                          onChange={(e) => setCompleteData({ ...completeData, restaurant_info: e.target.value })}
                          rows={2}
                        />
                      </div>

                      {/* Hazard */}
                      <div>
                        <label className="text-sm font-medium text-stone-700 mb-1 block">⚠️ Gefahrenstellen (optional)</label>
                        <Textarea
                          placeholder="z.B. steile Passagen, Leitern, Kühe auf der Alm..."
                          value={completeData.hazard_notes}
                          onChange={(e) => setCompleteData({ ...completeData, hazard_notes: e.target.value })}
                          rows={2}
                        />
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="text-sm font-medium text-stone-700 mb-1 block">Beschreibung & Notizen</label>
                        <Textarea
                          placeholder="Wie war die Tour? Besondere Erlebnisse, Highlights..."
                          value={completeData.completed_notes}
                          onChange={(e) => setCompleteData({ ...completeData, completed_notes: e.target.value })}
                          rows={3}
                        />
                      </div>

                      {/* Visibility */}
                      <div>
                        <label className="text-sm font-medium text-stone-700 mb-2 block">Sichtbarkeit</label>
                        <div className="flex gap-2">
                          {[
                            { value: "private", label: "Privat", icon: Lock },
                            { value: "friends", label: "Freunde", icon: Users },
                            { value: "public", label: "Öffentlich", icon: Eye },
                          ].map(({ value, label, icon: Icon }) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setCompleteData({ ...completeData, completed_visibility: value })}
                              className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                                completeData.completed_visibility === value
                                  ? "border-slate-800 bg-slate-50 text-slate-800"
                                  : "border-stone-200 text-stone-500 hover:border-stone-300"
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" onClick={() => setShowCompleteForm(false)} className="flex-1">
                          Abbrechen
                        </Button>
                        <Button
                          onClick={() => completeRouteMutation.mutate({
                            completed_date: completeData.completed_date || null,
                            completed_notes: [
                              completeData.completed_notes,
                              completeData.parking_info ? `🅿️ ${completeData.parking_info}` : null,
                              completeData.restaurant_info ? `🍽️ ${completeData.restaurant_info}` : null,
                              completeData.hazard_notes ? `⚠️ ${completeData.hazard_notes}` : null,
                            ].filter(Boolean).join("\n\n") || null,
                            completed_rating: completeData.completed_rating || null,
                            completed_duration_minutes: completeData.completed_duration_minutes
                              ? Number(completeData.completed_duration_minutes)
                              : undefined,
                          })}
                          disabled={completeRouteMutation.isPending}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Speichern
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

        </div>
      </div>

      {/* Journal creation dialog */}
      <AnimatePresence>
        {showJournalDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full"
            >
              <div className="text-center mb-5">
                <div className="text-4xl mb-3">🎉</div>
                <h3 className="text-lg font-semibold text-stone-800">Tour erledigt!</h3>
                <p className="text-stone-500 text-sm mt-2">
                  Möchtest du einen Tagebucheintrag für diese Wanderung erstellen?
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Link to={journalUrl} onClick={() => setShowJournalDialog(false)}>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Ja, Tagebucheintrag erstellen
                  </Button>
                </Link>
                <Button variant="outline" onClick={() => setShowJournalDialog(false)} className="w-full">
                  Nein, später vielleicht
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

