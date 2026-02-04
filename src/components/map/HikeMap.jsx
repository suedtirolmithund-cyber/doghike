import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Season colors and icons
const seasonConfig = {
  spring: { color: "#ec4899", emoji: "🌸", label: "Frühling" },
  summer: { color: "#22c55e", emoji: "☀️", label: "Sommer" },
  autumn: { color: "#f97316", emoji: "🍂", label: "Herbst" },
  winter: { color: "#3b82f6", emoji: "❄️", label: "Winter" },
  all_year: { color: "#22c55e", emoji: "🍃", label: "Ganzjährig" }
};

// Create paw emoji icon with colored background
const createPawIcon = (season) => {
  const config = seasonConfig[season] || seasonConfig.all_year;
  const html = `
    <div style="
      background: ${config.color};
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      border: 3px solid white;
    ">🐾</div>
  `;
  
  return L.divIcon({
    html: html,
    className: 'paw-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
  });
};

export default function HikeMap({ hikes, center = [46.41, 11.84], zoom = 10, height = "400px", showLegend = true }) {
  const hikesWithCoords = hikes.filter(h => h.latitude && h.longitude);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-stone-200/50 shadow-sm" style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {hikesWithCoords.map((hike) => (
          <Marker
            key={hike.id}
            position={[hike.latitude, hike.longitude]}
            icon={createPawIcon(hike.season || "all_year")}
          >
            <Popup>
              <div className="p-1 min-w-[200px]">
                <h3 className="font-semibold text-stone-800 mb-2">{hike.trail_name}</h3>

                {hike.photos?.[0] && (
                  <Link to={createPageUrl("HikeDetail") + `?id=${hike.id}`}>
                    <img 
                      src={hike.photos[0]} 
                      alt={hike.trail_name}
                      className="w-full h-24 object-cover rounded-lg mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                    />
                  </Link>
                )}

                <p className="text-sm text-stone-500 mb-2">{hike.location}</p>

                <div className="space-y-1 text-xs text-stone-600">
                  {hike.distance_km && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium">📏</span>
                      <span>{hike.distance_km} km</span>
                    </div>
                  )}
                  {hike.elevation_gain_m && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium">⛰️</span>
                      <span>{hike.elevation_gain_m} Hm</span>
                    </div>
                  )}
                  {hike.duration_minutes && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium">⏱️</span>
                      <span>{(hike.duration_minutes / 60).toFixed(1)} Std</span>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Legend */}
      {showLegend && (
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg z-[1000]">
          <p className="text-xs font-medium text-stone-700 mb-2">Beste Jahreszeit:</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-4 h-4 rounded-full bg-pink-500"></span>
              <span>🌸 Frühling</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-4 h-4 rounded-full bg-green-500"></span>
              <span>🍃 Ganzjährig</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-4 h-4 rounded-full bg-orange-500"></span>
              <span>🍂 Herbst</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-4 h-4 rounded-full bg-blue-500"></span>
              <span>❄️ Winter</span>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        .paw-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
}