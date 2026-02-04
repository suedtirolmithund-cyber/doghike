import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { format } from "date-fns";
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
              <div className="p-1 min-w-[150px]">
                <h3 className="font-semibold text-stone-800">{hike.trail_name}</h3>
                <p className="text-sm text-stone-500">{hike.location}</p>
                <div className="flex items-center gap-1 mt-1 text-xs">
                  <span>{seasonConfig[hike.season || "all_year"].emoji}</span>
                  <span className="text-stone-600">{seasonConfig[hike.season || "all_year"].label}</span>
                </div>
                {hike.distance_km && (
                  <p className="text-xs text-stone-400 mt-1">
                    {hike.distance_km} km • {hike.elevation_gain_m} Hm
                  </p>
                )}
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