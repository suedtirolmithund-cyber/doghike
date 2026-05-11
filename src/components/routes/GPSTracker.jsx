import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Polyline, Marker, useMap } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square, Crosshair, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import RouteElevationProfile from "./RouteElevationProfile";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const myLocationIcon = L.divIcon({
  html: `<div style="
    width: 20px; height: 20px;
    background: #2563eb;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 0 0 4px rgba(37,99,235,0.3), 0 2px 8px rgba(0,0,0,0.3);
  "></div>`,
  className: "",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const MAX_ACCEPTED_ACCURACY_METERS = 25;
const MIN_POINT_DISTANCE_METERS = 2;
const MAX_REASONABLE_SPEED_KMH = 12;
const MIN_ELEVATION_GAIN_STEP_METERS = 3;
const MAX_REASONABLE_ELEVATION_STEP_METERS = 40;
const GPS_TRACK_STORAGE_KEY = "doghike_active_gps_track";
const GPS_TRACK_MAX_AGE_MS = 12 * 60 * 60 * 1000;
const DEFAULT_STATS = { distance: 0, duration: 0, avgSpeed: 0, elevationGain: 0 };

function MapUpdater({ center, flyToRef }) {
  const map = useMap();

  useEffect(() => {
    if (center) map.setView(center, map.getZoom());
  }, [center, map]);

  useEffect(() => {
    if (flyToRef) {
      flyToRef.current = (pos) => map.flyTo(pos ?? center, 16, { duration: 1 });
    }
  }, [center, flyToRef, map]);

  return null;
}

function MapFlyController({ flyRef }) {
  const map = useMap();

  useEffect(() => {
    flyRef.current = (pos, zoom = 15) => map.flyTo(pos, zoom, { duration: 1.2 });
  }, [flyRef, map]);

  return null;
}

function haversineDistance(p1, p2) {
  const R = 6371;
  const dLat = ((p2[0] - p1[0]) * Math.PI) / 180;
  const dLon = ((p2[1] - p1[1]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((p1[0] * Math.PI) / 180) *
      Math.cos((p2[0] * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getInitialRestoreState() {
  if (typeof window === "undefined") {
    return {
      routePoints: [],
      currentPosition: null,
      myLocation: null,
      stats: DEFAULT_STATS,
      elapsedSeconds: 0,
      isTracking: false,
      isPaused: false,
      restoredSnapshot: null,
    };
  }

  try {
    const rawSnapshot = window.localStorage.getItem(GPS_TRACK_STORAGE_KEY);
    if (!rawSnapshot) {
      return {
        routePoints: [],
        currentPosition: null,
        myLocation: null,
        stats: DEFAULT_STATS,
        elapsedSeconds: 0,
        isTracking: false,
        isPaused: false,
        restoredSnapshot: null,
      };
    }

    const snapshot = JSON.parse(rawSnapshot);
    if (!snapshot?.savedAt || Date.now() - snapshot.savedAt > GPS_TRACK_MAX_AGE_MS) {
      window.localStorage.removeItem(GPS_TRACK_STORAGE_KEY);
      return {
        routePoints: [],
        currentPosition: null,
        myLocation: null,
        stats: DEFAULT_STATS,
        elapsedSeconds: 0,
        isTracking: false,
        isPaused: false,
        restoredSnapshot: null,
      };
    }

    return {
      routePoints: snapshot.routePoints ?? [],
      currentPosition: snapshot.currentPosition ?? null,
      myLocation: snapshot.myLocation ?? null,
      stats: snapshot.stats ?? DEFAULT_STATS,
      elapsedSeconds: snapshot.elapsedSeconds ?? 0,
      isTracking: Boolean(snapshot.isTracking),
      isPaused: Boolean(snapshot.isPaused),
      restoredSnapshot: snapshot,
    };
  } catch {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(GPS_TRACK_STORAGE_KEY);
    }
    return {
      routePoints: [],
      currentPosition: null,
      myLocation: null,
      stats: DEFAULT_STATS,
      elapsedSeconds: 0,
      isTracking: false,
      isPaused: false,
      restoredSnapshot: null,
    };
  }
}

export default function GPSTracker({ onSave }) {
  const initialState = useRef(getInitialRestoreState()).current;

  const [isTracking, setIsTracking] = useState(initialState.isTracking);
  const [isPaused, setIsPaused] = useState(initialState.isPaused);
  const [routePoints, setRoutePoints] = useState(initialState.routePoints);
  const [currentPosition, setCurrentPosition] = useState(initialState.currentPosition);
  const [stats, setStats] = useState(initialState.stats);
  const [elapsedSeconds, setElapsedSeconds] = useState(initialState.elapsedSeconds);
  const [myLocation, setMyLocation] = useState(initialState.myLocation);
  const [locating, setLocating] = useState(false);

  const watchIdRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const intervalRef = useRef(null);
  const wakeLockRef = useRef(null);
  const flyToRef = useRef(null);
  const flyControllerRef = useRef(null);
  const visibilityWarningShownRef = useRef(false);

  const isPausedRef = useRef(initialState.isPaused);
  const routePointsRef = useRef(initialState.routePoints);
  const pointSamplesRef = useRef(initialState.restoredSnapshot?.pointSamples ?? []);
  const altitudesRef = useRef(initialState.restoredSnapshot?.altitudes ?? []);
  const startTimeRef = useRef(initialState.restoredSnapshot?.startTime ?? null);
  const pausedTimeRef = useRef(initialState.restoredSnapshot?.pausedTime ?? 0);
  const lastPauseTimeRef = useRef(initialState.restoredSnapshot?.lastPauseTime ?? null);
  const distanceRef = useRef(initialState.restoredSnapshot?.distance ?? initialState.stats.distance ?? 0);
  const elevationGainRef = useRef(initialState.restoredSnapshot?.elevationGain ?? initialState.stats.elevationGain ?? 0);

  const clearPersistedTrackingState = useCallback(() => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(GPS_TRACK_STORAGE_KEY);
  }, []);

  const getTotalPausedMs = useCallback(() => {
    const activePauseMs =
      isPausedRef.current && lastPauseTimeRef.current
        ? Date.now() - lastPauseTimeRef.current
        : 0;

    return pausedTimeRef.current + activePauseMs;
  }, []);

  const persistTrackingState = useCallback(() => {
    if (typeof window === "undefined") return;

    const hasTrackData = routePointsRef.current.length > 0 || isTracking;
    if (!hasTrackData) {
      window.localStorage.removeItem(GPS_TRACK_STORAGE_KEY);
      return;
    }

    const snapshot = {
      savedAt: Date.now(),
      isTracking,
      isPaused: isPausedRef.current,
      routePoints: routePointsRef.current,
      pointSamples: pointSamplesRef.current,
      altitudes: altitudesRef.current,
      currentPosition,
      myLocation,
      startTime: startTimeRef.current,
      pausedTime: pausedTimeRef.current,
      lastPauseTime: lastPauseTimeRef.current,
      distance: distanceRef.current,
      elevationGain: elevationGainRef.current,
      elapsedSeconds,
      stats,
    };

    window.localStorage.setItem(GPS_TRACK_STORAGE_KEY, JSON.stringify(snapshot));
  }, [currentPosition, elapsedSeconds, isTracking, myLocation, stats]);

  const stopWatchers = useCallback(() => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    clearInterval(intervalRef.current);
    intervalRef.current = null;

    clearInterval(pollIntervalRef.current);
    pollIntervalRef.current = null;
  }, []);

  const releaseWakeLock = useCallback(async () => {
    try {
      await wakeLockRef.current?.release?.();
    } catch {}
    wakeLockRef.current = null;
  }, []);

  const requestWakeLock = useCallback(async () => {
    try {
      if (!("wakeLock" in navigator) || !navigator.wakeLock?.request) return;
      wakeLockRef.current = await navigator.wakeLock.request("screen");
      wakeLockRef.current?.addEventListener?.("release", () => {
        wakeLockRef.current = null;
      });
    } catch {}
  }, []);

  const computeStats = useCallback(() => {
    if (!startTimeRef.current) return;

    const now = Date.now();
    const totalElapsedMs = now - startTimeRef.current - getTotalPausedMs();
    const durationMin = Math.floor(totalElapsedMs / 60000);
    const durationSec = Math.floor(totalElapsedMs / 1000);
    const dist = distanceRef.current;
    const avgSpeed = durationMin > 0 ? parseFloat(((dist / durationMin) * 60).toFixed(1)) : 0;

    setElapsedSeconds(durationSec);
    setStats({
      distance: parseFloat(dist.toFixed(2)),
      duration: durationMin,
      avgSpeed,
      elevationGain: elevationGainRef.current,
    });
  }, [getTotalPausedMs]);

  const handlePositionSample = useCallback((position) => {
    if (isPausedRef.current) return;

    const { latitude, longitude, altitude, accuracy } = position.coords;
    if (accuracy && accuracy > MAX_ACCEPTED_ACCURACY_METERS) return;

    const newPoint = [latitude, longitude];
    const prev = routePointsRef.current;
    const sampleTime = position.timestamp || Date.now();

    if (prev.length > 0) {
      const dist = haversineDistance(prev[prev.length - 1], newPoint) * 1000;
      const lastSample = pointSamplesRef.current[pointSamplesRef.current.length - 1];
      const elapsedHours = lastSample
        ? Math.max((sampleTime - lastSample.timestamp) / 3_600_000, 1 / 3600)
        : 0;
      const speedKmh = elapsedHours > 0 ? dist / 1000 / elapsedHours : 0;

      if (dist < MIN_POINT_DISTANCE_METERS) {
        setCurrentPosition(newPoint);
        return;
      }

      if (speedKmh > MAX_REASONABLE_SPEED_KMH) {
        return;
      }

      distanceRef.current += dist / 1000;
    }

    routePointsRef.current = [...prev, newPoint];
    pointSamplesRef.current = [
      ...pointSamplesRef.current,
      { point: newPoint, timestamp: sampleTime, altitude },
    ];
    setRoutePoints(routePointsRef.current);
    setCurrentPosition(newPoint);

    if (altitude !== null && altitude !== undefined) {
      const previousAltitudes = altitudesRef.current;
      if (previousAltitudes.length > 0) {
        const diff = altitude - previousAltitudes[previousAltitudes.length - 1];
        if (
          diff >= MIN_ELEVATION_GAIN_STEP_METERS &&
          diff <= MAX_REASONABLE_ELEVATION_STEP_METERS
        ) {
          elevationGainRef.current += diff;
        }
      }
      altitudesRef.current = [...previousAltitudes, altitude];
    }
  }, []);

  const requestFreshPosition = useCallback(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      handlePositionSample,
      () => {},
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
    );
  }, [handlePositionSample]);

  const startWatchers = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("GPS wird von deinem Browser nicht unterstuetzt.");
      return false;
    }

    stopWatchers();
    requestWakeLock();

    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePositionSample,
      (error) => {
        console.error("GPS error:", error);
        toast.error("Fehler beim Abrufen der GPS-Position. Bitte GPS aktivieren.");
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
    );

    pollIntervalRef.current = setInterval(() => {
      if (isPausedRef.current) return;
      requestFreshPosition();
    }, 2000);

    intervalRef.current = setInterval(computeStats, 1000);
    requestFreshPosition();
    return true;
  }, [computeStats, handlePositionSample, requestFreshPosition, requestWakeLock, stopWatchers]);

  const findMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("GPS wird von deinem Browser nicht unterstuetzt.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = [pos.coords.latitude, pos.coords.longitude];
        setMyLocation(loc);
        setLocating(false);
        const fly = flyControllerRef.current || flyToRef.current;
        if (fly) fly(loc, 15);
      },
      () => {
        setLocating(false);
        toast.error("Standort nicht verfuegbar - GPS aktiviert und Berechtigung erteilt?");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      toast.error("GPS wird von deinem Browser nicht unterstuetzt.");
      return;
    }

    routePointsRef.current = [];
    pointSamplesRef.current = [];
    altitudesRef.current = [];
    distanceRef.current = 0;
    elevationGainRef.current = 0;
    startTimeRef.current = Date.now();
    pausedTimeRef.current = 0;
    lastPauseTimeRef.current = null;
    isPausedRef.current = false;
    visibilityWarningShownRef.current = false;

    setRoutePoints([]);
    setCurrentPosition(null);
    setStats(DEFAULT_STATS);
    setElapsedSeconds(0);

    const trackingStarted = startWatchers();
    if (!trackingStarted) {
      resetTrackingState();
      return;
    }

    setIsTracking(true);
    setIsPaused(false);
  };

  const pauseTracking = () => {
    isPausedRef.current = true;
    setIsPaused(true);
    lastPauseTimeRef.current = Date.now();
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    computeStats();
    releaseWakeLock();
  };

  const resumeTracking = () => {
    isPausedRef.current = false;
    setIsPaused(false);

    if (lastPauseTimeRef.current) {
      pausedTimeRef.current += Date.now() - lastPauseTimeRef.current;
      lastPauseTimeRef.current = null;
    }

    intervalRef.current = setInterval(computeStats, 1000);
    requestWakeLock();
    requestFreshPosition();
  };

  const resetTrackingState = useCallback(() => {
    stopWatchers();
    releaseWakeLock();
    routePointsRef.current = [];
    pointSamplesRef.current = [];
    altitudesRef.current = [];
    distanceRef.current = 0;
    elevationGainRef.current = 0;
    startTimeRef.current = null;
    pausedTimeRef.current = 0;
    lastPauseTimeRef.current = null;
    isPausedRef.current = false;
    visibilityWarningShownRef.current = false;
    setIsTracking(false);
    setIsPaused(false);
    setRoutePoints([]);
    setCurrentPosition(null);
    setStats(DEFAULT_STATS);
    setElapsedSeconds(0);
    clearPersistedTrackingState();
  }, [clearPersistedTrackingState, releaseWakeLock, stopWatchers]);

  const stopTracking = () => {
    stopWatchers();
    releaseWakeLock();

    const points = routePointsRef.current;
    const finalDist = distanceRef.current;
    const finalElev = elevationGainRef.current;
    const totalElapsedMs = startTimeRef.current
      ? Date.now() - startTimeRef.current - getTotalPausedMs()
      : 0;
    const durationMin = Math.floor(totalElapsedMs / 60000);
    const avgSpeed =
      durationMin > 0 ? parseFloat(((finalDist / durationMin) * 60).toFixed(1)) : 0;

    if (points.length >= 2) {
      onSave({
        coordinates: points,
        distance_km: parseFloat(finalDist.toFixed(2)),
        duration_minutes: durationMin,
        avg_speed_kmh: avgSpeed,
        elevation_gain_m: Math.round(finalElev),
      });
      resetTrackingState();
    } else {
      toast.error("Zu wenige GPS-Punkte aufgezeichnet.");
      resetTrackingState();
    }
  };

  useEffect(() => {
    if (initialState.restoredSnapshot?.isTracking) {
      startWatchers();
      toast.info("Deine letzte GPS-Aufzeichnung wurde wiederhergestellt.");
    }
  }, [initialState.restoredSnapshot, startWatchers]);

  useEffect(() => {
    persistTrackingState();
  }, [persistTrackingState]);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        persistTrackingState();

        if (isTracking && !isPaused && !visibilityWarningShownRef.current) {
          visibilityWarningShownRef.current = true;
          toast.warning(
            "Wenn der Browser im Hintergrund gedrosselt wird, kann die Aufzeichnung ungenauer werden.",
          );
        }
        return;
      }

      if (document.visibilityState === "visible" && isTracking && !isPaused) {
        requestWakeLock();
        requestFreshPosition();
      }
    };

    const handlePageHide = () => {
      persistTrackingState();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [isPaused, isTracking, persistTrackingState, requestFreshPosition, requestWakeLock]);

  useEffect(() => {
    return () => {
      stopWatchers();
      releaseWakeLock();
    };
  }, [releaseWakeLock, stopWatchers]);

  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    if (h > 0) {
      return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }

    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="grid grid-cols-4 gap-2">
        {[
          { value: stats.distance.toFixed(2), unit: "km", label: "Distanz" },
          { value: formatTime(elapsedSeconds), unit: "", label: "Zeit" },
          { value: `+${Math.round(stats.elevationGain)}`, unit: "m", label: "Hoehenmeter" },
          { value: stats.avgSpeed.toFixed(1), unit: "km/h", label: "Speed" },
        ].map((item, index) => (
          <motion.div
            key={index}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.05 }}
            className={`rounded-xl p-2 text-center md:p-3 ${
              isTracking && !isPaused ? "border border-brand-200 bg-white" : "border border-brand-100 bg-white"
            }`}
          >
            <p className="text-sm font-bold leading-tight text-slate-900 md:text-xl">
              {item.value}
              <span className="ml-0.5 text-xs font-normal text-slate-500 md:text-sm">
                {item.unit}
              </span>
            </p>
            <p className="mt-0.5 text-[9px] text-slate-400 md:text-xs">{item.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="relative h-[50vw] min-h-64 max-h-72 overflow-hidden rounded-xl border-2 border-brand-100 md:h-80 lg:h-[400px]">
        <MapContainer
          center={currentPosition || myLocation || [46.5, 11.9]}
          zoom={currentPosition || myLocation ? 14 : 10}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap"
          />
          <MapFlyController flyRef={flyControllerRef} />
          {routePoints.length > 1 && (
            <Polyline positions={routePoints} color="#1e293b" weight={5} opacity={0.85} />
          )}
          {currentPosition && (
            <>
              <Marker position={currentPosition} icon={myLocationIcon} />
              <MapUpdater center={currentPosition} flyToRef={flyToRef} />
            </>
          )}
          {!currentPosition && myLocation && (
            <Marker position={myLocation} icon={myLocationIcon} />
          )}
        </MapContainer>

        {isTracking && (
          <div
            className={`absolute left-3 top-3 z-[1000] rounded-full px-3 py-1.5 text-xs font-semibold text-white shadow ${
              isPaused ? "bg-brand-500" : "animate-pulse bg-brand-500"
            }`}
          >
            {isPaused ? "Pausiert" : "Aufzeichnung läuft"}
          </div>
        )}

        {routePoints.length > 0 && (
          <div className="absolute right-3 top-3 z-[1000] rounded-lg border border-brand-100 bg-white/90 px-2 py-1 text-xs font-medium text-slate-700 shadow backdrop-blur-sm">
            {routePoints.length} Punkte
          </div>
        )}

        <button
          onClick={() => {
            if (currentPosition && flyToRef.current) {
              flyToRef.current(currentPosition);
            } else {
              findMyLocation();
            }
          }}
          disabled={locating}
          title="Meinen Standort finden"
          className="absolute bottom-3 right-3 z-[1000] flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-brand-100 bg-white p-3 shadow-md hover:bg-brand-50/70"
        >
          {locating ? (
          <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
          ) : (
          <Crosshair className="h-5 w-5 text-brand-600" />
          )}
        </button>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {!isTracking ? (
          <Button onClick={startTracking} className="w-full bg-brand-400 text-white hover:bg-brand-600 sm:w-auto">
            <Play className="mr-2 h-4 w-4" />
            Aufzeichnung starten
          </Button>
        ) : (
          <>
            {!isPaused ? (
              <Button
                onClick={pauseTracking}
                variant="outline"
                className="flex-1 border-brand-200 text-brand-600 hover:bg-brand-50 sm:flex-none"
              >
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </Button>
            ) : (
              <Button onClick={resumeTracking} className="flex-1 bg-brand-400 hover:bg-brand-600 sm:flex-none">
                <Play className="mr-2 h-4 w-4" />
                Weiter
              </Button>
            )}
            <Button onClick={stopTracking} className="flex-1 bg-brand-400 hover:bg-brand-500 sm:flex-none">
              <Square className="mr-2 h-4 w-4" />
              Beenden & Speichern
            </Button>
          </>
        )}
      </div>

      {!isTracking && routePoints.length === 0 && (
        <div className="doghike-soft-panel p-3 text-xs text-brand-800 md:p-4 md:text-sm">
          <p className="mb-2 font-medium">GPS-Aufzeichnung:</p>
          <ul className="list-disc space-y-1 pl-4">
            <li>Aktiviere GPS auf deinem Gerät.</li>
            <li>Erlaube dem Browser den Standortzugriff.</li>
            <li>Der tatsächliche Weg wird aufgezeichnet und laufend lokal gesichert.</li>
            <li>Mit Pause kannst du unterbrechen und später weiter aufnehmen.</li>
          </ul>
        </div>
      )}

      {isTracking && (
        <div className="rounded-lg border border-brand-100 bg-brand-50 p-3 text-xs text-brand-700 md:text-sm">
          <p className="mb-1 font-medium">Bestmöglich für die Web-Version:</p>
          <ul className="list-disc space-y-1 pl-4">
            <li>Lass die App möglichst geöffnet oder den Bildschirm aktiv.</li>
            <li>Die laufende Aufzeichnung wird lokal zwischengespeichert und nach Unterbrechungen wiederhergestellt.</li>
            <li>Bei gesperrtem Handy kann der Browser GPS trotzdem drosseln, dadurch können Punkte ungenauer werden.</li>
          </ul>
        </div>
      )}

      {routePoints.length >= 2 && (
        <div className="mt-2">
          <RouteElevationProfile coordinates={routePoints} distance={stats.distance} />
        </div>
      )}
    </div>
  );
}
