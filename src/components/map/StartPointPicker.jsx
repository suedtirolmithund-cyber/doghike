import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const startPointIcon = L.divIcon({
  html: `
    <div style="
      background: #1e293b;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      border: 3px solid white;
    ">📍</div>
  `,
  className: 'start-point-marker',
  iconSize: [36, 36],
  iconAnchor: [18, 36]
});

function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      
      // Reverse geocoding to get location name
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
        );
        const data = await response.json();
        
        const locationName = data.address?.village || 
                           data.address?.town || 
                           data.address?.city || 
                           data.address?.municipality ||
                           data.address?.county ||
                           data.display_name?.split(',').slice(0, 2).join(',') ||
                           "Dolomiten";
        
        onLocationSelect({
          latitude: lat,
          longitude: lng,
          location: locationName
        });
      } catch (error) {
        console.error("Geocoding error:", error);
        onLocationSelect({
          latitude: lat,
          longitude: lng,
          location: ""
        });
      }
    }
  });
  return null;
}

export default function StartPointPicker({ latitude, longitude, onSelect }) {
  const [position, setPosition] = useState(
    latitude && longitude ? [latitude, longitude] : [46.41, 11.84]
  );

  useEffect(() => {
    if (latitude && longitude) {
      setPosition([latitude, longitude]);
    }
  }, [latitude, longitude]);

  const handleLocationSelect = (data) => {
    setPosition([data.latitude, data.longitude]);
    onSelect(data);
  };

  return (
    <div className="relative rounded-xl overflow-hidden border border-brand-100" style={{ height: "400px" }}>
      <MapContainer
        center={position}
        zoom={10}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
        />
        <MapClickHandler onLocationSelect={handleLocationSelect} />
        {latitude && longitude && (
          <Marker position={[latitude, longitude]} icon={startPointIcon} />
        )}
      </MapContainer>
      
      <div className="absolute top-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg z-[1000] pointer-events-none">
        <p className="text-sm text-slate-700">
          📍 Klicke auf die Karte, um den Ausgangspunkt zu setzen
        </p>
      </div>

      <style>{`
        .start-point-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
}