import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Polyline, Marker, useMap } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square, Navigation, Crosshair } from "lucide-react";
import { motion } from "framer-motion";
import RouteElevationProfile from "./RouteElevationProfile";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet default marker icon
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
    <div className="space-y-3 md:space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-xl p-2 md:p-4 border border-stone-200 text-center"
        >
          <p className="text-lg md:text-2xl font-bold text-slate-800">{stats.distance}</p>
          <p className="text-[10px] md:text-xs text-stone-500">Kilometer</p>
        </motion.div>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-2 md:p-4 border border-stone-200 text-center"
        >
          <p className="text-lg md:text-2xl font-bold text-slate-800">{stats.duration}</p>
          <p className="text-[10px] md:text-xs text-stone-500">Minuten</p>
        </motion.div>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-2 md:p-4 border border-stone-200 text-center"
        >
          <p className="text-lg md:text-2xl font-bold text-slate-800">{stats.avgSpeed}</p>
          <p className="text-[10px] md:text-xs text-stone-500">km/h ⌀</p>
        </motion.div>
      </div>

      {/* Map */}
      <div className="relative h-64 md:h-80 lg:h-[400px] rounded-xl overflow-hidden border-2 border-stone-200">
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
              <Marker position={currentPosition} icon={myLocationIcon} />
              <MapUpdater center={currentPosition} />
            </>
          )}
        </MapContainer>

        {isTracking && (
          <div className="absolute top-3 left-3 md:top-4 md:left-4 z-[1000] bg-red-500 text-white px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium animate-pulse">
            ● Aufzeichnung läuft
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-2 justify-center flex-wrap">
        {!isTracking ? (
          <Button
            onClick={startTracking}
            className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
            size="default"
          >
            <Play className="w-4 h-4 md:w-5 md:h-5 mr-2" />
            Aufzeichnung starten
          </Button>
        ) : (
          <>
            {!isPaused ? (
              <Button
                onClick={pauseTracking}
                variant="outline"
                size="default"
                className="flex-1 sm:flex-none"
              >
                <Pause className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Pausieren
              </Button>
            ) : (
              <Button
                onClick={resumeTracking}
                className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none"
                size="default"
              >
                <Play className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Fortsetzen
              </Button>
            )}
            <Button
              onClick={stopTracking}
              className="bg-red-600 hover:bg-red-700 flex-1 sm:flex-none"
              size="default"
            >
              <Square className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              Beenden
            </Button>
          </>
        )}
      </div>

      {!isTracking && routePoints.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4 text-xs md:text-sm text-blue-800">
          <p className="font-medium mb-2">📱 GPS-Aufzeichnung:</p>
          <ul className="list-disc pl-4 md:pl-5 space-y-1">
            <li>Aktiviere GPS auf deinem Gerät</li>
            <li>Erlaube dem Browser den Standortzugriff</li>
            <li>Starte die Aufzeichnung vor Beginn der Wanderung</li>
          </ul>
        </div>
      )}

      {/* Elevation Profile Preview */}
      {routePoints.length >= 2 && (
        <div className="mt-4">
          <RouteElevationProfile coordinates={routePoints} distance={stats.distance} />
        </div>
      )}
    </div>
  );
}