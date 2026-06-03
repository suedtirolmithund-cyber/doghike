import { useState, useEffect } from "react";
import { TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import LocationIcon, { LOCATION_PIN_SVG_MARKUP } from "@/components/icons/LocationIcon";
import SafeMapContainer from "@/components/map/SafeMapContainer";
import { reverseNominatim } from "@/lib/nominatimApi";

const startPointIcon = L.divIcon({
  html: `
    <div style="
      background: #A8003C;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      color: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      border: 3px solid white;
    ">${LOCATION_PIN_SVG_MARKUP}</div>
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
        const data = await reverseNominatim(lat, lng);
        
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
    <div className="doghike-map-frame relative" style={{ height: "400px" }}>
      <SafeMapContainer
        resetKey={`start-point-${latitude ?? "none"}-${longitude ?? "none"}`}
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
      </SafeMapContainer>
      
      <div className="absolute top-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg z-[1000] pointer-events-none">
        <p className="flex items-center gap-1.5 text-sm text-slate-700">
          <LocationIcon className="h-4 w-4" />
          <span>Klicke auf die Karte, um den Ausgangspunkt zu setzen</span>
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
