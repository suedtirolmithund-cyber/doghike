import { MapContainer, TileLayer, Polyline, useMapEvents, Marker } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { Trash2, Undo } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom marker icon for route points
const createPointIcon = (isStart = false) => {
  const color = isStart ? "#22c55e" : "#3b82f6";
  const html = `
    <div style="
      background: ${color};
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>
  `;
  
  return L.divIcon({
    html: html,
    className: 'route-point-marker',
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });
};

function MapClickHandler({ coordinates, onChange }) {
  useMapEvents({
    click(e) {
      const newCoords = [...coordinates, [e.latlng.lat, e.latlng.lng]];
      onChange(newCoords);
    }
  });
  return null;
}

export default function RouteEditor({ coordinates = [], startPoint = null, onChange }) {
  const center = startPoint || [46.41, 11.84];
  
  const handleUndo = () => {
    if (coordinates.length > 0) {
      onChange(coordinates.slice(0, -1));
    }
  };

  const handleClear = () => {
    onChange([]);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleUndo}
          disabled={coordinates.length === 0}
        >
          <Undo className="w-4 h-4 mr-2" />
          Letzten Punkt entfernen
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClear}
          disabled={coordinates.length === 0}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Alle löschen
        </Button>
      </div>

      <div className="rounded-2xl overflow-hidden border border-sky-200 shadow-sm" style={{ height: "400px" }}>
        <MapContainer
          center={center}
          zoom={12}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
          />
          
          <MapClickHandler coordinates={coordinates} onChange={onChange} />
          
          {coordinates.length > 0 && (
            <>
              <Polyline
                positions={coordinates}
                color="#ef4444"
                weight={4}
                opacity={0.8}
              />
              {coordinates.map((coord, idx) => (
                <Marker
                  key={idx}
                  position={coord}
                  icon={createPointIcon(idx === 0)}
                />
              ))}
            </>
          )}
        </MapContainer>
      </div>

      <p className="text-sm text-slate-500">
        💡 Tipp: Klicken Sie auf die Karte, um Punkte der Route hinzuzufügen. 
        {coordinates.length > 0 && ` (${coordinates.length} Punkt${coordinates.length !== 1 ? 'e' : ''})`}
      </p>

      <style>{`
        .route-point-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
}