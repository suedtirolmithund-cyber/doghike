import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MapContainer, TileLayer, Polyline, Marker } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Map, Route, Clock, Navigation, Eye, EyeOff, Trash2, TrendingUp, CheckCircle2, Star, Lock, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
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
  const urlParams = new URLSearchParams(window.location.search);
  const routeId = urlParams.get("id");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [completeData, setCompleteData] = useState({
    completed_date: format(new Date(), "yyyy-MM-dd"),
    completed_duration_minutes: "",
    completed_notes: "",
    completed_rating: 0,
    completed_visibility: "private",
  });
  const [hoverRating, setHoverRating] = useState(0);

  const { data: route, isLoading } = useQuery({
    queryKey: ["route", routeId],
    queryFn: async () => {
      const routes = await base44.entities.UserRoute.filter({ id: routeId });
      return routes[0];
    },
    enabled: !!routeId,
  });

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me(),
  });

  const deleteRouteMutation = useMutation({
    mutationFn: () => base44.entities.UserRoute.delete(routeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userRoutes"] });
      navigate(createPageUrl("Profile"));
    },
  });

  const completeRouteMutation = useMutation({
    mutationFn: (data) => base44.entities.UserRoute.update(routeId, {
      completed: true,
      ...data,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["route", routeId] });
      setShowCompleteForm(false);
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

  const isOwner = user?.email === route.created_by;
  const RouteIcon = route.route_type === "recorded" ? Navigation : Map;

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-slate-50 pb-24 md:pb-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <Link to={createPageUrl("Profile")}>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm("Route wirklich löschen?")) {
                      deleteRouteMutation.mutate();
                    }
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm">
              {route.is_public ? (
                <span className="flex items-center gap-1 text-green-600">
                  <Eye className="w-4 h-4" />
                  Öffentlich
                </span>
              ) : (
                <span className="flex items-center gap-1 text-stone-500">
                  <EyeOff className="w-4 h-4" />
                  Privat
                </span>
              )}
              <span className="text-stone-400">•</span>
              <span className="text-stone-500">
                {route.created_date ? format(new Date(route.created_date), "dd.MM.yyyy") : ""}
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
            <h2 className="text-lg font-semibold text-stone-800 mb-4">Routenverlauf</h2>
            <div className="h-96 md:h-[500px] rounded-xl overflow-hidden border border-stone-200">
              <MapContainer
                center={route.coordinates[0] || [46.5, 11.9]}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap'
                />
                <Polyline positions={route.coordinates} color="#1e293b" weight={4} />
                <Marker position={route.coordinates[0]} />
                <Marker position={route.coordinates[route.coordinates.length - 1]} />
              </MapContainer>
            </div>
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
                <p className="text-2xl font-bold text-slate-800">{route.distance_km}</p>
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
                <p className="text-2xl font-bold text-slate-800">{route.coordinates.length}</p>
                <p className="text-xs text-stone-500">Wegpunkte</p>
              </div>
            </div>

            {route.description && (
              <div className="mb-4">
                <h3 className="font-medium text-stone-800 mb-2">Beschreibung</h3>
                <p className="text-stone-600">{route.description}</p>
              </div>
            )}

            {route.notes && (
              <div>
                <h3 className="font-medium text-stone-800 mb-2">Notizen</h3>
                <p className="text-stone-600">{route.notes}</p>
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

                      {/* Notes */}
                      <div>
                        <label className="text-sm font-medium text-stone-700 mb-1 block">Notizen zur Tour</label>
                        <Textarea
                          placeholder="Wie war die Tour? Besondere Erlebnisse?"
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
                          onClick={() => completeRouteMutation.mutate(completeData)}
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
    </div>
  );
}