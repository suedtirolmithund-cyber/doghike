import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom start marker
const startIcon = L.divIcon({
  html: `<div style="
    background: #10b981;
    color: white;
    width: 36px;
    height: 36px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  "><span style="transform: rotate(45deg); font-size: 18px; font-weight: bold;">S</span></div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

function MapController({ center, routeCoordinates }) {
  const map = useMap();

  useEffect(() => {
    if (routeCoordinates && routeCoordinates.length > 1) {
      const bounds = L.latLngBounds(routeCoordinates);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (center) {
      map.setView(center, 13);
    }
  }, [center, routeCoordinates, map]);

  return null;
}

export default function InteractiveHikeMap({ latitude, longitude, routeCoordinates, trailName, location }) {
  if (!latitude || !longitude) {
    return (
      <div className="bg-stone-100 rounded-2xl p-8 text-center border border-stone-200">
        <p className="text-stone-500">Keine Karteninformationen verfügbar</p>
      </div>
    );
  }

  const center = [latitude, longitude];
  const hasRoute = routeCoordinates && routeCoordinates.length > 1;

  return (
    <div className="relative h-96 md:h-[500px] rounded-2xl overflow-hidden border-2 border-stone-200 shadow-lg">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        />
        
        <MapController center={center} routeCoordinates={routeCoordinates} />
        
        {/* Start marker */}
        <Marker position={center} icon={startIcon}>
          <Popup>
            <div className="text-center">
              <p className="font-semibold text-green-700">Ausgangspunkt</p>
              <p className="text-sm text-stone-600">{trailName}</p>
              {location && <p className="text-xs text-stone-500 mt-1">{location}</p>}
            </div>
          </Popup>
        </Marker>
        
        {/* Route line */}
        {hasRoute && (
          <Polyline
            positions={routeCoordinates}
            color="#1e293b"
            weight={4}
            opacity={0.8}
          />
        )}
      </MapContainer>
      
      {hasRoute && (
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md z-[1000]">
          <p className="text-xs font-medium text-stone-700">
            📍 {routeCoordinates.length} Wegpunkte
          </p>
        </div>
      )}
    </div>
  );
}