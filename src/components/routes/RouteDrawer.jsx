import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Polyline, Marker, useMapEvents } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { Undo, Trash2, Save } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function RouteDrawerMap({ waypoints, setWaypoints }) {
  useMapEvents({
    click: (e) => {
      setWaypoints([...waypoints, [e.latlng.lat, e.latlng.lng]]);
    },
  });

  return (
    <>
      {waypoints.length > 1 && (
        <Polyline positions={waypoints} color="#1e293b" weight={4} />
      )}
      {waypoints.map((point, idx) => (
        <Marker key={idx} position={point} />
      ))}
    </>
  );
}

export default function RouteDrawer({ onSave, initialRoute = [] }) {
  const [waypoints, setWaypoints] = useState(initialRoute);
  const mapRef = useRef();

  const calculateDistance = () => {
    if (waypoints.length < 2) return 0;
    
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
    const distance = calculateDistance();
    onSave({
      coordinates: waypoints,
      distance_km: parseFloat(distance.toFixed(2)),
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-100 rounded-lg p-4 text-sm text-stone-700">
        <p className="font-medium mb-2">📍 So funktioniert's:</p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Klicke auf die Karte, um Wegpunkte zu setzen</li>
          <li>Die Route wird automatisch verbunden</li>
          <li>Nutze die Buttons unten zum Bearbeiten</li>
        </ol>
        {waypoints.length > 0 && (
          <p className="mt-3 font-semibold text-slate-800">
            Wegpunkte: {waypoints.length} • Distanz: {calculateDistance().toFixed(2)} km
          </p>
        )}
      </div>

      <div className="relative h-96 md:h-[500px] rounded-xl overflow-hidden border-2 border-stone-200">
        <MapContainer
          center={[46.5, 11.9]}
          zoom={10}
          style={{ height: "100%", width: "100%" }}
          ref={mapRef}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <RouteDrawerMap waypoints={waypoints} setWaypoints={setWaypoints} />
        </MapContainer>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button
          variant="outline"
          onClick={handleUndo}
          disabled={waypoints.length === 0}
        >
          <Undo className="w-4 h-4 mr-2" />
          Rückgängig
        </Button>
        <Button
          variant="outline"
          onClick={handleClear}
          disabled={waypoints.length === 0}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Löschen
        </Button>
        <Button
          onClick={handleSave}
          disabled={waypoints.length < 2}
          className="bg-slate-800 hover:bg-slate-900 ml-auto"
        >
          <Save className="w-4 h-4 mr-2" />
          Route speichern
        </Button>
      </div>
    </div>
  );
}