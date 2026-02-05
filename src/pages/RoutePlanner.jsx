import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Map, Navigation, Loader2 } from "lucide-react";
import RouteDrawer from "@/components/routes/RouteDrawer";
import GPSTracker from "@/components/routes/GPSTracker";
import RoutePreviewMap from "@/components/routes/RoutePreviewMap";
import { motion } from "framer-motion";

export default function RoutePlanner() {
  const [activeTab, setActiveTab] = useState("draw");
  const [routeData, setRouteData] = useState({
    name: "",
    description: "",
    start_location: "",
    notes: "",
    is_public: false,
  });
  const [routeGeometry, setRouteGeometry] = useState(null);
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me(),
  });

  const createRouteMutation = useMutation({
    mutationFn: (data) => base44.entities.UserRoute.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userRoutes"] });
      navigate(createPageUrl("Profile"));
    },
  });

  const handleRouteSave = (geometry) => {
    setRouteGeometry(geometry);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!routeGeometry || !routeData.name) {
      alert("Bitte gib einen Namen ein und erstelle eine Route");
      return;
    }

    await createRouteMutation.mutateAsync({
      ...routeData,
      route_type: activeTab === "draw" ? "planned" : "recorded",
      coordinates: routeGeometry.coordinates,
      distance_km: routeGeometry.distance_km,
      duration_minutes: routeGeometry.duration_minutes || null,
      avg_speed_kmh: routeGeometry.avg_speed_kmh || null,
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-xl text-stone-700 mb-4">Bitte melde dich an, um Routen zu planen</p>
          <Button onClick={() => base44.auth.redirectToLogin()}>
            Anmelden
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-slate-50 pb-24 md:pb-8">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8">
        <Link to={createPageUrl("Profile")}>
          <Button variant="ghost" className="mb-3 md:mb-4" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Zurück zum Profil</span>
            <span className="sm:hidden">Zurück</span>
          </Button>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-4 md:p-8 border border-stone-200/50 shadow-sm"
        >
          <div className="flex items-start gap-3 mb-4 md:mb-6">
            <Map className="w-6 h-6 md:w-8 md:h-8 text-slate-700 flex-shrink-0 mt-1" />
            <div>
              <h1 className="text-xl md:text-3xl font-bold text-stone-800">Routenplaner</h1>
              <p className="text-xs md:text-sm text-stone-500 mt-1">Plane oder zeichne deine eigene Wanderroute auf</p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-stone-100">
              <TabsTrigger value="draw" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                <Map className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Route planen</span>
                <span className="sm:hidden">Planen</span>
              </TabsTrigger>
              <TabsTrigger value="track" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                <Navigation className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">GPS aufzeichnen</span>
                <span className="sm:hidden">GPS</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="draw" className="space-y-6">
              <RouteDrawer onSave={handleRouteSave} />
            </TabsContent>

            <TabsContent value="track" className="space-y-6">
              <GPSTracker onSave={handleRouteSave} />
            </TabsContent>
          </Tabs>

          {/* Route Preview Map */}
          {routeGeometry && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 md:mt-8"
            >
              <RoutePreviewMap coordinates={routeGeometry.coordinates} />
            </motion.div>
          )}

          {/* Route Details Form */}
           {routeGeometry && (
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit}
              className="mt-6 md:mt-8 space-y-3 md:space-y-4 pt-4 md:pt-6 border-t border-stone-200"
            >
              <h3 className="text-base md:text-lg font-semibold text-stone-800">Routendetails</h3>
              
              <div>
                <Label htmlFor="name">Name der Route *</Label>
                <Input
                  id="name"
                  placeholder="z.B. Meine Lieblingstour zum Pragser Wildsee"
                  value={routeData.name}
                  onChange={(e) => setRouteData({ ...routeData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="start_location">Startpunkt</Label>
                <Input
                  id="start_location"
                  placeholder="z.B. Parkplatz Pragser Wildsee"
                  value={routeData.start_location}
                  onChange={(e) => setRouteData({ ...routeData, start_location: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  placeholder="Beschreibe deine Route..."
                  value={routeData.description}
                  onChange={(e) => setRouteData({ ...routeData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="notes">Notizen</Label>
                <Textarea
                  id="notes"
                  placeholder="Besondere Hinweise, Schwierigkeiten, Sehenswürdigkeiten..."
                  value={routeData.notes}
                  onChange={(e) => setRouteData({ ...routeData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_public"
                  checked={routeData.is_public}
                  onCheckedChange={(checked) => setRouteData({ ...routeData, is_public: checked })}
                />
                <Label htmlFor="is_public">
                  Route öffentlich teilen (andere Nutzer können sie sehen)
                </Label>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 md:p-4">
                <h4 className="text-sm md:text-base font-medium text-stone-800 mb-2">📊 Routenstatistik:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 text-xs md:text-sm">
                  <div>
                    <p className="text-stone-500">Distanz</p>
                    <p className="font-bold text-slate-800">{routeGeometry.distance_km} km</p>
                  </div>
                  {routeGeometry.duration_minutes && (
                    <div>
                      <p className="text-stone-500">Dauer</p>
                      <p className="font-bold text-slate-800">{routeGeometry.duration_minutes} min</p>
                    </div>
                  )}
                  {routeGeometry.avg_speed_kmh && (
                    <div>
                      <p className="text-stone-500">⌀ Geschw.</p>
                      <p className="font-bold text-slate-800">{routeGeometry.avg_speed_kmh} km/h</p>
                    </div>
                  )}
                  <div>
                    <p className="text-stone-500">Wegpunkte</p>
                    <p className="font-bold text-slate-800">{routeGeometry.coordinates.length}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setRouteGeometry(null);
                    setRouteData({
                      name: "",
                      description: "",
                      start_location: "",
                      notes: "",
                      is_public: false,
                    });
                  }}
                  className="w-full sm:w-auto"
                  size="sm"
                >
                  Abbrechen
                </Button>
                <Button
                  type="submit"
                  disabled={createRouteMutation.isPending}
                  className="bg-slate-800 hover:bg-slate-900 flex-1"
                  size="sm"
                >
                  {createRouteMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Route speichern
                </Button>
              </div>
            </motion.form>
          )}
        </motion.div>
      </div>
    </div>
  );
}