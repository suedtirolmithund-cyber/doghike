import { useState, useCallback, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { createRoute } from "@/lib/routesApi";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MapContainer, TileLayer, Polyline, Marker, useMapEvents, useMap, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, Map, Navigation, Loader2, Upload, Search, RotateCcw, Layers, Mountain, Clock, Ruler, TrendingUp, X
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import GPSTracker from "@/components/routes/GPSTracker";
import GPXUploader from "@/components/routes/GPXUploader";
import { toast } from "sonner";

// ── Leaflet fix ───────────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const waypointIcon = (label, isStart, isEnd) => L.divIcon({
  html: `<div style="
    background: ${isStart ? '#16a34a' : isEnd ? '#dc2626' : '#1e293b'};
    color: white; width: 28px; height: 28px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: bold; border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
    ${isStart ? 'S' : isEnd ? 'Z' : label}
  </div>`,
  className: "", iconSize: [28, 28], iconAnchor: [14, 14],
});

// ── Tile layers ───────────────────────────────────────────────
const TILES = {
  standard: {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    label: "Standard",
  },
  topo: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
    label: "Topo",
  },
};

// ── Haversine distance ────────────────────────────────────────
function haversine(a, b) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

// ── BRouter routing (hiking-mountain | trekking) ──────────────
async function calcBrouterRoute(waypoints, profile = "hiking-mountain") {
  const lonlats = waypoints.map((w) => `${w.lng},${w.lat}`).join("|");
  const res = await fetch(
    `https://brouter.de/brouter?lonlats=${lonlats}&profile=${profile}&alternativeidx=0&format=geojson`,
    { signal: AbortSignal.timeout(15000) }
  );
  if (!res.ok) throw new Error(`BRouter ${res.status}`);
  const data = await res.json();
  if (data.type === "FeatureCollection" && data.features?.length === 0)
    throw new Error("Keine Route gefunden");
  const feature = data.features?.[0];
  if (!feature) throw new Error("Keine Route gefunden");

  const coords = feature.geometry.coordinates; // [lon, lat, ele]
  const positions = coords.map(([lng, lat]) => [lat, lng]);

  const props = feature.properties || {};
  const distKm = props["track-length"]
    ? +(props["track-length"] / 1000).toFixed(2)
    : +coords.reduce((sum, c, i) => {
        if (i === 0) return 0;
        return sum + haversine([coords[i - 1][1], coords[i - 1][0]], [c[1], c[0]]);
      }, 0).toFixed(2);

  const ascend = props["filtered ascend"] != null ? Math.round(props["filtered ascend"]) : null;
  const duration = Math.round((distKm / 3.5) * 60 + (ascend || 0) / 400 * 60);

  const step = Math.max(1, Math.floor(coords.length / 80));
  let cumDist = 0;
  const sampled = coords.filter((_, i) => i % step === 0 || i === coords.length - 1);
  const elevationProfile = sampled.map((c, i) => {
    if (i > 0) {
      const p = sampled[i - 1];
      cumDist += haversine([p[1], p[0]], [c[1], c[0]]) * 1000;
    }
    return { dist: +(cumDist / 1000).toFixed(3), ele: Math.round(c[2] ?? 0) };
  });

  return { positions, distance_km: distKm, duration_minutes: duration, elevationProfile, elevation_gain_m: ascend };
}

// ── GraphHopper fallback ───────────────────────────────────────
const GH_API_KEY = import.meta.env.VITE_GRAPHHOPPER_KEY || "LijBPDQGfu7Imiq1X1Jw83a5787IYJB2mEQhHe8A7";
async function calcGraphHopperRoute(waypoints, profile = "hike") {
  const points = waypoints.map((w) => [w.lng, w.lat]);
  const res = await fetch(
    `https://graphhopper.com/api/1/route?key=${GH_API_KEY}&profile=${profile}&points_encoded=false&elevation=true`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ points }) }
  );
  if (!res.ok) throw new Error(`GraphHopper ${res.status}`);
  const data = await res.json();
  if (!data.paths?.length) throw new Error("Keine Route gefunden");
  const path = data.paths[0];
  const coords = path.points.coordinates;
  const positions = coords.map(([lng, lat]) => [lat, lng]);
  const step = Math.max(1, Math.floor(coords.length / 60));
  let cumDist = 0;
  const sampled = coords.filter((_, i) => i % step === 0 || i === coords.length - 1);
  const elevationProfile = sampled.map((c, i) => {
    if (i > 0) { const p = sampled[i - 1]; cumDist += haversine([p[1], p[0]], [c[1], c[0]]) * 1000; }
    return { dist: +(cumDist / 1000).toFixed(3), ele: Math.round(c[2] ?? 0) };
  });
  return {
    positions,
    distance_km: +(path.distance / 1000).toFixed(2),
    duration_minutes: Math.round(path.time / 60000),
    elevationProfile,
    elevation_gain_m: path.ascend ? Math.round(path.ascend) : null,
  };
}

