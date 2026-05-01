import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { createPageUrl } from "@/utils";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import L from "leaflet";
import "leaflet.markercluster";

const seasonConfig = {
  spring: { color: "#ec9cf4", label: "Fruehling" },
  summer: { color: "#d64545", label: "Sommer" },
  autumn: { color: "#f19a4b", label: "Herbst" },
  winter: { color: "#5b83f0", label: "Winter" },
  all_year: { color: "#38a062", label: "Ganzjaehrig" },
};

const legacyAvailabilityMap = {
  SommerOnly: "summer",
  HerbstEmpfohlen: "autumn",
  WinterEmpfohlen: "winter",
  FruehlingEmpfohlen: "spring",
  YearRound: "all_year",
};

const DEFAULT_COLOR = "#38a062";

function getCountryLabel(country) {
  if (country === "italy") return "Italien";
  if (country === "austria") return "Oesterreich";
  if (country === "germany") return "Deutschland";
  if (country === "switzerland") return "Schweiz";
  if (country === "other") return "Anderes";
  return country || "";
}

function getSeasonKey(hike) {
  if (hike.season && seasonConfig[hike.season]) {
    return hike.season;
  }

  const legacyKey = legacyAvailabilityMap[hike.availability];
  return legacyKey && seasonConfig[legacyKey] ? legacyKey : null;
}

function getColor(hike) {
  const seasonKey = getSeasonKey(hike);
  return seasonKey ? seasonConfig[seasonKey].color : DEFAULT_COLOR;
}

function createGroupedIcon({ color, photoUrl, count }) {
  if (photoUrl) {
    const html = `
      <div style="position:relative;width:40px;height:40px;">
        <div style="
          width:40px;
          height:40px;
          border-radius:50%;
          overflow:hidden;
          border:3px solid white;
          box-shadow:0 2px 10px rgba(0,0,0,0.3);
          background:#e7e5e4;
        ">
          <img
            src="${photoUrl}"
            style="width:100%;height:100%;object-fit:cover;"
            onerror="this.parentElement.innerHTML='🐕'"
          />
        </div>
        ${count > 1 ? `
          <div style="
            position:absolute;
            right:-4px;
            top:-4px;
            min-width:20px;
            height:20px;
            border-radius:999px;
            background:#1e293b;
            color:white;
            font-size:11px;
            font-weight:700;
            display:flex;
            align-items:center;
            justify-content:center;
            padding:0 4px;
            border:2px solid white;
            box-shadow:0 2px 6px rgba(0,0,0,0.25);
          ">${count}</div>
        ` : ""}
      </div>
    `;

    return L.divIcon({
      html,
      className: "photo-marker",
      iconSize: [44, 44],
      iconAnchor: [20, 40],
      popupAnchor: [0, -44],
    });
  }

  const html = `
    <div style="position:relative;width:36px;height:36px;">
      <div style="
        background:${color};
        width:36px;
        height:36px;
        border-radius:50%;
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:20px;
        box-shadow:0 2px 8px rgba(0,0,0,0.25);
        border:3px solid white;
      ">🐾</div>
      ${count > 1 ? `
        <div style="
          position:absolute;
          right:-4px;
          top:-4px;
          min-width:20px;
          height:20px;
          border-radius:999px;
          background:#1e293b;
          color:white;
          font-size:11px;
          font-weight:700;
          display:flex;
          align-items:center;
          justify-content:center;
          padding:0 4px;
          border:2px solid white;
          box-shadow:0 2px 6px rgba(0,0,0,0.25);
        ">${count}</div>
      ` : ""}
    </div>
  `;

  return L.divIcon({
    html,
    className: "paw-marker",
    iconSize: [40, 40],
    iconAnchor: [18, 36],
    popupAnchor: [0, -40],
  });
}

function getGroupedHikes(hikes) {
  const groups = new Map();

  hikes.forEach((hike) => {
    if (!hike.latitude || !hike.longitude) return;

    const key = `${Number(hike.latitude).toFixed(5)}:${Number(hike.longitude).toFixed(5)}`;
    const existingGroup = groups.get(key);

    if (existingGroup) {
      existingGroup.hikes.push(hike);
      return;
    }

    groups.set(key, {
      latitude: Number(hike.latitude),
      longitude: Number(hike.longitude),
      hikes: [hike],
    });
  });

  return Array.from(groups.values());
}

