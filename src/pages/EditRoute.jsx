import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { getRoute, updateRoute } from "@/lib/routesApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Map, Loader2 } from "lucide-react";
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
import EditableRouteDrawer from "@/components/routes/EditableRouteDrawer";
import RoutePreviewMap from "@/components/routes/RoutePreviewMap";
import BackButton from "@/components/ui/BackButton";
import { EmptyState, PageLoadingState } from "@/components/ui/AppState";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { formatDurationHours } from "@/lib/duration";

function getRouteDraftKey(routeId) {
  if (!routeId) return null;
  return `dogtrails:edit-route-draft:${routeId}`;
}

function buildInitialRouteDraft(route) {
  if (!route) return null;

  return {
    routeData: {
      name: route.name ?? "",
      description: route.description ?? "",
      start_location: route.start_location ?? "",
      notes: route.notes ?? "",
    },
    routeGeometry: {
      coordinates: Array.isArray(route.waypoints) ? route.waypoints : [],
      distance_km: route.distance_km ?? 0,
      duration_minutes: route.duration_minutes ?? null,
      elevation_gain_m: route.elevation_gain_m ?? null,
    },
  };
}

function normalizeRouteDraft(rawDraft) {
  if (!rawDraft || typeof rawDraft !== "object") return null;

  return {
    routeData: {
      name: rawDraft.routeData?.name ?? "",
      description: rawDraft.routeData?.description ?? "",
      start_location: rawDraft.routeData?.start_location ?? "",
      notes: rawDraft.routeData?.notes ?? "",
    },
    routeGeometry: {
      coordinates: Array.isArray(rawDraft.routeGeometry?.coordinates) ? rawDraft.routeGeometry.coordinates : [],
      distance_km: rawDraft.routeGeometry?.distance_km ?? 0,
      duration_minutes: rawDraft.routeGeometry?.duration_minutes ?? null,
      elevation_gain_m: rawDraft.routeGeometry?.elevation_gain_m ?? null,
    },
  };
}

function persistRouteDraft(draftKey, draftState) {
  if (!draftKey || !draftState || typeof window === "undefined") return;
  window.sessionStorage.setItem(draftKey, JSON.stringify(draftState));
}

