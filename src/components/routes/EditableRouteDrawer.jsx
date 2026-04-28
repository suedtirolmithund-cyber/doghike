import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Polyline, Marker, useMapEvents, Popup, useMap } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Undo, Trash2, Save, Loader2, Edit2, Move, X, Search } from "lucide-react";
import RouteElevationProfile from "./RouteElevationProfile";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const GH_API_KEY = import.meta.env.VITE_GRAPHHOPPER_KEY || "LijBPDQGfu7Imiq1X1Jw83a5787IYJB2mEQhHe8A7";

// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Create custom draggable marker icon
const createWaypointIcon = (index, isEditing) => {
  return L.divIcon({
    html: `<div style="
      background: ${isEditing ? '#ef4444' : '#1e293b'};
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      cursor: ${isEditing ? 'move' : 'pointer'};
    ">${index + 1}</div>`,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

function DraggableMarker({ position, index, isEditing, onDrag, onDelete }) {
  const markerRef = useRef(null);

  useEffect(() => {
    const marker = markerRef.current;
    if (marker && isEditing) {
      marker.dragging.enable();
    } else if (marker) {
      marker.dragging.disable();
    }
  }, [isEditing]);

  const eventHandlers = {
    dragend: () => {
      const marker = markerRef.current;
      if (marker) {
        const newPos = marker.getLatLng();
        onDrag(index, [newPos.lat, newPos.lng]);
      }
    },
  };

  return (
    <Marker
      position={position}
      icon={createWaypointIcon(index, isEditing)}
      ref={markerRef}
      eventHandlers={eventHandlers}
      draggable={isEditing}
    >
      {isEditing && (
        <Popup>
          <div className="text-center">
            <p className="font-medium mb-2">Wegpunkt {index + 1}</p>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(index)}
              className="w-full"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Löschen
            </Button>
          </div>
        </Popup>
      )}
    </Marker>
  );
}

function MapCenterController({ center }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, 13);
    }
  }, [center, map]);
  
  return null;
}

function RouteDrawerMap({ waypoints, setWaypoints, routeCoordinates, isEditing, searchCenter }) {
  useMapEvents({
    click: (e) => {
      if (!isEditing) {
        setWaypoints([...waypoints, [e.latlng.lat, e.latlng.lng]]);
      }
    },
  });

  const handleDrag = (index, newPosition) => {
    const newWaypoints = [...waypoints];
    newWaypoints[index] = newPosition;
    setWaypoints(newWaypoints);
  };

  const handleDelete = (index) => {
    const newWaypoints = waypoints.filter((_, i) => i !== index);
    setWaypoints(newWaypoints);
  };

  return (
    <>
      {searchCenter && <MapCenterController center={searchCenter} />}
      {routeCoordinates.length > 1 && (
        <Polyline positions={routeCoordinates} color="#ef4444" weight={4} opacity={0.8} />
      )}
      {waypoints.map((point, idx) => (
        <DraggableMarker
          key={idx}
          position={point}
          index={idx}
          isEditing={isEditing}
          onDrag={handleDrag}
          onDelete={handleDelete}
        />
      ))}
    </>
  );
}

