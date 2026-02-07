import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import L from "leaflet";
import "leaflet.markercluster";

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

function MarkerClusterGroup({ hikes }) {
  const map = useMap();
  const markerClusterGroupRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    // Create marker cluster group
    const markerClusterGroup = L.markerClusterGroup({
      maxClusterRadius: 60,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: function(cluster) {
        const count = cluster.getChildCount();
        const size = count < 10 ? 'small' : count < 50 ? 'medium' : 'large';
        return L.divIcon({
          html: `<div class="cluster-icon cluster-${size}"><span>${count}</span></div>`,
          className: 'custom-cluster-icon',
          iconSize: L.point(40, 40)
        });
      }
    });

    // Add markers to cluster group
    hikes.forEach(hike => {
      if (hike.latitude && hike.longitude) {
        const marker = L.marker([hike.latitude, hike.longitude], {
          icon: createPawIcon(hike.season || "all_year")
        });

        const popupContent = `
          <div class="p-1 min-w-[200px]">
            <h3 class="font-semibold text-stone-800 mb-2">${hike.trail_name}</h3>
            ${hike.photos?.[0] ? `<a href="${createPageUrl("HikeDetail")}?id=${hike.id}"><img src="${hike.photos[0]}" alt="${hike.trail_name}" class="w-full h-24 object-cover rounded-lg mb-2 cursor-pointer hover:opacity-90 transition-opacity"/></a>` : ''}
            <p class="text-sm text-stone-500 mb-2">${hike.location || ''}</p>
            <div class="space-y-1 text-xs text-stone-600">
              ${hike.distance_km ? `<div class="flex items-center gap-1"><span class="font-medium">📏</span><span>${hike.distance_km} km</span></div>` : ''}
              ${hike.elevation_gain_m ? `<div class="flex items-center gap-1"><span class="font-medium">⛰️</span><span>${hike.elevation_gain_m} Hm</span></div>` : ''}
              ${hike.duration_minutes ? `<div class="flex items-center gap-1"><span class="font-medium">⏱️</span><span>${(hike.duration_minutes / 60).toFixed(1)} Std</span></div>` : ''}
            </div>
          </div>
        `;
        
        marker.bindPopup(popupContent);
        markerClusterGroup.addLayer(marker);

        // Add route polyline if available
        if (hike.route_coordinates && hike.route_coordinates.length > 1) {
          const polyline = L.polyline(hike.route_coordinates, {
            color: seasonConfig[hike.season || "all_year"].color,
            weight: 4,
            opacity: 0.7
          });
          polyline.addTo(map);
        }
      }
    });

    map.addLayer(markerClusterGroup);
    markerClusterGroupRef.current = markerClusterGroup;

    // Auto-fit bounds to show all markers
    if (hikes.length > 0) {
      const allCoordinates = hikes
        .filter(h => h.latitude && h.longitude)
        .map(h => [h.latitude, h.longitude]);
      
      if (allCoordinates.length > 0) {
        const bounds = L.latLngBounds(allCoordinates);
        const isMobile = window.innerWidth < 768;
        map.fitBounds(bounds, { 
          padding: isMobile ? [30, 30] : [50, 50],
          maxZoom: 12
        });
      }
    }

    return () => {
      if (markerClusterGroupRef.current) {
        map.removeLayer(markerClusterGroupRef.current);
      }
    };
  }, [map, hikes]);

  return null;
}

export default function HikeMap({ hikes, center = [46.41, 11.84], zoom = 10, height = "400px", showLegend = true, useCluster = false }) {
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
        
        {useCluster ? (
          <MarkerClusterGroup hikes={hikesWithCoords} />
        ) : (
          <>
            {hikesWithCoords.map((hike) => (
              <>
                {hike.route_coordinates && hike.route_coordinates.length > 1 && (
                  <Polyline
                    key={`route-${hike.id}`}
                    positions={hike.route_coordinates}
                    color={seasonConfig[hike.season || "all_year"].color}
                    weight={4}
                    opacity={0.7}
                  />
                )}
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
              </>
            ))}
          </>
        )}
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
        
        .custom-cluster-icon {
          background: transparent !important;
          border: none !important;
        }
        
        .cluster-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          color: white;
          font-weight: bold;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          border: 3px solid white;
        }
        
        .cluster-small {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          font-size: 14px;
        }
        
        .cluster-medium {
          width: 50px;
          height: 50px;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          font-size: 16px;
        }
        
        .cluster-large {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          font-size: 18px;
        }
      `}</style>
    </div>
  );
}