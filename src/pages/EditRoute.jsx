import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { getRoute, updateRoute } from "@/lib/routesApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Map, Loader2 } from "lucide-react";
import EditableRouteDrawer from "@/components/routes/EditableRouteDrawer";
import RoutePreviewMap from "@/components/routes/RoutePreviewMap";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function EditRoute() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const routeId = searchParams.get("id");

  const [routeData, setRouteData] = useState(null);
  const [routeGeometry, setRouteGeometry] = useState(null);
  const [editingMap, setEditingMap] = useState(false);

  const { data: route, isLoading } = useQuery({
    queryKey: ["route", routeId],
    queryFn: () => getRoute(routeId),
    enabled: !!routeId,
  });

  useEffect(() => {
    if (route) {
      setRouteData({
        name: route.name ?? "",
        description: route.description ?? "",
        start_location: route.start_location ?? "",
        notes: route.notes ?? "",
        is_public: route.is_public ?? false,
      });
      setRouteGeometry({
        coordinates: route.waypoints ?? [],
        distance_km: route.distance_km ?? 0,
        duration_minutes: route.duration_minutes ?? null,
        elevation_gain_m: route.elevation_gain_m ?? null,
      });
    }
  }, [route]);

  const updateMutation = useMutation({
    mutationFn: (data) => updateRoute(routeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userRoutes"] });
      queryClient.invalidateQueries({ queryKey: ["route", routeId] });
      toast.success("Route aktualisiert");
      navigate(`${createPageUrl("RouteDetail")}?id=${routeId}`);
    },
    onError: () => toast.error("Die Route konnte gerade nicht gespeichert werden. Bitte versuche es noch einmal."),
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!routeData?.name) {
      toast.error("Bitte gib einen Namen ein");
      return;
    }

    await updateMutation.mutateAsync({
      name: routeData.name,
      description: routeData.description,
      start_location: routeData.start_location,
      notes: routeData.notes,
      is_public: routeData.is_public,
      waypoints: routeGeometry.coordinates,
      distance_km: routeGeometry.distance_km,
      duration_minutes: routeGeometry.duration_minutes ?? null,
      elevation_gain_m: routeGeometry.elevation_gain_m ?? null,
    });
  };

  if (isLoading || !routeData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-slate-50 pb-24 md:pb-8">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8">
        <Link to={`${createPageUrl("RouteDetail")}?id=${routeId}`}>
          <Button variant="ghost" className="mb-3 md:mb-4" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Zurück zur Route
          </Button>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-4 md:p-8 border border-stone-200/50 shadow-sm"
        >
          <div className="flex items-start gap-3 mb-6">
            <Map className="w-6 h-6 text-slate-700 flex-shrink-0 mt-1" />
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-stone-800">Route bearbeiten</h1>
              <p className="text-xs text-stone-500 mt-0.5">Aendere den Streckenverlauf oder die Details</p>
            </div>
          </div>

          {editingMap ? (
            <div className="mb-6">
              <EditableRouteDrawer
                onSave={(geometry) => {
                  setRouteGeometry(geometry);
                  setEditingMap(false);
                }}
                initialRoute={routeGeometry?.coordinates ?? []}
              />
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setEditingMap(false)}>
                Abbrechen
              </Button>
            </div>
          ) : (
            <div className="mb-6">
              <div className="rounded-xl overflow-hidden border border-stone-200 mb-3">
                <RoutePreviewMap coordinates={routeGeometry?.coordinates ?? []} />
              </div>
              {route?.route_type === "planned" && (
                <Button variant="outline" size="sm" onClick={() => setEditingMap(true)}>
                  <Map className="w-4 h-4 mr-2" /> Streckenverlauf aendern
                </Button>
              )}
            </div>
          )}

          {routeGeometry && (
            <div className="bg-slate-50 rounded-lg p-3 mb-6 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs md:text-sm">
              <div>
                <p className="text-stone-500">Distanz</p>
                <p className="font-bold text-slate-800">{routeGeometry.distance_km} km</p>
              </div>
              {routeGeometry.duration_minutes && (
                <div>
                  <p className="text-stone-500">Dauer</p>
                  <p className="font-bold text-slate-800">
                    {Math.floor(routeGeometry.duration_minutes / 60) > 0
                      ? `${Math.floor(routeGeometry.duration_minutes / 60)}h ${routeGeometry.duration_minutes % 60}min`
                      : `${routeGeometry.duration_minutes}min`}
                  </p>
                </div>
              )}
              {routeGeometry.elevation_gain_m && (
                <div>
                  <p className="text-stone-500">Aufstieg</p>
                  <p className="font-bold text-slate-800">+{routeGeometry.elevation_gain_m} m</p>
                </div>
              )}
              <div>
                <p className="text-stone-500">Wegpunkte</p>
                <p className="font-bold text-slate-800">{routeGeometry.coordinates?.length ?? 0}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={routeData.name}
                onChange={(event) => setRouteData({ ...routeData, name: event.target.value })}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="start_location">Startpunkt</Label>
              <Input
                id="start_location"
                value={routeData.start_location}
                onChange={(event) => setRouteData({ ...routeData, start_location: event.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                value={routeData.description}
                rows={3}
                onChange={(event) => setRouteData({ ...routeData, description: event.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="notes">Notizen</Label>
              <Textarea
                id="notes"
                value={routeData.notes}
                rows={2}
                onChange={(event) => setRouteData({ ...routeData, notes: event.target.value })}
                className="mt-1"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Link to={`${createPageUrl("RouteDetail")}?id=${routeId}`}>
                <Button type="button" variant="outline" size="sm">Abbrechen</Button>
              </Link>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="bg-slate-800 hover:bg-slate-900 flex-1"
                size="sm"
              >
                {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Aenderungen speichern
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