export default function EditableRouteDrawer({ onSave, initialRoute = [] }) {
  const [waypoints, setWaypoints] = useState(initialRoute);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [routeDistance, setRouteDistance] = useState(0);
  const [routeElevationGain, setRouteElevationGain] = useState(0);
  const [routeDurationMin, setRouteDurationMin] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchCenter, setSearchCenter] = useState(null);
  const mapRef = useRef();

  // Fetch route using GraphHopper public API with hiking profile
  // Uses OSM data, prefers marked hiking trails (foot-hiking), allows side paths
  const fetchRoute = async (points) => {
    if (points.length < 2) {
      setRouteCoordinates(points);
      setRouteDistance(0);
      return;
    }

    setIsCalculating(true);
    try {
      // Build GraphHopper request - foot_hiking prefers designated hiking trails
      // but also uses footpaths and side trails
      const pointsParam = points.map(p => `point=${p[0]},${p[1]}`).join('&');
      const response = await fetch(
        `https://graphhopper.com/api/1/route?${pointsParam}&profile=hike&locale=de&calc_points=true&instructions=false&points_encoded=false&key=${GH_API_KEY}`
      );
      const data = await response.json();

      if (data.paths && data.paths[0]) {
        const path = data.paths[0];
        const coordinates = path.points.coordinates.map(c => [c[1], c[0]]);
        setRouteCoordinates(coordinates);
        const distKm = parseFloat((path.distance / 1000).toFixed(2));
        setRouteDistance(distKm);
        const elevGain = path.ascend ? Math.round(path.ascend) : 0;
        setRouteElevationGain(elevGain);
        // Naismith's rule: 1h per 5km + 1h per 600m ascent
        const estimatedMin = Math.round((distKm / 5) * 60 + (elevGain / 600) * 60);
        setRouteDurationMin(estimatedMin);
      } else {
        // Fallback: try OSRM
        await fetchRouteOSRM(points);
      }
    } catch (error) {
      console.error('GraphHopper routing error, falling back to OSRM:', error);
      await fetchRouteOSRM(points);
    } finally {
      setIsCalculating(false);
    }
  };

  // OSRM fallback
  const fetchRouteOSRM = async (points) => {
    try {
      const coords = points.map(p => `${p[1]},${p[0]}`).join(';');
      const response = await fetch(
        `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${coords}?overview=full&geometries=geojson`
      );
      const data = await response.json();
      if (data.code === 'Ok' && data.routes && data.routes[0]) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates.map(c => [c[1], c[0]]);
        setRouteCoordinates(coordinates);
        const distKm = parseFloat((route.distance / 1000).toFixed(2));
        setRouteDistance(distKm);
        setRouteElevationGain(0);
        setRouteDurationMin(Math.round((distKm / 5) * 60));
      } else {
        const distKm = parseFloat(calculateDistance(points));
        setRouteCoordinates(points);
        setRouteDistance(distKm);
        setRouteDurationMin(Math.round((distKm / 5) * 60));
      }
    } catch {
      const distKm = parseFloat(calculateDistance(points));
      setRouteCoordinates(points);
      setRouteDistance(distKm);
      setRouteDurationMin(Math.round((distKm / 5) * 60));
    }
  };

  useEffect(() => {
    fetchRoute(waypoints);
  }, [waypoints]);

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
    
    return totalDistance.toFixed(2);
  };

  const handleUndo = () => {
    setWaypoints(waypoints.slice(0, -1));
  };

  const handleClear = () => {
    setWaypoints([]);
    setIsEditing(false);
  };

  const makeLoop = () => {
    if (waypoints.length < 2) return;
    const start = waypoints[0];
    setWaypoints([...waypoints, start]);
  };

  const handleSave = () => {
    onSave({
      coordinates: routeCoordinates.length > 0 ? routeCoordinates : waypoints,
      distance_km: parseFloat(routeDistance),
      elevation_gain_m: routeElevationGain,
      duration_minutes: routeDurationMin,
    });
  };

  const handleSearch = async () => {
    const query = searchQuery.trim();
    if (!query) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=it,at,de`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Suchfehler:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectLocation = (result) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    setSearchCenter([lat, lon]);
    setSearchResults([]);
    setSearchQuery("");
  };

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Ortssuche */}
      <div className="bg-blue-50 rounded-lg p-3 md:p-4 border border-blue-200">
        <p className="font-medium text-xs md:text-sm text-stone-800 mb-2">🔍 Ort suchen</p>
        <div className="flex gap-2">
          <Input
            placeholder="z.B. Pragser Wildsee, Drei Zinnen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            size="sm"
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        {searchResults.length > 0 && (
          <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
            {searchResults.map((result, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectLocation(result)}
                className="w-full text-left p-2 text-xs md:text-sm bg-white rounded border border-blue-200 hover:bg-blue-50 transition-colors"
              >
                <p className="font-medium text-stone-800">{result.display_name}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bg-slate-100 rounded-lg p-3 md:p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-medium text-xs md:text-sm text-stone-800 mb-1">📍 Routenplaner</p>
            <p className="text-xs text-stone-600">
              {isEditing ? 'Ziehe Wegpunkte um sie zu verschieben' : 'Klicke auf die Karte um Wegpunkte zu setzen'}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              🥾 Bevorzugt Haupt­wanderwege, nutzt auch Seitenwege
            </p>
          </div>
          {waypoints.length >= 2 && (
            <Button
              size="sm"
              variant={isEditing ? "default" : "outline"}
              onClick={() => setIsEditing(!isEditing)}
              className={isEditing ? "bg-red-600 hover:bg-red-700" : ""}
            >
              {isEditing ? (
                <>
                  <X className="w-3 h-3 md:mr-1" />
                  <span className="hidden md:inline">Fertig</span>
                </>
              ) : (
                <>
                  <Edit2 className="w-3 h-3 md:mr-1" />
                  <span className="hidden md:inline">Bearbeiten</span>
                </>
              )}
            </Button>
          )}
        </div>

        {isCalculating && (
          <div className="mt-2 flex items-center gap-2 text-blue-600 text-xs md:text-sm">
            <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
            <span>Route wird berechnet...</span>
          </div>
        )}
        {waypoints.length > 0 && !isCalculating && (
          <div className="mt-2 pt-2 border-t border-stone-300 space-y-2">
            <div className="flex items-center justify-between text-xs md:text-sm">
              <span className="text-stone-600">Wegpunkte: <strong className="text-slate-800">{waypoints.length}</strong></span>
              <span className="text-stone-600">Distanz: <strong className="text-slate-800">{routeDistance} km</strong></span>
            </div>
            {waypoints.length >= 2 && routeDurationMin > 0 && (
              <div className="bg-white rounded-lg px-3 py-2 border border-slate-300 flex flex-wrap gap-3 items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⏱️</span>
                  <div>
                    <p className="text-xs text-stone-500 leading-none">Geschätzte Gehzeit</p>
                    <p className="font-bold text-slate-800 text-sm md:text-base">
                      {Math.floor(routeDurationMin / 60) > 0 ? `${Math.floor(routeDurationMin / 60)}h ` : ""}{routeDurationMin % 60}min
                    </p>
                  </div>
                </div>
                {routeElevationGain > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⛰️</span>
                    <div>
                      <p className="text-xs text-stone-500 leading-none">Höhenmeter</p>
                      <p className="font-bold text-slate-800 text-sm md:text-base">+{routeElevationGain} m</p>
                    </div>
                  </div>
                )}
                <p className="text-xs text-stone-400 w-full">Nach Naismith-Regel (5 km/h + 600 Hm/h)</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="relative h-[60vw] min-h-64 max-h-72 md:h-96 lg:h-[500px] rounded-xl overflow-hidden border-2 border-stone-200">
        <MapContainer
          center={waypoints.length > 0 ? waypoints[0] : [46.5, 11.9]}
          zoom={waypoints.length > 0 ? 12 : 10}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={false}
          ref={mapRef}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          />
          <RouteDrawerMap 
            waypoints={waypoints} 
            setWaypoints={setWaypoints}
            routeCoordinates={routeCoordinates}
            isEditing={isEditing}
            searchCenter={searchCenter}
          />
        </MapContainer>
        
        {isEditing && (
          <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-2 rounded-lg shadow-lg text-xs md:text-sm font-medium z-[1000]">
            <Move className="w-4 h-4 inline mr-2" />
            Bearbeitungsmodus aktiv
          </div>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button
          variant="outline"
          onClick={handleUndo}
          disabled={waypoints.length === 0 || isEditing}
          size="sm"
        >
          <Undo className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
          <span className="hidden md:inline ml-2">Rückgängig</span>
        </Button>
        <Button
          variant="outline"
          onClick={handleClear}
          disabled={waypoints.length === 0}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
          size="sm"
        >
          <Trash2 className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
          <span className="hidden md:inline ml-2">Löschen</span>
        </Button>
        <Button
          variant="outline"
          onClick={makeLoop}
          disabled={waypoints.length < 2 || isEditing}
          size="sm"
          title="Startpunkt als letzten Wegpunkt hinzufügen (Rundtour)"
        >
          🔄 <span className="hidden md:inline ml-2">Rundtour</span>
        </Button>
        <Button
          onClick={handleSave}
          disabled={waypoints.length < 2 || isCalculating}
          className="bg-slate-800 hover:bg-slate-900 ml-auto"
          size="sm"
        >
          {isCalculating ? (
            <Loader2 className="w-3 h-3 md:w-4 md:h-4 md:mr-2 animate-spin" />
          ) : (
            <Save className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
          )}
          <span className="hidden sm:inline ml-2">Route speichern</span>
          <span className="sm:hidden ml-2">Speichern</span>
        </Button>
      </div>

      {waypoints.length >= 2 && (
        <div className="mt-4">
          <RouteElevationProfile 
            coordinates={routeCoordinates.length > 0 ? routeCoordinates : waypoints} 
            distance={parseFloat(routeDistance)} 
          />
        </div>
      )}
    </div>
  );
}
