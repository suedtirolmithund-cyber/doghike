import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import L from "leaflet";
import "leaflet.markercluster";

// Availability → color mapping
const availabilityConfig = {
  SommerOnly:        { color: "#d64545", label: "Nur Sommer" },
  HerbstEmpfohlen:   { color: "#f19a4b", label: "Herbst empfohlen" },
  WinterEmpfohlen:   { color: "#5b83f0", label: "Winter empfohlen" },
  FruehlingEmpfohlen:{ color: "#ec9cf4", label: "Frühling empfohlen" },
  YearRound:         { color: "#38a062", label: "Ganzjährig" },
};

const DEFAULT_COLOR = "#38a062";

function getColor(hike) {
  if (hike.availability && availabilityConfig[hike.availability]) {
    return availabilityConfig[hike.availability].color;
  }
  return DEFAULT_COLOR;
}

function createPawIcon(color) {
  const html = `
    <div style="
      background: ${color};
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      border: 3px solid white;
    ">🐾</div>
  `;
  return L.divIcon({
    html,
    className: "paw-marker",
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -40],
  });
}

// Photo marker for journal hikes: shows dog photo, user avatar, or falls back to paw
function createPhotoIcon(photoUrl) {
  const html = `
    <div style="
      width: 40px;
      height: 40px;
      border-radius: 50%;
      overflow: hidden;
      border: 3px solid white;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      background: #e7e5e4;
    ">
      <img
        src="${photoUrl}"
        style="width:100%;height:100%;object-fit:cover;"
        onerror="this.parentElement.innerHTML='🐕'"
      />
    </div>
  `;
  return L.divIcon({
    html,
    className: "photo-marker",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -44],
  });
}

function MarkersLayer({ hikes }) {
  const map = useMap();
  const clusterRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    const cluster = L.markerClusterGroup({
      maxClusterRadius: 60,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction(c) {
        const count = c.getChildCount();
        const size = count < 10 ? "small" : count < 50 ? "medium" : "large";
        return L.divIcon({
          html: `<div class="cluster-icon cluster-${size}"><span>${count}</span></div>`,
          className: "custom-cluster-icon",
          iconSize: L.point(40, 40),
        });
      },
    });

    hikes.forEach((hike) => {
      if (!hike.latitude || !hike.longitude) return;

      const color = getColor(hike);
      // Journal hikes: show dog photo → user avatar → paw fallback
      const photoUrl = hike._source === "journal"
        ? (hike.dog_photo_url || hike.author_avatar)
        : null;
      const marker = L.marker([hike.latitude, hike.longitude], {
        icon: photoUrl ? createPhotoIcon(photoUrl) : createPawIcon(color),
      });

      const imgHtml = hike.photos?.[0]
        ? `<a href="${createPageUrl("HikeDetail")}?id=${hike.id}">
             <img src="${hike.photos[0]}" alt="${hike.trail_name}"
               style="width:100%;height:80px;object-fit:cover;border-radius:8px;margin-bottom:6px;display:block;cursor:pointer"/>
           </a>`
        : "";

      const distHtml = hike.distance_km
        ? `<div style="display:flex;align-items:center;gap:4px"><span>📏</span><span>${hike.distance_km} km</span></div>`
        : "";
      const ascentHtml = hike.elevation_gain_m
        ? `<div style="display:flex;align-items:center;gap:4px"><span>⛰️</span><span>${hike.elevation_gain_m} Hm</span></div>`
        : "";
      const durHtml = hike.duration_minutes
        ? `<div style="display:flex;align-items:center;gap:4px"><span>⏱️</span><span>${(hike.duration_minutes / 60).toFixed(1)} Std</span></div>`
        : "";

      const popup = `
        <div style="min-width:200px;padding:4px">
          <h3 style="font-weight:600;color:#1c1917;margin:0 0 8px">${hike.trail_name}</h3>
          ${imgHtml}
          <p style="font-size:13px;color:#78716c;margin:0 0 6px">${hike.location || ""}</p>
          <div style="font-size:12px;color:#57534e;display:flex;flex-direction:column;gap:3px">
            ${distHtml}${ascentHtml}${durHtml}
          </div>
        </div>
      `;

      marker.bindPopup(popup);
      cluster.addLayer(marker);
    });

    map.addLayer(cluster);
    clusterRef.current = cluster;

    // Fit bounds to all markers
    const coords = hikes
      .filter((h) => h.latitude && h.longitude)
      .map((h) => [h.latitude, h.longitude]);

    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      const isMobile = window.innerWidth < 768;
      map.fitBounds(bounds, {
        padding: isMobile ? [30, 30] : [50, 50],
        maxZoom: 12,
      });
    }

    return () => {
      if (clusterRef.current) {
        map.removeLayer(clusterRef.current);
      }
    };
  }, [map, hikes]);

  return null;
}

export default function HikeMap({
  hikes,
  center = [46.41, 11.84],
  zoom = 10,
  height = "400px",
  showLegend = true,
}) {
  const hikesWithCoords = hikes.filter((h) => h.latitude && h.longitude);

  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-stone-200/50 shadow-sm"
      style={{ height }}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
        />
        <MarkersLayer hikes={hikesWithCoords} />
      </MapContainer>

      {showLegend && (
        <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow border border-stone-200/60 hidden md:flex flex-col gap-1 text-xs text-stone-700">
          {Object.entries(availabilityConfig).map(([key, { color, label }]) => (
            <div key={key} className="flex items-center gap-2">
              <span
                style={{
                  background: color,
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  display: "inline-block",
                  border: "2px solid white",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }}
              />
              {label}
            </div>
          ))}
        </div>
      )}

      <style>{`
        .paw-marker, .photo-marker {
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
        .cluster-small  { width:40px; height:40px; background:linear-gradient(135deg,#3b82f6,#2563eb); font-size:14px; }
        .cluster-medium { width:50px; height:50px; background:linear-gradient(135deg,#f59e0b,#d97706); font-size:16px; }
        .cluster-large  { width:60px; height:60px; background:linear-gradient(135deg,#ef4444,#dc2626); font-size:18px; }
      `}</style>
    </div>
  );
}