// ── Route berechnen: BRouter primary, GH fallback ─────────────
async function calcRoute(waypoints, mode = "hike") {
  const brouterProfile = mode === "foot" ? "trekking" : "hiking-mountain";
  try {
    return await calcBrouterRoute(waypoints, brouterProfile);
  } catch (err) {
    console.warn("BRouter fehlgeschlagen, fallback auf GraphHopper:", err.message);
    try {
      return await calcGraphHopperRoute(waypoints, mode === "foot" ? "foot" : "hike");
    } catch (err2) {
      console.warn("GraphHopper fehlgeschlagen:", err2.message);
      throw err2;
    }
  }
}


function calcElevationGain(profile) {
  let gain = 0, loss = 0;
  for (let i = 1; i < profile.length; i++) {
    const diff = profile[i].ele - profile[i - 1].ele;
    if (diff > 0) gain += diff;
    else loss += Math.abs(diff);
  }
  return { gain: Math.round(gain), loss: Math.round(loss) };
}

// ── Map click handler ─────────────────────────────────────────
function MapClickHandler({ onMapClick, cursor }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng) });
  return null;
}

function MapFlyTo({ center, zoom }) {
  const map = useMap();
  useEffect(() => { if (center) map.flyTo(center, zoom, { duration: 0.8 }); }, [center, zoom]);
  return null;
}

