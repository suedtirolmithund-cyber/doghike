import { useEffect, useState } from "react";
import { TileLayer, Polyline, Marker, useMapEvents } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { Undo, Trash2, Save, Loader2 } from "lucide-react";
import RouteElevationProfile from "./RouteElevationProfile";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { configureLeafletDefaultIcon } from "@/lib/leafletDefaultIcon";
import { TOUR_ICONS } from "@/lib/difficultyConfig";
import LocationIcon from "@/components/icons/LocationIcon";
import SafeMapContainer from "@/components/map/SafeMapContainer";
import {
  ROUTE_LINE_COLOR,
  ROUTE_TILE_LAYER,
  getRouteWaypointColor,
  getRouteWaypointLabel,
} from "@/lib/routeMapStyle";


configureLeafletDefaultIcon();

const routeWaypointIcon = (index, total) => L.divIcon({
  html: `<div style="
    background: ${getRouteWaypointColor(index, total)};
    color: ${index === 0 ? '#7C3020' : 'white'};
    width: 28px; height: 28px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 800; border: 3px solid white;
    box-shadow: 0 2px 8px rgba(124,48,32,0.26);">
    ${getRouteWaypointLabel(index, total)}
  </div>`,
  className: "",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});


function RouteDrawerMap({ waypoints, setWaypoints, routeCoordinates }) {
  useMapEvents({
    click: (e) => {
      setWaypoints([...waypoints, [e.latlng.lat, e.latlng.lng]]);
    },
  });

  return (
    <>
      {routeCoordinates.length > 1 && (
        <Polyline positions={routeCoordinates} color={ROUTE_LINE_COLOR} weight={4} />
      )}
      {waypoints.map((point, idx) => (
        <Marker key={idx} position={point} icon={routeWaypointIcon(idx, waypoints.length)} />
      ))}
    </>
  );
}

export default function RouteDrawer({ onSave, initialRoute = [] }) {
  const [waypoints, setWaypoints] = useState(initialRoute);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [routeDistance, setRouteDistance] = useState(0);

  // Fetch route from OSRM API
  const fetchRoute = async (points) => {
    if (points.length < 2) {
      setRouteCoordinates(points);
      setRouteDistance(0);
      return;
    }

    setIsCalculating(true);
    try {
      const coords = points.map(p => `${p[1]},${p[0]}`).join(';');
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/foot/${coords}?overview=full&geometries=geojson`
      );
      const data = await response.json();
      
      if (data.code === 'Ok' && data.routes && data.routes[0]) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates.map(c => [c[1], c[0]]);
        setRouteCoordinates(coordinates);
        setRouteDistance((route.distance / 1000).toFixed(2));
      } else {
        // Fallback to straight lines
        setRouteCoordinates(points);
        setRouteDistance(calculateDistance(points));
      }
    } catch (error) {
      console.error('Routing error:', error);
      // Fallback to straight lines
      setRouteCoordinates(points);
      setRouteDistance(calculateDistance(points));
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => {
    fetchRoute(waypoints);
  }, [waypoints]);

  const calculateDistance = (points) => {
    if (points.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      const [lat1, lon1] = waypoints[i];
      const [lat2, lon2] = waypoints[i + 1];
      
      const R = 6371; // Earth's radius in km
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

  const handleUndo = () => {
    setWaypoints(waypoints.slice(0, -1));
  };

  const handleClear = () => {
    setWaypoints([]);
  };

  const handleSave = () => {
    onSave({
      coordinates: routeCoordinates.length > 0 ? routeCoordinates : waypoints,
      distance_km: parseFloat(routeDistance),
    });
  };

  return (
    <div className="space-y-3 md:space-y-4">
        <div className="doghike-soft-panel p-3 md:p-4 text-xs md:text-sm text-slate-700">
        <p className="mb-2 flex items-center gap-1.5 font-medium">
          <LocationIcon className="h-3.5 w-3.5 md:h-4 md:w-4" />
          So funktioniert's:
        </p>
        <ol className="list-decimal pl-4 md:pl-5 space-y-1">
          <li>Klicke auf die Karte, um Wegpunkte zu setzen</li>
          <li>Die Route folgt automatisch Wanderwegen</li>
          <li>Nutze die Buttons unten zum Bearbeiten</li>
        </ol>
        {isCalculating && (
        <div className="mt-3 flex items-center gap-2 text-brand-600 text-xs md:text-sm">
            <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
            <span>Route wird berechnet...</span>
          </div>
        )}
        {waypoints.length > 0 && !isCalculating && (
        <p className="mt-3 font-semibold text-slate-900 text-xs md:text-sm">
            Wegpunkte: {waypoints.length} • Distanz: {routeDistance} km
          </p>
        )}
      </div>

      <div className="doghike-map-frame relative h-64 md:h-96 lg:h-[500px]">
        <SafeMapContainer
          resetKey={`route-drawer-${waypoints.length}-${routeCoordinates.length}`}
          center={[46.5, 11.9]}
          zoom={10}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url={ROUTE_TILE_LAYER.url}
            attribution={ROUTE_TILE_LAYER.attribution}
            maxZoom={ROUTE_TILE_LAYER.maxZoom}
            maxNativeZoom={ROUTE_TILE_LAYER.maxNativeZoom}
          />
          <RouteDrawerMap 
            waypoints={waypoints} 
            setWaypoints={setWaypoints}
            routeCoordinates={routeCoordinates}
          />
        </SafeMapContainer>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button
          variant="outline"
          onClick={handleUndo}
          disabled={waypoints.length === 0}
          size="sm"
        >
          <Undo className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
          <span className="hidden md:inline ml-2">Rückgängig</span>
        </Button>
        <Button
          variant="outline"
          onClick={handleClear}
          disabled={waypoints.length === 0}
          className="text-brand-400 hover:bg-brand-600 hover:text-white"
          size="sm"
        >
          <Trash2 className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
          <span className="hidden md:inline ml-2">Löschen</span>
        </Button>
        <Button
          onClick={handleSave}
          disabled={waypoints.length < 2 || isCalculating}
            className="bg-brand-400 hover:bg-brand-600 ml-auto"
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

      {/* Elevation Profile Preview */}
      {waypoints.length >= 2 && (
        <div className="mt-4">
          <RouteElevationProfile coordinates={routeCoordinates.length > 0 ? routeCoordinates : waypoints} distance={parseFloat(routeDistance)} />
        </div>
      )}
    </div>
  );
}
