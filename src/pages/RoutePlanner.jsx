import { useState, useCallback, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { createRoute } from "@/lib/routesApi";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MapContainer, TileLayer, Polyline, Marker, useMapEvents, useMap, Popup } from "react-leaflet";
import L from "leaflet";
import { configureLeafletDefaultIcon } from "@/lib/leafletDefaultIcon";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, Map, Navigation, Loader2, Upload, Search, RotateCcw, Layers, Mountain, X, Info
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import GPSTracker from "@/components/routes/GPSTracker";
import GPXUploader from "@/components/routes/GPXUploader";
import { deleteJournalFiles, uploadJournalFile } from "@/lib/journalApi";
import { toast } from "sonner";

// ── Leaflet fix ───────────────────────────────────────────────

configureLeafletDefaultIcon();


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
    maxZoom: 19,
    maxNativeZoom: 19,
  },
  topo: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
    label: "Topo",
    maxZoom: 17,
    maxNativeZoom: 17,
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
const GH_API_KEY = import.meta.env.VITE_GRAPHHOPPER_KEY || "";
async function calcGraphHopperRoute(waypoints, profile = "hike") {
  if (!GH_API_KEY) throw new Error("GraphHopper nicht konfiguriert");
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
    if (!GH_API_KEY) {
      throw err;
    }
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
    <div className="doghike-glass-card mt-4 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1">
          <Mountain className="w-3.5 h-3.5" /> Höhenprofil
        </h4>
        <div className="flex gap-3 text-xs text-slate-500">
          <span className="text-brand-400 font-medium">↑ {gain} m</span>
          <span className="text-brand-500 font-medium">↓ {loss} m</span>
          <span>{minEle}–{maxEle} m</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <AreaChart data={profile} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="eleGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#c46f52" stopOpacity={0.34} />
              <stop offset="95%" stopColor="#c46f52" stopOpacity={0.06} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="dist" tickFormatter={(v) => `${v} km`} tick={{ fontSize: 9 }} />
          <YAxis domain={[minEle - 20, maxEle + 20]} tick={{ fontSize: 9 }} unit=" m" />
          <Tooltip formatter={(v) => [`${Math.round(v)} m`, "Höhe"]} labelFormatter={(v) => `${v} km`} />
          <Area type="monotone" dataKey="ele" stroke="#c46f52" strokeWidth={2}
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
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [routingMode, setRoutingMode] = useState("hike");
  const routeRef = useRef(null);
  const topoTileFallbackRef = useRef(false);

  const tile = TILES[mapType];

  useEffect(() => {
    topoTileFallbackRef.current = false;
  }, [mapType]);

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
        if (!cancelled) toast.error("Der Weg lässt sich gerade nicht berechnen. Versuch es gleich noch einmal.");
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
    const query = searchText.trim();
    if (!query) return;
    setSearching(true);
    setSearchError(null);
    setSearchResults([]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&accept-language=de`
      );
      const results = await res.json();
      if (results.length > 0) {
        const normalizedResults = results.map((result) => ({
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          title: result.display_name?.split(",").slice(0, 2).join(", ") || result.display_name,
          subtitle: result.display_name,
        }));

        if (normalizedResults.length === 1) {
          const [selected] = normalizedResults;
          setWaypoints((prev) => relabelWaypoints([...prev, { lat: selected.lat, lng: selected.lng, label: "" }]));
          setFlyTarget({ center: [selected.lat, selected.lng], zoom: 13 });
          setSearchText("");
        } else {
          setSearchResults(normalizedResults);
        }
      } else {
        setSearchError("Ort nicht gefunden");
      }
    } catch {
      setSearchError("Die Suche hängt gerade");
    } finally {
      setSearching(false);
    }
  };

  const handleSelectSearchResult = (result) => {
    setWaypoints((prev) => relabelWaypoints([...prev, { lat: result.lat, lng: result.lng, label: "" }]));
    setFlyTarget({ center: [result.lat, result.lng], zoom: 13 });
    setSearchResults([]);
    setSearchText("");
    setSearchError(null);
  };

  const dismissSearchResults = () => {
    setSearchResults([]);
  };

  const reset = () => {
    setWaypoints([]);
    setRoute(null);
    setElevation([]);
    onRouteReady(null);
    setSearchResults([]);
    setSearchError(null);
  };

  const handleTileError = (event) => {
    const failedZoom = event?.coords?.z ?? tile.maxNativeZoom;
    if (mapType !== "topo" || topoTileFallbackRef.current || failedZoom < tile.maxNativeZoom) return;
    topoTileFallbackRef.current = true;
    setMapType("standard");
    toast.info("Topo geht hier gerade nicht. Die Standardkarte übernimmt.");
  };

  return (
    <div className="space-y-3">
      {/* Routing mode selector */}
      <div className="flex gap-1 rounded-xl border border-white/70 bg-white/65 p-1 backdrop-blur-xl">
        {ROUTING_MODES.map((m) => (
          <button key={m.id} onClick={() => setRoutingMode(m.id)}
            className={`flex-1 rounded-lg px-2 py-2 text-center text-xs font-medium transition-all ${
              routingMode === m.id ? "bg-brand-100 text-brand-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <div>{m.label}</div>
            <div className="text-[10px] font-normal text-slate-400 mt-0.5 hidden sm:block">{m.desc}</div>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="grid grid-cols-[1fr_auto] items-center gap-2">
        <form onSubmit={handleSearch} className="grid min-w-0 grid-cols-[1fr_auto] gap-1.5">
          <Input value={searchText} onChange={(e) => setSearchText(e.target.value)}
            placeholder="Ort als Wegpunkt suchen..." className="h-10 text-sm" />
          <Button type="submit" size="sm" variant="outline" disabled={searching} className="h-10 w-10 shrink-0 rounded-xl px-0">
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </form>

        <button
          onClick={() => setMapType((t) => t === "standard" ? "topo" : "standard")}
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-brand-100 bg-white/70 px-3 text-xs font-medium text-slate-600 hover:bg-brand-50/40"
        >
          <Layers className="w-3.5 h-3.5" />
          {mapType === "standard" ? "Topo" : "Standard"}
        </button>

        {waypoints.length > 0 && (
          <Button size="sm" variant="outline" onClick={reset} className="col-span-2 h-9 text-brand-500 hover:text-brand-400 sm:col-span-1">
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
          </Button>
        )}
      </div>

      {searchError && <p className="text-xs text-brand-500">{searchError}</p>}
      {searchResults.length > 1 && (
        <div className="rounded-xl border border-brand-100/80 bg-white/85 p-2 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between gap-2 px-2 pb-2">
            <p className="text-xs font-medium text-slate-500">
              Mehrere Orte gefunden. Wähle den richtigen aus:
            </p>
            <button
              type="button"
              onClick={dismissSearchResults}
              className="text-xs font-medium text-slate-400 transition hover:text-slate-700"
            >
              Schließen
            </button>
          </div>
          <div className="space-y-1">
            {searchResults.map((result, index) => (
              <button
                key={`${result.lat}-${result.lng}-${index}`}
                type="button"
                onClick={() => handleSelectSearchResult(result)}
                className="flex w-full flex-col rounded-lg px-3 py-2 text-left transition hover:bg-brand-50/60"
              >
                <span className="text-sm font-medium text-slate-700">{result.title}</span>
                <span className="text-xs text-slate-500">{result.subtitle}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Map */}
      <div className="relative h-[68vw] min-h-[310px] max-h-[500px] overflow-hidden rounded-xl border border-brand-100 shadow-sm md:h-[440px] md:max-h-none">
        <MapContainer
          center={[46.5, 11.3]}
          zoom={10}
          maxZoom={tile.maxZoom}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={false}
        >
          <TileLayer
            url={tile.url}
            attribution={tile.attribution}
            maxZoom={tile.maxZoom}
            maxNativeZoom={tile.maxNativeZoom}
            eventHandlers={{ tileerror: handleTileError }}
          />
          <MapClickHandler onMapClick={handleMapClick} />
          {flyTarget && <MapFlyTo center={flyTarget.center} zoom={flyTarget.zoom} />}

          {/* Calculated route — clickable to insert waypoints */}
          {route && (
            <Polyline
              positions={route.positions}
              color="#A8003C"
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
                  <p className="text-slate-400">{wp.lat.toFixed(5)}, {wp.lng.toFixed(5)}</p>
                  <p className="text-slate-400 italic">Ziehen zum Verschieben</p>
                  <button
                    onClick={() => removeWaypoint(i)}
                    className="mt-1 text-brand-500 hover:underline text-xs flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Entfernen
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {waypoints.length === 0 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 text-xs text-slate-600 shadow pointer-events-none">
            Tippe auf die Karte um Wegpunkte zu setzen
          </div>
        )}
        {waypoints.length === 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 text-xs text-slate-600 shadow pointer-events-none">
            Setze einen weiteren Punkt für die Route
          </div>
        )}
        {route && waypoints.length >= 2 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 text-[10px] text-slate-500 shadow pointer-events-none">
            Route anklicken → Wegpunkt einfügen · Marker ziehen → verschieben
          </div>
        )}

        {calculating && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-slate-600 flex items-center gap-1.5 shadow">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-600" /> Route wird berechnet...
          </div>
        )}

        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 text-[10px] font-medium text-slate-500 shadow">
          {tile.label}
        </div>
      </div>

      {/* Waypoints list with reorder */}
      {waypoints.length > 0 && (
        <div className="space-y-1">
          {waypoints.map((wp, i) => (
            <div key={i} className="flex items-center gap-2 text-xs bg-brand-50/70 rounded-lg px-2 py-1.5 group">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-white text-[10px] shrink-0 ${
            i === 0 ? "bg-brand-400" : i === waypoints.length - 1 && waypoints.length > 1 ? "bg-brand-400" : "bg-brand-700"
              }`}>
                {i === 0 ? "S" : i === waypoints.length - 1 && waypoints.length > 1 ? "Z" : wp.label}
              </span>
              <span className="text-slate-500 flex-1 truncate">{wp.lat.toFixed(5)}, {wp.lng.toFixed(5)}</span>
              {/* Reorder buttons */}
              <div className="flex gap-0.5 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                <button onClick={() => moveWaypoint(i, -1)} disabled={i === 0}
                  className="rounded p-1 text-slate-400 hover:bg-white hover:text-slate-700 disabled:opacity-20">
                  ↑
                </button>
                <button onClick={() => moveWaypoint(i, 1)} disabled={i === waypoints.length - 1}
                  className="rounded p-1 text-slate-400 hover:bg-white hover:text-slate-700 disabled:opacity-20">
                  ↓
                </button>
              </div>
              <button onClick={() => removeWaypoint(i)} className="text-slate-300 hover:text-brand-500">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
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
      toast.success("Deine Route ist bereit.");
      navigate(createPageUrl("RouteDetail") + `?id=${savedRoute.id}`);
    },
    onError: () => toast.error("Die Route wollte gerade nicht speichern."),
  });

  const buildJournalPrefillFromRecordedRoute = () => {
    const recordedCoordinates = routeGeometry?.coordinates ?? routeGeometry?.positions ?? [];
    const startPoint = recordedCoordinates[0] ?? null;

    return {
      title: routeData.name,
      location: routeData.start_location,
      date: new Date().toISOString().split("T")[0],
      latitude: startPoint?.[0] ?? "",
      longitude: startPoint?.[1] ?? "",
      distance_km: routeGeometry?.distance_km ?? "",
      elevation_m: routeGeometry?.elevation_gain_m ?? "",
      duration_minutes: routeGeometry?.duration_minutes ?? "",
      description: routeData.description,
      photos: [],
      gpx_url: "",
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!routeGeometry || !routeData.name) {
      toast.error("Name und Route fehlen noch.");
      return;
    }

    if (activeTab === "track") {
      navigate(createPageUrl("AddJournalEntry"), {
        state: { routePrefill: buildJournalPrefillFromRecordedRoute() },
      });
      return;
    }

    let uploadedGpxUrl = null;

    try {
      if (activeTab === "gpx" && routeGeometry.rawFile) {
        uploadedGpxUrl = await uploadJournalFile(user.id, routeGeometry.rawFile);
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
        gpx_url: uploadedGpxUrl,
      });
    } catch (error) {
      if (uploadedGpxUrl) {
        try {
          await deleteJournalFiles([uploadedGpxUrl]);
        } catch {}
      }

      throw error;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50/20 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-xl text-slate-700 mb-4">Bitte melde dich an, um Routen zu planen</p>
          <Link to={createPageUrl("Login")}>
            <Button className="bg-brand-400 hover:bg-brand-600">Anmelden</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50/20 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8">
        <Link to={createPageUrl("Profile")}>
          <Button variant="ghost" className="mb-3 h-8 rounded-xl px-2 text-slate-600 hover:bg-brand-50/60 hover:text-slate-900 md:mb-4" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">Zurück zum Profil</span>
            <span className="sm:hidden">Zurück</span>
          </Button>
        </Link>

        <div className="doghike-page-header mb-5">
          <div className="doghike-page-icon">
            <Map className="h-5 w-5" />
          </div>
          <div>
            <h1 className="doghike-page-title">Routenplaner</h1>
            <p className="doghike-page-subtitle">Setze Wegpunkte, die Route wird automatisch berechnet</p>
          </div>
        </div>

        {/* Mode tabs */}
        <div className="mb-5 grid grid-cols-3 gap-1 rounded-xl border border-white/70 bg-white/65 p-1 backdrop-blur-xl">
          {[
            { id: "plan", icon: Map, label: "Planen" },
            { id: "track", icon: Navigation, label: "Aufzeichnen" },
            { id: "gpx", icon: Upload, label: "GPX" },
          ].map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => { setActiveTab(id); setRouteGeometry(null); }}
              className={`flex min-w-0 items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-medium transition-all sm:text-sm ${
                activeTab === id ? "bg-brand-100 text-brand-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "plan" && (
          <SmartRoutePlanner onRouteReady={setRouteGeometry} />
        )}
        {activeTab === "track" && (
          <div className="space-y-3">
            <div className="inline-flex items-start gap-2 rounded-xl border border-brand-100 bg-brand-50/80 px-3 py-2 text-xs font-medium text-brand-700 shadow-sm">
              <span className="inline-flex h-5 shrink-0 items-center gap-1 rounded-full bg-brand-100 px-2 text-[10px] font-bold uppercase tracking-wide text-brand-700">
                <Info className="h-3 w-3" />
                Beta
              </span>
              <span>
                Die Aufzeichnung ist noch in der Beta-Phase und funktioniert in der Web-App noch nicht fehlerfrei.
              </span>
            </div>
            <GPSTracker onSave={(g) => setRouteGeometry(g)} />
          </div>
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
              className="doghike-glass-card mt-6 space-y-4 p-5"
            >
              <h3 className="text-base font-semibold text-slate-900">
                {activeTab === "track"
                  ? "Aufzeichnung ins Tagebuch übernehmen"
                  : activeTab === "gpx"
                    ? "GPX-Route speichern"
                    : "Route speichern"}
              </h3>

              <div>
                <Label htmlFor="name">Name der Tour *</Label>
                <Input id="name" placeholder="z.B. Pragser Wildsee Rundweg"
                  value={routeData.name} onChange={(e) => setRouteData({ ...routeData, name: e.target.value })}
                  required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="start_location">Startpunkt / Parkplatz</Label>
                <Input id="start_location" placeholder="z.B. Parkplatz Pragser Wildsee"
                  value={routeData.start_location} onChange={(e) => setRouteData({ ...routeData, start_location: e.target.value })}
                  className="mt-1" />
              </div>
              <div>
                <Label htmlFor="description">Beschreibung / Notizen</Label>
                <Textarea id="description" placeholder="Notizen zu deiner Route..."
                  value={routeData.description} onChange={(e) => setRouteData({ ...routeData, description: e.target.value })}
                  rows={2} className="mt-1" />
              </div>

              <div className="rounded-xl border border-brand-100 bg-brand-50/70 px-4 py-3 text-sm text-slate-600">
                {activeTab === "track"
                  ? "Diese Aufzeichnung gilt als bereits gemacht und wird direkt als vorausgefüllter Tagebuch-Eintrag geöffnet."
                  : activeTab === "gpx"
                    ? "Dieser GPX-Import bleibt privat. Du kannst ihn später als Wanderung eintragen oder weiterbearbeiten."
                    : "Diese Planung bleibt privat. Erst wenn du die Route später als Wanderung einträgst, kannst du sie auf Freunde oder öffentlich stellen."}
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setRouteGeometry(null)} className="w-full sm:w-auto">
                  Abbrechen
                </Button>
                <Button type="submit" disabled={createRouteMutation.isPending} className="w-full bg-[#A8003C] hover:bg-[#7C3020] sm:w-auto">
                  {createRouteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {activeTab === "track"
                    ? "Ins Tagebuch übernehmen"
                    : activeTab === "gpx"
                      ? "GPX-Route speichern"
                      : "Route speichern"}
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
