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
  className: '',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function MapUpdater({ center, flyToRef }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom());
  }, [center, map]);
  useEffect(() => {
    if (flyToRef) flyToRef.current = (pos) => map.flyTo(pos ?? center, 16, { duration: 1 });
  }, [map, center, flyToRef]);
  return null;
}

// Fly to a position without requiring an active track
function MapFlyController({ flyRef }) {
  const map = useMap();
  useEffect(() => {
    flyRef.current = (pos, zoom = 15) => map.flyTo(pos, zoom, { duration: 1.2 });
  }, [map, flyRef]);
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

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

const MAX_ACCEPTED_ACCURACY_METERS = 25;
const MIN_POINT_DISTANCE_METERS = 2;
const MAX_REASONABLE_SPEED_KMH = 12;
const MIN_ELEVATION_GAIN_STEP_METERS = 3;
const MAX_REASONABLE_ELEVATION_STEP_METERS = 40;

export default function GPSTracker({ onSave }) {
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [routePoints, setRoutePoints] = useState([]); // [lat, lon]
  const [currentPosition, setCurrentPosition] = useState(null);
  const [stats, setStats] = useState({ distance: 0, duration: 0, avgSpeed: 0, elevationGain: 0 });
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [myLocation, setMyLocation] = useState(null);
  const [locating, setLocating] = useState(false);

  const watchIdRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const isPausedRef = useRef(false);
  const routePointsRef = useRef([]);
  const pointSamplesRef = useRef([]);
  const altitudesRef = useRef([]); // track altitudes for elevation gain
  const startTimeRef = useRef(null);
  const pausedTimeRef = useRef(0);
  const lastPauseTimeRef = useRef(null);
  const intervalRef = useRef(null);
  const flyToRef = useRef(null);
  const flyControllerRef = useRef(null);
  const distanceRef = useRef(0);
  const elevationGainRef = useRef(0);
  const wakeLockRef = useRef(null);

  const findMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("GPS wird von deinem Browser nicht unterstützt.");
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
        toast.error("Standort nicht verfügbar – GPS aktiviert und Berechtigung erteilt?");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const computeStats = useCallback(() => {
    const now = Date.now();
    const totalElapsedMs = now - startTimeRef.current - pausedTimeRef.current;
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
  }, []);

  const handlePositionSample = useCallback((position) => {
    if (isPausedRef.current) return;

    const { latitude, longitude, altitude, accuracy } = position.coords;
    if (accuracy && accuracy > MAX_ACCEPTED_ACCURACY_METERS) return;

    const newPoint = [latitude, longitude];
    const prev = routePointsRef.current;
    const sampleTime = position.timestamp || Date.now();

    // Minimum distance filter and spike protection so the track follows the
    // real path instead of jumps caused by noisy GPS fixes.
    if (prev.length > 0) {
      const dist = haversineDistance(prev[prev.length - 1], newPoint) * 1000;
      const lastSample = pointSamplesRef.current[pointSamplesRef.current.length - 1];
      const elapsedHours = lastSample ? Math.max((sampleTime - lastSample.timestamp) / 3_600_000, 1 / 3600) : 0;
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
    pointSamplesRef.current = [...pointSamplesRef.current, { point: newPoint, timestamp: sampleTime, altitude }];
    setRoutePoints([...routePointsRef.current]);
    setCurrentPosition(newPoint);

    // Elevation gain
    if (altitude !== null && altitude !== undefined) {
      const alts = altitudesRef.current;
      if (alts.length > 0) {
        const diff = altitude - alts[alts.length - 1];
        if (diff >= MIN_ELEVATION_GAIN_STEP_METERS && diff <= MAX_REASONABLE_ELEVATION_STEP_METERS) {
          elevationGainRef.current += diff;
        }
      }
      altitudesRef.current = [...alts, altitude];
    }
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

  const startTracking = () => {
    if (!navigator.geolocation) {
      toast.error("GPS wird von deinem Browser nicht unterstützt.");
      return;
    }

    routePointsRef.current = [];
    pointSamplesRef.current = [];
    altitudesRef.current = [];
    distanceRef.current = 0;
    elevationGainRef.current = 0;
    isPausedRef.current = false;
    setRoutePoints([]);
    setStats({ distance: 0, duration: 0, avgSpeed: 0, elevationGain: 0 });
    setElapsedSeconds(0);
    setIsTracking(true);
    setIsPaused(false);
    startTimeRef.current = Date.now();
    pausedTimeRef.current = 0;
    requestWakeLock();

    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePositionSample,
      (error) => {
        console.error("GPS error:", error);
        toast.error("Fehler beim Abrufen der GPS-Position. Bitte GPS aktivieren.");
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );

    // Supplement watchPosition with an explicit GPS poll so mobile browsers
    // produce denser tracks instead of long straight segments.
    pollIntervalRef.current = setInterval(() => {
      if (isPausedRef.current) return;

      navigator.geolocation.getCurrentPosition(
        handlePositionSample,
        () => {},
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
      );
    }, 2000);

    intervalRef.current = setInterval(computeStats, 1000);
  };

  const pauseTracking = () => {
    isPausedRef.current = true;
    setIsPaused(true);
    lastPauseTimeRef.current = Date.now();
    clearInterval(intervalRef.current);
    computeStats();
    releaseWakeLock();
  };

  const resumeTracking = () => {
    isPausedRef.current = false;
    setIsPaused(false);
    if (lastPauseTimeRef.current) {
      pausedTimeRef.current += Date.now() - lastPauseTimeRef.current;
    }
    intervalRef.current = setInterval(computeStats, 1000);
    requestWakeLock();
  };

  const stopTracking = () => {
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    clearInterval(intervalRef.current);
    clearInterval(pollIntervalRef.current);
    releaseWakeLock();

    const points = routePointsRef.current;
    const finalDist = distanceRef.current;
    const finalElev = elevationGainRef.current;
    const totalElapsedMs = Date.now() - startTimeRef.current - pausedTimeRef.current;
    const durationMin = Math.floor(totalElapsedMs / 60000);
    const avgSpeed = durationMin > 0 ? parseFloat(((finalDist / durationMin) * 60).toFixed(1)) : 0;

    setIsTracking(false);
    setIsPaused(false);
    isPausedRef.current = false;

    if (points.length >= 2) {
      onSave({
        coordinates: points,
        distance_km: parseFloat(finalDist.toFixed(2)),
        duration_minutes: durationMin,
        avg_speed_kmh: avgSpeed,
        elevation_gain_m: Math.round(finalElev),
      });
    } else {
      toast.error("Zu wenige GPS-Punkte aufgezeichnet.");
    }
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      clearInterval(intervalRef.current);
      clearInterval(pollIntervalRef.current);
      releaseWakeLock();
    };
  }, [releaseWakeLock]);

  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Live Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { value: stats.distance.toFixed(2), unit: "km", label: "Distanz" },
          { value: formatTime(elapsedSeconds), unit: "", label: "Zeit" },
          { value: `+${Math.round(stats.elevationGain)}`, unit: "m", label: "Höhenmeter" },
          { value: stats.avgSpeed.toFixed(1), unit: "km/h", label: "⌀ Speed" },
        ].map((s, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className={`rounded-xl p-2 md:p-3 border text-center ${
              isTracking && !isPaused ? "bg-white border-green-300" : "bg-white border-stone-200"
            }`}
          >
            <p className="text-sm md:text-xl font-bold text-slate-800 leading-tight">{s.value}<span className="text-xs md:text-sm font-normal text-stone-500 ml-0.5">{s.unit}</span></p>
            <p className="text-[9px] md:text-xs text-stone-400 mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Map */}
      <div className="relative h-[50vw] min-h-64 max-h-72 md:h-80 lg:h-[400px] rounded-xl overflow-hidden border-2 border-stone-200">
        <MapContainer
          center={currentPosition || myLocation || [46.5, 11.9]}
          zoom={currentPosition || myLocation ? 14 : 10}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
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
          {/* Standort-Marker vor Aufzeichnungsstart */}
          {!currentPosition && myLocation && (
            <Marker position={myLocation} icon={myLocationIcon} />
          )}
        </MapContainer>

        {isTracking && (
          <div className={`absolute top-3 left-3 z-[1000] px-3 py-1.5 rounded-full text-xs font-semibold shadow ${
            isPaused ? "bg-amber-500 text-white" : "bg-red-500 text-white animate-pulse"
          }`}>
            {isPaused ? "⏸ Pausiert" : "● Aufzeichnung läuft"}
          </div>
        )}
        {routePoints.length > 0 && (
          <div className="absolute top-3 right-3 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 text-xs font-medium text-stone-700 shadow border border-stone-200">
            {routePoints.length} Punkte
          </div>
        )}
        <button
          onClick={() => {
            if (currentPosition && flyToRef.current) flyToRef.current(currentPosition);
            else findMyLocation();
          }}
          disabled={locating}
          title="Meinen Standort finden"
          className="absolute bottom-3 right-3 z-[1000] bg-white rounded-xl shadow-md p-3 border border-stone-200 hover:bg-stone-50 min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          {locating
            ? <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            : <Crosshair className="w-5 h-5 text-blue-600" />
          }
        </button>
      </div>

      {/* Controls */}
      <div className="flex gap-2 justify-center flex-wrap">
        {!isTracking ? (
          <Button onClick={startTracking} className="bg-brand-400 hover:bg-brand-600 text-white w-full sm:w-auto">
            <Play className="w-4 h-4 mr-2" />
            Aufzeichnung starten
          </Button>
        ) : (
          <>
            {!isPaused ? (
              <Button onClick={pauseTracking} variant="outline" className="flex-1 sm:flex-none border-amber-400 text-amber-700 hover:bg-amber-50">
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
            ) : (
              <Button onClick={resumeTracking} className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none">
                <Play className="w-4 h-4 mr-2" />
                Weiter
              </Button>
            )}
            <Button onClick={stopTracking} className="bg-red-600 hover:bg-red-700 flex-1 sm:flex-none">
              <Square className="w-4 h-4 mr-2" />
              Beenden & Speichern
            </Button>
          </>
        )}
      </div>

      {!isTracking && routePoints.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4 text-xs md:text-sm text-blue-800">
          <p className="font-medium mb-2">📱 GPS-Aufzeichnung:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Aktiviere GPS auf deinem Gerät</li>
            <li>Erlaube dem Browser den Standortzugriff</li>
            <li>Der tatsächliche Weg wird aufgezeichnet (kein Luftlinienweg)</li>
            <li>Mit <strong>Pause</strong> kannst du die Aufzeichnung unterbrechen und <strong>Weiter</strong> fortsetzen</li>
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
