import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MapContainer, TileLayer, Polyline, Marker } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Map, Route, Clock, Navigation, Eye, EyeOff, Trash2, Star, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import RatingSection from "@/components/community/RatingSection";
import CommentSection from "@/components/community/CommentSection";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});


  const [selectedRating, setSelectedRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me(),
  });

  const { data: ratings = [] } = useQuery({
    queryKey: ["routeRatings", routeId],
    queryFn: () => base44.entities.RouteRating.filter({ route_id: routeId }),
  });

  const { data: userRating } = useQuery({
    queryKey: ["userRouteRating", routeId, user?.email],
    queryFn: () =>
      base44.entities.RouteRating.filter({ route_id: routeId, user_email: user?.email }),
    enabled: !!user?.email,
  });

  const createRatingMutation = useMutation({
    mutationFn: (data) => base44.entities.RouteRating.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routeRatings", routeId] });
      queryClient.invalidateQueries({ queryKey: ["userRouteRating", routeId] });
      setSelectedRating(0);
    },
  });

  const updateRatingMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.RouteRating.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routeRatings", routeId] });
      queryClient.invalidateQueries({ queryKey: ["userRouteRating", routeId] });
      setSelectedRating(0);
    },
  });

  const averageRating = ratings.length > 0
    ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
    : 0;

  const existingRating = userRating?.[0];

  const handleRatingSubmit = async () => {
    if (selectedRating === 0) return;

    if (existingRating) {
      await updateRatingMutation.mutateAsync({
        id: existingRating.id,
        data: { rating: selectedRating },
      });
    } else {
      await createRatingMutation.mutateAsync({
        route_id: routeId,
        user_email: user?.email,
        rating: selectedRating,
      });
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 md:p-6 border border-stone-200">
      <div className="mb-4 md:mb-6">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl md:text-4xl font-bold text-stone-800">{averageRating}</span>
          <span className="text-stone-500 text-sm md:text-base">/ 5</span>
        </div>
        <div className="flex items-center gap-1 mb-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-5 h-5 ${
                star <= Math.round(averageRating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-stone-300"
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-stone-500">{ratings.length} Bewertungen</p>
      </div>

      {user && (
        <div className="border-t border-stone-200 pt-4 md:pt-6">
          <p className="font-semibold text-stone-800 mb-3 text-sm md:text-base">
            {existingRating ? "Deine Bewertung ändern" : "Route bewerten"}
          </p>
          <div className="flex items-center justify-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <motion.button
                key={star}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="focus:outline-none touch-manipulation"
              >
                <Star
                  className={`w-10 h-10 md:w-8 md:h-8 transition-colors ${
                    star <= (hoverRating || selectedRating || existingRating?.rating || 0)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-stone-300"
                  }`}
                />
              </motion.button>
            ))}
          </div>
          <Button
            onClick={handleRatingSubmit}
            disabled={
              selectedRating === 0 ||
              createRatingMutation.isPending ||
              updateRatingMutation.isPending
            }
            className="w-full bg-slate-800 hover:bg-slate-900"
          >
            {existingRating ? "Bewertung aktualisieren" : "Bewertung abgeben"}
          </Button>
        </div>
      )}
    </div>
  );
}

// Custom Comment Section for Routes
function RouteCommentSection({ routeId }) {
  const [commentText, setCommentText] = useState("");
  const [deleteCommentId, setDeleteCommentId] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me(),
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["routeComments", routeId],
    queryFn: () => base44.entities.RouteComment.filter({ route_id: routeId }, "-created_date", 100),
  });

  const createCommentMutation = useMutation({
    mutationFn: (data) => base44.entities.RouteComment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routeComments", routeId] });
      setCommentText("");
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (id) => base44.entities.RouteComment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routeComments", routeId] });
      setDeleteCommentId(null);
    },
  });

  const handleSubmit = async () => {
    if (!commentText.trim()) return;

    await createCommentMutation.mutateAsync({
      route_id: routeId,
      user_name: user?.full_name || "Anonym",
      user_email: user?.email,
      text: commentText,
    });
  };

  return (
    <div className="space-y-6">


      <div className="space-y-3">
        <h3 className="font-semibold text-stone-800 text-sm md:text-base">
          Kommentare ({comments.length})
        </h3>
        
        {comments.map((comment) => (
          <div key={comment.id} className="bg-white rounded-xl p-4 md:p-6 border border-stone-200">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <p className="font-semibold text-stone-800 text-sm">{comment.user_name}</p>
                <p className="text-xs text-stone-500">
                  {format(new Date(comment.created_date), "dd.MM.yyyy")}
                </p>
              </div>
              {user?.email === comment.created_by && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteCommentMutation.mutate(comment.id)}
                  className="text-stone-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
            <p className="text-stone-700 text-sm">{comment.text}</p>
          </div>
        ))}

        {comments.length === 0 && (
          <p className="text-center text-stone-500 py-8 text-sm">
            Noch keine Kommentare. Sei der Erste!
          </p>
        )}
      </div>
    </div>
  );
}

export default function RouteDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const routeId = urlParams.get("id");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
  const routeIcon = route.route_type === "recorded" ? Navigation : Map;
  const RouteIcon = routeIcon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-slate-50 pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <Link to={createPageUrl("Profile")}>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
        </Link>

        <div className="grid grid-cols-1 gap-6">
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
                  {format(new Date(route.created_date), "dd.MM.yyyy")}
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
                {route.duration_minutes && (
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <Clock className="w-5 h-5 mx-auto mb-2 text-slate-700" />
                    <p className="text-2xl font-bold text-slate-800">
                      {Math.floor(route.duration_minutes / 60) > 0
                        ? `${Math.floor(route.duration_minutes / 60)}h ${route.duration_minutes % 60}min`
                        : `${route.duration_minutes}min`}
                    </p>
                    <p className="text-xs text-stone-500">Gehzeit</p>
                  </div>
                )}
                {route.elevation_gain_m && (
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <TrendingUp className="w-5 h-5 mx-auto mb-2 text-slate-700" />
                    <p className="text-2xl font-bold text-slate-800">+{route.elevation_gain_m}</p>
                    <p className="text-xs text-stone-500">Höhenmeter</p>
                  </div>
                )}
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

            {/* Community */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Tabs defaultValue="comments" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 bg-white border border-stone-200">
                  <TabsTrigger value="comments">Kommentare</TabsTrigger>
                  <TabsTrigger value="ratings">Bewertungen</TabsTrigger>
                </TabsList>

                <TabsContent value="comments">
                  <RouteCommentSection routeId={routeId} />
                </TabsContent>

                <TabsContent value="ratings">
                  <RouteRatingSection routeId={routeId} />
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>


        </div>
      </div>
    </div>
  );
}