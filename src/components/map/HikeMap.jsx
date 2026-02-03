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

// Create paw icon SVG for each season
const createPawIcon = (season) => {
  const config = seasonConfig[season] || seasonConfig.all_year;
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 56" width="36" height="42">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
        </filter>
      </defs>
      <g filter="url(#shadow)">
        <!-- Paw pad main -->
        <ellipse cx="24" cy="32" rx="12" ry="10" fill="${config.color}"/>
        <!-- Toe pads -->
        <ellipse cx="14" cy="20" rx="6" ry="7" fill="${config.color}"/>
        <ellipse cx="24" cy="16" rx="6" ry="7" fill="${config.color}"/>
        <ellipse cx="34" cy="20" rx="6" ry="7" fill="${config.color}"/>
        <!-- Season symbol background -->
        <circle cx="24" cy="28" r="8" fill="white" opacity="0.9"/>
      </g>
      <!-- Season emoji placeholder - text -->
      <text x="24" y="33" text-anchor="middle" font-size="12">${config.emoji}</text>
    </svg>
  `;
  
  return L.divIcon({
    html: svgIcon,
    className: 'paw-marker',
    iconSize: [36, 42],
    iconAnchor: [18, 42],
    popupAnchor: [0, -42]
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