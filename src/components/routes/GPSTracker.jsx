import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Polyline, Marker, useMap } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square, Navigation } from "lucide-react";
import { motion } from "framer-motion";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function MapUpdater({ center }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  
  return null;
}

export default function GPSTracker({ onSave }) {
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [routePoints, setRoutePoints] = useState([]);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [stats, setStats] = useState({
    distance: 0,
    duration: 0,
    avgSpeed: 0,
  });
  
  const watchIdRef = useRef(null);
  const startTimeRef = useRef(null);
  const pausedTimeRef = useRef(0);
  const lastPauseTimeRef = useRef(null);
  const intervalRef = useRef(null);

  const calculateDistance = (points) => {
    if (points.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const [lat1, lon1] = points[i];
      const [lat2, lon2] = points[i + 1];
      
      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      totalDistance += R * c;
    }
    
    return totalDistance;
  };

  const updateStats = () => {
    if (!startTimeRef.current || isPaused) return;
    
    const now = Date.now();
    const totalElapsed = now - startTimeRef.current - pausedTimeRef.current;
    const durationMinutes = totalElapsed / 60000;
    const distance = calculateDistance(routePoints);
    const avgSpeed = durationMinutes > 0 ? (distance / durationMinutes) * 60 : 0;
    
    setStats({
      distance: parseFloat(distance.toFixed(2)),
      duration: Math.floor(durationMinutes),
      avgSpeed: parseFloat(avgSpeed.toFixed(1)),
    });
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      alert("GPS wird von deinem Browser nicht unterstützt");
      return;
    }

    setIsTracking(true);
    setIsPaused(false);
    startTimeRef.current = Date.now();
    pausedTimeRef.current = 0;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newPoint = [latitude, longitude];
        
        setCurrentPosition(newPoint);
        setRoutePoints((prev) => [...prev, newPoint]);
      },
      (error) => {
        console.error("GPS error:", error);
        alert("Fehler beim Abrufen der GPS-Position");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      }
    );

    intervalRef.current = setInterval(updateStats, 1000);
  };

  const pauseTracking = () => {
    setIsPaused(true);
    lastPauseTimeRef.current = Date.now();
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const resumeTracking = () => {
    setIsPaused(false);
    if (lastPauseTimeRef.current) {
      pausedTimeRef.current += Date.now() - lastPauseTimeRef.current;
    }
    intervalRef.current = setInterval(updateStats, 1000);
  };

  const stopTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    updateStats();
    
    if (routePoints.length >= 2) {
      onSave({
        coordinates: routePoints,
        distance_km: stats.distance,
        duration_minutes: stats.duration,
        avg_speed_kmh: stats.avgSpeed,
      });
    }
    
    setIsTracking(false);
    setIsPaused(false);
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-xl p-4 border border-stone-200 text-center"
        >
          <p className="text-2xl font-bold text-slate-800">{stats.distance}</p>
          <p className="text-xs text-stone-500">Kilometer</p>
        </motion.div>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-4 border border-stone-200 text-center"
        >
          <p className="text-2xl font-bold text-slate-800">{stats.duration}</p>
          <p className="text-xs text-stone-500">Minuten</p>
        </motion.div>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-4 border border-stone-200 text-center"
        >
          <p className="text-2xl font-bold text-slate-800">{stats.avgSpeed}</p>
          <p className="text-xs text-stone-500">km/h ⌀</p>
        </motion.div>
      </div>

      {/* Map */}
      <div className="relative h-96 md:h-[400px] rounded-xl overflow-hidden border-2 border-stone-200">
        <MapContainer
          center={currentPosition || [46.5, 11.9]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
          />
          {routePoints.length > 1 && (
            <Polyline positions={routePoints} color="#1e293b" weight={4} />
          )}
          {currentPosition && (
            <>
              <Marker position={currentPosition} />
              <MapUpdater center={currentPosition} />
            </>
          )}
        </MapContainer>

        {isTracking && (
          <div className="absolute top-4 left-4 z-[1000] bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse">
            ● Aufzeichnung läuft
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-2 justify-center">
        {!isTracking ? (
          <Button
            onClick={startTracking}
            className="bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            <Play className="w-5 h-5 mr-2" />
            Aufzeichnung starten
          </Button>
        ) : (
          <>
            {!isPaused ? (
              <Button
                onClick={pauseTracking}
                variant="outline"
                size="lg"
              >
                <Pause className="w-5 h-5 mr-2" />
                Pausieren
              </Button>
            ) : (
              <Button
                onClick={resumeTracking}
                className="bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Fortsetzen
              </Button>
            )}
            <Button
              onClick={stopTracking}
              className="bg-red-600 hover:bg-red-700"
              size="lg"
            >
              <Square className="w-5 h-5 mr-2" />
              Beenden
            </Button>
          </>
        )}
      </div>

      {!isTracking && routePoints.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <p className="font-medium mb-2">📱 GPS-Aufzeichnung:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Aktiviere GPS auf deinem Gerät</li>
            <li>Erlaube dem Browser den Standortzugriff</li>
            <li>Starte die Aufzeichnung vor Beginn der Wanderung</li>
          </ul>
        </div>
      )}
    </div>
  );
}