function buildHikePopupItem(hike, isGrouped) {
  const hikeSource = hike._source ?? "sheets";
  const detailId =
    hikeSource === "sheets" && hike._public_hike_id
      ? hike.route_id || String(hike._public_hike_id)
      : hike.id;

  const imageHtml = hike.photos?.[0]
    ? `<img src="${hike.photos[0]}" alt="${hike.trail_name}"
         style="width:60px;height:60px;object-fit:cover;border-radius:8px;flex-shrink:0" />`
    : `<div style="width:60px;height:60px;border-radius:8px;background:#f5f5f4;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">🐾</div>`;

  const stats = [
    hike.distance_km ? `📏 ${hike.distance_km} km` : null,
    hike.elevation_gain_m ? `⛰️ ${hike.elevation_gain_m} Hm` : null,
    hike.duration_minutes ? `⏱️ ${(hike.duration_minutes / 60).toFixed(1)} Std` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return `
    <a
      href="${createPageUrl("HikeDetail")}?id=${encodeURIComponent(detailId)}&source=${hikeSource}"
      style="display:flex;gap:10px;text-decoration:none;padding:${isGrouped ? "8px 0" : "0"};color:inherit;${isGrouped ? "border-top:1px solid #e7e5e4;" : ""}"
    >
      ${imageHtml}
      <div style="min-width:0">
        <div style="font-weight:600;color:#1c1917;margin:0 0 4px">${hike.trail_name}</div>
        ${hike.location ? `<div style="font-size:13px;color:#78716c;margin:0 0 4px">${hike.location}</div>` : ""}
        ${hike.country ? `<div style="font-size:12px;color:#57534e;margin:0 0 4px">Land: ${getCountryLabel(hike.country)}</div>` : ""}
        ${stats ? `<div style="font-size:12px;color:#57534e">${stats}</div>` : ""}
      </div>
    </a>
  `;
}

function MarkersLayer({ hikes }) {
  const map = useMap();
  const clusterRef = useRef(null);

  useEffect(() => {
    if (!map) return undefined;

    const cluster = L.markerClusterGroup({
      maxClusterRadius: 60,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction(createdCluster) {
        const count = createdCluster.getChildCount();
        const size = count < 10 ? "small" : count < 50 ? "medium" : "large";
        return L.divIcon({
          html: `<div class="cluster-icon cluster-${size}"><span>${count}</span></div>`,
          className: "custom-cluster-icon",
          iconSize: L.point(40, 40),
        });
      },
    });

    const groupedHikes = getGroupedHikes(hikes);

    groupedHikes.forEach((group) => {
      const primaryHike = group.hikes[0];
      const photoUrl =
        primaryHike._source === "journal"
          ? primaryHike.dog_photo_url || primaryHike.author_avatar
          : null;

      const marker = L.marker([group.latitude, group.longitude], {
        icon: createGroupedIcon({
          color: getColor(primaryHike),
          photoUrl,
          count: group.hikes.length,
        }),
      });

      const popupTitle =
        group.hikes.length > 1
          ? `${group.hikes.length} Touren ab diesem Startpunkt`
          : primaryHike.trail_name;

      const popupItems = group.hikes
        .map((hike, index) => buildHikePopupItem(hike, group.hikes.length > 1 && index > 0))
        .join("");

      marker.bindPopup(
        `
          <div style="min-width:240px;padding:4px">
            <h3 style="font-weight:600;color:#1c1917;margin:0 0 8px">${popupTitle}</h3>
            ${popupItems}
          </div>
        `,
        { maxWidth: 320 },
      );

      cluster.addLayer(marker);
    });

    map.addLayer(cluster);
    clusterRef.current = cluster;

    const coords = hikes
      .filter((hike) => hike.latitude && hike.longitude)
      .map((hike) => [hike.latitude, hike.longitude]);

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
  }, [hikes, map]);

  return null;
}

export default function HikeMap({
  hikes,
  center = [46.41, 11.84],
  zoom = 10,
  height = "400px",
  showLegend = true,
}) {
  const hikesWithCoords = hikes.filter((hike) => hike.latitude && hike.longitude);

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-stone-200/50 shadow-sm"
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
        <div className="absolute bottom-3 left-3 z-[1000] hidden flex-col gap-1 rounded-xl border border-stone-200/60 bg-white/90 px-3 py-2 text-xs text-stone-700 shadow backdrop-blur-sm md:flex">
          {Object.entries(seasonConfig).map(([key, { color, label }]) => (
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
        .cluster-small { width: 40px; height: 40px; background: linear-gradient(135deg, #3b82f6, #2563eb); font-size: 14px; }
        .cluster-medium { width: 50px; height: 50px; background: linear-gradient(135deg, #f59e0b, #d97706); font-size: 16px; }
        .cluster-large { width: 60px; height: 60px; background: linear-gradient(135deg, #ef4444, #dc2626); font-size: 18px; }
      `}</style>
    </div>
  );
}