export default function EditRoute() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const routeId = searchParams.get("id");
  const { user } = useAuth();

  const [routeData, setRouteData] = useState(null);
  const [routeGeometry, setRouteGeometry] = useState(null);
  const [editingMap, setEditingMap] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  const currentDraftRef = useRef(null);
  const saveInFlightRef = useRef(false);
  const draftKey = getRouteDraftKey(routeId);
  const detailPageUrl = `${createPageUrl("RouteDetail")}?id=${routeId}`;
  const profilePageUrl = createPageUrl("Profile");

  const { data: route, isLoading } = useQuery({
    queryKey: ["route", routeId],
    queryFn: () => getRoute(routeId),
    enabled: !!routeId,
  });

  const initialDraft = useMemo(() => buildInitialRouteDraft(route), [route]);

  const currentDraft = useMemo(() => {
    if (!routeData || !routeGeometry) return null;
    return { routeData, routeGeometry };
  }, [routeData, routeGeometry]);

  const hasUnsavedChanges = useMemo(() => {
    if (!initialDraft || !currentDraft) return false;
    return JSON.stringify(currentDraft) !== JSON.stringify(initialDraft);
  }, [currentDraft, initialDraft]);

  useEffect(() => {
    if (!route || routeData || routeGeometry) return;

    let nextDraft = buildInitialRouteDraft(route);

    if (draftKey && typeof window !== "undefined") {
      try {
        const rawDraft = window.sessionStorage.getItem(draftKey);
        const normalizedDraft = rawDraft ? normalizeRouteDraft(JSON.parse(rawDraft)) : null;
        if (normalizedDraft) {
          nextDraft = normalizedDraft;
        }
      } catch (error) {
        console.error("[EditRoute] restore draft failed:", error);
      }
    }

    if (nextDraft) {
      setRouteData(nextDraft.routeData);
      setRouteGeometry(nextDraft.routeGeometry);
    }
  }, [draftKey, route, routeData, routeGeometry]);

  useEffect(() => {
    currentDraftRef.current = currentDraft;
  }, [currentDraft]);

  useEffect(() => {
    if (!draftKey || !currentDraft || typeof window === "undefined") return;

    try {
      persistRouteDraft(draftKey, currentDraft);
    } catch (error) {
      console.error("[EditRoute] persist draft failed:", error);
    }
  }, [currentDraft, draftKey]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleBeforeUnload = (event) => {
      if (!hasUnsavedChanges || saveInFlightRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!draftKey || typeof window === "undefined") return undefined;

    const persistCurrentDraft = () => {
      try {
        persistRouteDraft(draftKey, currentDraftRef.current);
      } catch (error) {
        console.error("[EditRoute] persist draft on hide failed:", error);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        persistCurrentDraft();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", persistCurrentDraft);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", persistCurrentDraft);
    };
  }, [draftKey]);

  const updateMutation = useMutation({
    mutationFn: (data) => updateRoute(routeId, data),
    onSuccess: () => {
      saveInFlightRef.current = false;
      if (draftKey && typeof window !== "undefined") {
        window.sessionStorage.removeItem(draftKey);
      }
      queryClient.invalidateQueries({ queryKey: ["userRoutes", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["route", routeId] });
      toast.success("Deine Route ist wieder rund.");
      navigate(detailPageUrl);
    },
    onError: () => {
      saveInFlightRef.current = false;
      toast.error("Die Route wollte gerade nicht speichern.");
    },
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!routeData?.name) {
      toast.error("Der Route fehlt noch ein Name.");
      return;
    }

    saveInFlightRef.current = true;

    await updateMutation.mutateAsync({
      name: routeData.name,
      description: routeData.description,
      start_location: routeData.start_location,
      notes: routeData.notes,
      is_public: false,
      waypoints: routeGeometry.coordinates,
      distance_km: routeGeometry.distance_km,
      duration_minutes: routeGeometry.duration_minutes ?? null,
      elevation_gain_m: routeGeometry.elevation_gain_m ?? null,
    });
  };

  const handleLeaveRequest = () => {
    if (hasUnsavedChanges) {
      setShowLeaveDialog(true);
      return;
    }

    navigate(detailPageUrl);
  };

  const confirmLeave = () => {
    setShowLeaveDialog(false);
    navigate(detailPageUrl);
  };

  if (isLoading) {
    return <PageLoadingState message="Deine Route lädt..." />;
  }

  if (!route || !routeData) {
    return (
      <div className="doghike-page-shell flex items-center justify-center px-4 py-12">
        <EmptyState
          icon={Map}
          title="Route nicht gefunden"
          description="Diese Route gibt es nicht mehr oder du hast keinen Zugriff."
          action={<BackButton to={profilePageUrl} variant="default" />}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50/20 pb-24 md:pb-8">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8">
        <BackButton onClick={handleLeaveRequest} className="mb-3 md:mb-4" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="doghike-glass-card p-4 md:p-8"
        >
          <div className="flex items-start gap-3 mb-6">
            <Map className="w-6 h-6 text-brand-700 flex-shrink-0 mt-1" />
            <div>
              <h1 className="doghike-page-title">Route bearbeiten</h1>
              <p className="doghike-page-subtitle">Ändere den Streckenverlauf oder die Details</p>
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
              <div className="doghike-map-frame mb-3">
                <RoutePreviewMap coordinates={routeGeometry?.coordinates ?? []} />
              </div>
              {route?.route_type === "planned" && (
                <Button variant="outline" size="sm" onClick={() => setEditingMap(true)}>
                  <Map className="w-4 h-4 mr-2" /> Streckenverlauf ändern
                </Button>
              )}
            </div>
          )}

          {routeGeometry && (
            <div className="doghike-soft-panel p-3 mb-6 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs md:text-sm">
              <div>
                <p className="text-slate-500">Distanz</p>
                <p className="font-bold text-slate-900">{routeGeometry.distance_km} km</p>
              </div>
              {routeGeometry.duration_minutes && (
                <div>
                  <p className="text-slate-500">Dauer</p>
                  <p className="font-bold text-slate-900">{formatDurationHours(routeGeometry.duration_minutes)}</p>
                </div>
              )}
              {routeGeometry.elevation_gain_m && (
                <div>
                  <p className="text-slate-500">Aufstieg</p>
                  <p className="font-bold text-slate-900">+{routeGeometry.elevation_gain_m} m</p>
                </div>
              )}
              <div>
                <p className="text-slate-500">Wegpunkte</p>
                <p className="font-bold text-slate-900">{routeGeometry.coordinates?.length ?? 0}</p>
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
              <Button type="button" variant="outline" size="sm" onClick={handleLeaveRequest}>
                Abbrechen
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="bg-brand-400 hover:bg-brand-600 flex-1"
                size="sm"
              >
                {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Änderungen speichern
              </Button>
            </div>
          </form>
        </motion.div>

        <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Änderungen verwerfen?</AlertDialogTitle>
              <AlertDialogDescription>
                Deine Änderungen an dieser Route sind noch nicht gespeichert und würden beim Verlassen verloren gehen.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Weiter bearbeiten</AlertDialogCancel>
              <AlertDialogAction onClick={confirmLeave} className="bg-brand-400 hover:bg-brand-500">
                Trotzdem verlassen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