// ── Elevation Chart ───────────────────────────────────────────
function ElevationChart({ profile }) {
  if (!profile.length) return null;
  const { gain, loss } = calcElevationGain(profile);
  const minEle = Math.min(...profile.map((p) => p.ele));
  const maxEle = Math.max(...profile.map((p) => p.ele));

  return (
    <div className="mt-4 bg-slate-50 rounded-xl p-3 border border-slate-200">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-stone-600 uppercase tracking-wide flex items-center gap-1">
          <Mountain className="w-3.5 h-3.5" /> Höhenprofil
        </h4>
        <div className="flex gap-3 text-xs text-stone-500">
          <span className="text-brand-400 font-medium">↑ {gain} m</span>
          <span className="text-red-500 font-medium">↓ {loss} m</span>
          <span>{minEle}–{maxEle} m</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <AreaChart data={profile} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="eleGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1e293b" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#1e293b" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="dist" tickFormatter={(v) => `${v} km`} tick={{ fontSize: 9 }} />
          <YAxis domain={[minEle - 20, maxEle + 20]} tick={{ fontSize: 9 }} unit=" m" />
          <Tooltip formatter={(v) => [`${Math.round(v)} m`, "Höhe"]} labelFormatter={(v) => `${v} km`} />
          <Area type="monotone" dataKey="ele" stroke="#1e293b" strokeWidth={2}
            fill="url(#eleGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Find nearest segment index for route-click insertion ──────
function nearestSegmentIndex(waypoints, lat, lng) {
  let minDist = Infinity;
  let insertAt = waypoints.length;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const midLat = (waypoints[i].lat + waypoints[i + 1].lat) / 2;
    const midLng = (waypoints[i].lng + waypoints[i + 1].lng) / 2;
    const d = haversine([lat, lng], [midLat, midLng]);
    if (d < minDist) { minDist = d; insertAt = i + 1; }
  }
  return insertAt;
}

function relabelWaypoints(wps) {
  return wps.map((w, i) => ({ ...w, label: String(i + 1) }));
}

const ROUTING_MODES = [
  { id: "hike", label: "Wanderpfade", desc: "Markierte Wege" },
  { id: "foot", label: "Alle Wege", desc: "Auch Nebenwege" },
];

// ── Main smart planner tab ────────────────────────────────────
function SmartRoutePlanner({ onRouteReady }) {
  const [waypoints, setWaypoints] = useState([]);
  const [route, setRoute] = useState(null);
  const [elevation, setElevation] = useState([]);
  const [calculating, setCalculating] = useState(false);
  const [mapType, setMapType] = useState("standard");
  const [flyTarget, setFlyTarget] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [routingMode, setRoutingMode] = useState("hike");
  const routeRef = useRef(null);

  const tile = TILES[mapType];

  useEffect(() => {
    if (waypoints.length < 2) {
      setRoute(null);
      setElevation([]);
      onRouteReady(null);
      return;
    }
    let cancelled = false;
    setCalculating(true);
    calcRoute(waypoints, routingMode)
      .then((r) => {
        if (cancelled) return;
        setRoute(r);
        routeRef.current = r;
        if (r.elevationProfile?.length > 1) setElevation(r.elevationProfile);
        onRouteReady(r);
      })
      .catch(() => {
        if (!cancelled) toast.error("Die Route konnte gerade nicht berechnet werden. Bitte versuche es noch einmal.");
      })
      .finally(() => { if (!cancelled) setCalculating(false); });

    return () => { cancelled = true; };
  }, [waypoints, routingMode]);

  const handleMapClick = useCallback(({ lat, lng }) => {
    setWaypoints((prev) => relabelWaypoints([...prev, { lat, lng, label: "" }]));
  }, []);

  const handleRouteClick = useCallback((e) => {
    L.DomEvent.stopPropagation(e);
    const { lat, lng } = e.latlng;
    setWaypoints((prev) => {
      const idx = nearestSegmentIndex(prev, lat, lng);
      const next = [...prev];
      next.splice(idx, 0, { lat, lng, label: "" });
      return relabelWaypoints(next);
    });
  }, []);

  const removeWaypoint = (index) => {
    setWaypoints((prev) => relabelWaypoints(prev.filter((_, i) => i !== index)));
  };

  const moveWaypoint = (index, dir) => {
    setWaypoints((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return relabelWaypoints(next);
    });
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchText.trim()) return;
    setSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchText)}&format=json&limit=1&accept-language=de`
      );
      const results = await res.json();
      if (results.length > 0) {
        const { lat, lon } = results[0];
        const pos = { lat: parseFloat(lat), lng: parseFloat(lon), label: "" };
        setWaypoints((prev) => relabelWaypoints([...prev, pos]));
        setFlyTarget({ center: [parseFloat(lat), parseFloat(lon)], zoom: 13 });
        setSearchText("");
      } else {
        setSearchError("Ort nicht gefunden");
      }
    } catch {
      setSearchError("Suche fehlgeschlagen");
    } finally {
      setSearching(false);
    }
  };

  const reset = () => {
    setWaypoints([]);
    setRoute(null);
    setElevation([]);
    onRouteReady(null);
  };

  return (
    <div className="space-y-3">
      {/* Routing mode selector */}
      <div className="bg-stone-100 p-1 rounded-xl flex gap-1">
        {ROUTING_MODES.map((m) => (
          <button key={m.id} onClick={() => setRoutingMode(m.id)}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all text-center ${
              routingMode === m.id ? "bg-white shadow-sm text-stone-800" : "text-stone-500 hover:text-stone-700"
            }`}
          >
            <div>{m.label}</div>
            <div className="text-[10px] font-normal text-stone-400 mt-0.5 hidden sm:block">{m.desc}</div>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex gap-2 flex-wrap items-center">
        <form onSubmit={handleSearch} className="flex gap-1.5 flex-1 min-w-0">
          <Input value={searchText} onChange={(e) => setSearchText(e.target.value)}
            placeholder="Ort als Wegpunkt suchen..." className="flex-1 h-9 text-sm" />
          <Button type="submit" size="sm" variant="outline" disabled={searching} className="h-9 px-3 shrink-0">
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </form>

        <button
          onClick={() => setMapType((t) => t === "standard" ? "topo" : "standard")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-medium text-stone-600 hover:bg-stone-50 bg-white shrink-0 h-9"
        >
          <Layers className="w-3.5 h-3.5" />
          {mapType === "standard" ? "Topo" : "Standard"}
        </button>

        {waypoints.length > 0 && (
          <Button size="sm" variant="outline" onClick={reset} className="h-9 text-red-500 hover:text-red-600 shrink-0">
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
          </Button>
        )}
      </div>

      {searchError && <p className="text-xs text-red-500">{searchError}</p>}

      {/* Map */}
      <div className="relative rounded-xl overflow-hidden border border-stone-200 shadow-sm h-[60vw] min-h-[260px] max-h-[450px] md:h-[440px] md:max-h-none">
        <MapContainer center={[46.5, 11.3]} zoom={10} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
          <TileLayer url={tile.url} attribution={tile.attribution} />
          <MapClickHandler onMapClick={handleMapClick} />
          {flyTarget && <MapFlyTo center={flyTarget.center} zoom={flyTarget.zoom} />}

          {/* Calculated route — clickable to insert waypoints */}
          {route && (
            <Polyline
              positions={route.positions}
              color="#1e3a8a"
              weight={6}
              opacity={0.85}
              eventHandlers={{ click: handleRouteClick }}
            />
          )}

          {/* Waypoint markers — draggable */}
          {waypoints.map((wp, i) => (
            <Marker
              key={i}
              position={[wp.lat, wp.lng]}
              icon={waypointIcon(wp.label, i === 0, i === waypoints.length - 1 && waypoints.length > 1)}
              draggable={true}
              eventHandlers={{
                dragend: (e) => {
                  const { lat, lng } = e.target.getLatLng();
                  setWaypoints((prev) => prev.map((w, j) => j === i ? { ...w, lat, lng } : w));
                },
              }}
            >
              <Popup>
                <div className="text-xs">
                  <p className="font-semibold">{i === 0 ? "Start" : i === waypoints.length - 1 ? "Ziel" : `Wegpunkt ${wp.label}`}</p>
                  <p className="text-stone-400">{wp.lat.toFixed(5)}, {wp.lng.toFixed(5)}</p>
                  <p className="text-stone-400 italic">Ziehen zum Verschieben</p>
                  <button
                    onClick={() => removeWaypoint(i)}
                    className="mt-1 text-red-500 hover:underline text-xs flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Entfernen
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {waypoints.length === 0 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 text-xs text-stone-600 shadow pointer-events-none">
            Tippe auf die Karte um Wegpunkte zu setzen
          </div>
        )}
        {waypoints.length === 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 text-xs text-stone-600 shadow pointer-events-none">
            Setze einen weiteren Punkt für die Route
          </div>
        )}
        {route && waypoints.length >= 2 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 text-[10px] text-stone-500 shadow pointer-events-none">
            Route anklicken → Wegpunkt einfügen · Marker ziehen → verschieben
          </div>
        )}

        {calculating && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-stone-600 flex items-center gap-1.5 shadow">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" /> Route wird berechnet...
          </div>
        )}

        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 text-[10px] font-medium text-stone-500 shadow">
          {tile.label}
        </div>
      </div>

      {/* Waypoints list with reorder */}
      {waypoints.length > 0 && (
        <div className="space-y-1">
          {waypoints.map((wp, i) => (
            <div key={i} className="flex items-center gap-2 text-xs bg-stone-50 rounded-lg px-2 py-1.5 group">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-white text-[10px] shrink-0 ${
                i === 0 ? "bg-brand-400" : i === waypoints.length - 1 && waypoints.length > 1 ? "bg-red-600" : "bg-slate-700"
              }`}>
                {i === 0 ? "S" : i === waypoints.length - 1 && waypoints.length > 1 ? "Z" : wp.label}
              </span>
              <span className="text-stone-500 flex-1 truncate">{wp.lat.toFixed(5)}, {wp.lng.toFixed(5)}</span>
              {/* Reorder buttons */}
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => moveWaypoint(i, -1)} disabled={i === 0}
                  className="text-stone-400 hover:text-stone-700 disabled:opacity-20 p-0.5">
                  ↑
                </button>
                <button onClick={() => moveWaypoint(i, 1)} disabled={i === waypoints.length - 1}
                  className="text-stone-400 hover:text-stone-700 disabled:opacity-20 p-0.5">
                  ↓
                </button>
              </div>
              <button onClick={() => removeWaypoint(i)} className="text-stone-300 hover:text-red-500">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      {route && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
            <Ruler className="w-4 h-4 text-blue-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-blue-800">{route.distance_km}</p>
            <p className="text-xs text-blue-600">km</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
            <Clock className="w-4 h-4 text-slate-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-slate-800">
              {Math.floor(route.duration_minutes / 60) > 0
                ? `${Math.floor(route.duration_minutes / 60)}h ${route.duration_minutes % 60}m`
                : `${route.duration_minutes}m`}
            </p>
            <p className="text-xs text-slate-500">ca. Zeit</p>
          </div>
          <div className="bg-brand-50 rounded-xl p-3 text-center border border-brand-100">
            <TrendingUp className="w-4 h-4 text-brand-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-brand-700">
              {elevation.length ? `+${calcElevationGain(elevation).gain} m` : "–"}
            </p>
            <p className="text-xs text-brand-400">Aufstieg</p>
          </div>
        </div>
      )}

      {/* Elevation profile */}
      <AnimatePresence>
        {elevation.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <ElevationChart profile={elevation} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function RoutePlanner() {
  const [activeTab, setActiveTab] = useState("plan");
  const [routeGeometry, setRouteGeometry] = useState(null);
  const [routeData, setRouteData] = useState({
    name: "",
    description: "",
    start_location: "",
    notes: "",
  });

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  const createRouteMutation = useMutation({
    mutationFn: (data) => createRoute(user.id, data),
    onSuccess: (savedRoute) => {
      queryClient.invalidateQueries({ queryKey: ["userRoutes", user?.id] });
      toast.success("Route gespeichert!");
      navigate(createPageUrl("RouteDetail") + `?id=${savedRoute.id}`);
    },
    onError: (e) => toast.error("Fehler beim Speichern: " + e.message),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!routeGeometry || !routeData.name) {
      toast.error("Bitte Namen eingeben und eine Route zeichnen");
      return;
    }
    await createRouteMutation.mutateAsync({
      name: routeData.name,
      description: routeData.description,
      start_location: routeData.start_location,
      route_type: activeTab === "track" ? "recorded" : activeTab === "gpx" ? "gpx" : "planned",
      waypoints: routeGeometry.positions ?? routeGeometry.coordinates ?? [],
      is_public: false,
      distance_km: routeGeometry.distance_km,
      elevation_gain_m: routeGeometry.elevation_gain_m || null,
      duration_minutes: routeGeometry.duration_minutes || null,
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-xl text-stone-700 mb-4">Bitte melde dich an, um Routen zu planen</p>
          <Link to={createPageUrl("Login")}>
            <Button className="bg-brand-400 hover:bg-brand-600">Anmelden</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-slate-50 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8">
        <Link to={createPageUrl("Profile")}>
          <Button variant="ghost" className="mb-3 md:mb-4" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Zurück zum Profil</span>
            <span className="sm:hidden">Zurück</span>
          </Button>
        </Link>

        <div className="flex items-center gap-3 mb-5">
          <div className="bg-slate-800 rounded-xl p-2 shrink-0">
            <Map className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-stone-800">Routenplaner</h1>
            <p className="text-xs text-stone-500">Setze Wegpunkte, die Route wird automatisch berechnet</p>
          </div>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-2 mb-5 bg-stone-100 p-1 rounded-xl">
          {[
            { id: "plan", icon: Map, label: "Planen" },
            { id: "track", icon: Navigation, label: "Aufzeichnen" },
            { id: "gpx", icon: Upload, label: "GPX" },
          ].map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => { setActiveTab(id); setRouteGeometry(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === id ? "bg-white text-stone-800 shadow-sm" : "text-stone-500 hover:text-stone-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "plan" && (
          <SmartRoutePlanner onRouteReady={setRouteGeometry} />
        )}
        {activeTab === "track" && (
          <GPSTracker onSave={(g) => setRouteGeometry(g)} />
        )}
        {activeTab === "gpx" && (
          <GPXUploader onSave={(g) => setRouteGeometry(g)} />
        )}

        {/* Save form */}
        <AnimatePresence>
          {routeGeometry && (
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              onSubmit={handleSubmit}
              className="mt-6 space-y-4 bg-white rounded-2xl border border-stone-200/60 shadow-sm p-5"
            >
              <h3 className="text-base font-semibold text-stone-800">Route speichern</h3>

              <div>
                <Label htmlFor="name">Name *</Label>
                <Input id="name" placeholder="z.B. Pragser Wildsee Rundweg"
                  value={routeData.name} onChange={(e) => setRouteData({ ...routeData, name: e.target.value })}
                  required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="start_location">Startpunkt</Label>
                <Input id="start_location" placeholder="z.B. Parkplatz Pragser Wildsee"
                  value={routeData.start_location} onChange={(e) => setRouteData({ ...routeData, start_location: e.target.value })}
                  className="mt-1" />
              </div>
              <div>
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea id="description" placeholder="Beschreibe deine Route..."
                  value={routeData.description} onChange={(e) => setRouteData({ ...routeData, description: e.target.value })}
                  rows={2} className="mt-1" />
              </div>

              <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
                Diese Planung bleibt privat. Erst wenn du die Route später als Wanderung einträgst,
                kannst du sie auf Freunde oder öffentlich stellen.
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setRouteGeometry(null)}>
                  Abbrechen
                </Button>
                <Button type="submit" disabled={createRouteMutation.isPending} className="bg-slate-800 hover:bg-slate-900">
                  {createRouteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Route speichern
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
