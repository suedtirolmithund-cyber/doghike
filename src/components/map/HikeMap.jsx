import { useEffect, useRef } from "react";
import { TileLayer, useMap } from "react-leaflet";
import { createPageUrl } from "@/utils";
import SafeMapContainer from "@/components/map/SafeMapContainer";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import L from "leaflet";
import "leaflet.markercluster";
import { formatDurationHours } from "@/lib/duration";
import { SEASON_COLORS, TOUR_ICONS, getSeasonIcon, getSeasonLabel, normalizeSeasonValues } from "@/lib/difficultyConfig";
import { HIKE_PLACEHOLDER_IMAGE } from "@/lib/fallbackImages";
import { getUniqueHikeImageSources, resolveHikeImageUrl } from "@/lib/hikeImages";

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const rawSeasonConfig = {
  spring: { label: "Frühling" },
  summer: { label: "Sommer" },
  autumn: { label: "Herbst" },
  winter: { label: "Winter" },
  all_year: { label: "Ganzjährig" },
};

const seasonConfig = Object.fromEntries(
  Object.entries(rawSeasonConfig).map(([key, value]) => [
    key,
    { ...value, ...SEASON_COLORS[key] },
  ])
);

const legacyAvailabilityMap = {
  SommerOnly: "summer",
  HerbstEmpfohlen: "autumn",
  WinterEmpfohlen: "winter",
  FruehlingEmpfohlen: "spring",
  YearRound: "all_year",
};

const DEFAULT_COLOR = "#F9C030";

function getCountryLabel(country) {
  if (country === "italy") return "Italien";
  if (country === "austria") return "Österreich";
  if (country === "germany") return "Deutschland";
  if (country === "switzerland") return "Schweiz";
  if (country === "spain") return "Spanien";
  if (country === "croatia") return "Kroatien";
  if (country === "slovenia") return "Slowenien";
  if (country === "other") return "Anderes";
  return country || "";
}

function getSeasonKey(hike) {
  const normalizedSeasons = normalizeSeasonValues(hike?.seasons, hike?.season);
  if (normalizedSeasons[0] && seasonConfig[normalizedSeasons[0]]) {
    return normalizedSeasons[0];
  }

  const legacyKey = legacyAvailabilityMap[hike.availability];
  return legacyKey && seasonConfig[legacyKey] ? legacyKey : null;
}

function getColor(hike) {
  const seasonKey = getSeasonKey(hike);
  return seasonKey ? seasonConfig[seasonKey].color : DEFAULT_COLOR;
}

function createGroupedIcon({ color, photoUrl, count, seasonIcon }) {
  if (photoUrl) {
    const html = `
      <div style="position:relative;width:40px;height:40px;">
        <div style="
          width:40px;
          height:40px;
          border-radius:50%;
          overflow:hidden;
          border:3px solid white;
          box-shadow:0 2px 10px rgba(124,48,32,0.26);
          background:#FDF0E8;
        ">
          <img
            src="${photoUrl}"
            style="width:100%;height:100%;object-fit:cover;"
            onerror="this.parentElement.innerHTML='${TOUR_ICONS.dog}'"
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
            background:#A8003C;
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
        box-shadow:0 2px 8px rgba(124,48,32,0.22);
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
          background:#A8003C;
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

  const markerHtml = seasonIcon ? html.replace("ðŸ¾", seasonIcon) : html;

  return L.divIcon({
    html: markerHtml,
    className: "paw-marker",
    iconSize: [40, 40],
    iconAnchor: [18, 36],
    popupAnchor: [0, -40],
  });
}

function getGroupedHikes(hikes) {
  const groups = new Map();

  hikes.forEach((hike) => {
    const latitude = Number(hike?.latitude);
    const longitude = Number(hike?.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    const key = `${latitude.toFixed(5)}:${longitude.toFixed(5)}`;
    const existingGroup = groups.get(key);

    if (existingGroup) {
      existingGroup.hikes.push(hike);
      return;
    }

    groups.set(key, {
      latitude,
      longitude,
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
  const seasonKey = getSeasonKey(hike);
  const season = seasonKey
    ? {
        ...seasonConfig[seasonKey],
        label: getSeasonLabel(seasonKey) || seasonConfig[seasonKey]?.label || seasonKey,
        icon: getSeasonIcon(seasonKey),
      }
    : null;

  const popupPhotoSource = getUniqueHikeImageSources(
    hike.image,
    Array.isArray(hike.photos) ? hike.photos : [],
    Array.isArray(hike._photo_references) ? hike._photo_references : []
  )[0];
  const popupPhoto = resolveHikeImageUrl(popupPhotoSource, { width: 320, quality: 76 });
  const imageHtml = popupPhoto
    ? `<img src="${escapeHtml(popupPhoto)}" alt="${escapeHtml(hike.trail_name)}"
         class="hike-popup-image" onerror="this.onerror=null;this.src='${escapeHtml(HIKE_PLACEHOLDER_IMAGE)}';" />`
    : `<div style="width:60px;height:60px;border-radius:8px;background:#FDF0E8;color:#A8003C;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">${TOUR_ICONS.dog}</div>`;

  const stats = [
    hike.distance_km ? `${TOUR_ICONS.distance} ${hike.distance_km} km` : null,
    hike.elevation_gain_m ? `${TOUR_ICONS.elevation} ${hike.elevation_gain_m} Hm` : null,
    hike.duration_minutes ? `${TOUR_ICONS.duration} ${formatDurationHours(hike.duration_minutes)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return `
    <a
      href="${createPageUrl("HikeDetail")}?id=${encodeURIComponent(detailId)}&source=${hikeSource}"
      class="hike-popup-card ${isGrouped ? "is-grouped" : ""}"
    >
      <div class="hike-popup-photo">
        ${imageHtml}
        ${season ? `<span class="hike-popup-badge" style="background:${season.background};border-color:${season.color};color:${season.text}">${season.icon} ${season.label}</span>` : ""}
      </div>
      <div class="hike-popup-content">
        <div class="hike-popup-title">${escapeHtml(hike.trail_name)}</div>
        ${hike.location ? `<div class="hike-popup-place">${escapeHtml(hike.location)}</div>` : ""}
        ${hike.country ? `<div class="hike-popup-country">${escapeHtml(getCountryLabel(hike.country))}</div>` : ""}
        ${stats ? `<div class="hike-popup-stats">${stats}</div>` : ""}
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

      const marker = L.marker([group.latitude, group.longitude], {
        icon: createGroupedIcon({
          color: getColor(primaryHike),
          photoUrl: null,
          count: group.hikes.length,
          seasonIcon: group.hikes.length === 1 ? getSeasonIcon(getSeasonKey(primaryHike)) : null,
        }),
      });

      const popupTitle =
        group.hikes.length > 1
          ? `${group.hikes.length} Wanderungen ab diesem Startpunkt`
          : primaryHike.trail_name;

      const popupItems = group.hikes
        .map((hike, index) => buildHikePopupItem(hike, group.hikes.length > 1 && index > 0))
        .join("");

      marker.bindPopup(
        `
          <div class="hike-popup-wrap">
            ${group.hikes.length > 1 ? `<h3 class="hike-popup-group-title">${popupTitle}</h3>` : ""}
            ${popupItems}
          </div>
        `,
        { maxWidth: 340, autoPanPadding: [24, 24] },
      );

      cluster.addLayer(marker);
    });

    map.addLayer(cluster);
    clusterRef.current = cluster;

    const coords = hikes
      .filter((hike) => Number.isFinite(Number(hike?.latitude)) && Number.isFinite(Number(hike?.longitude)))
      .map((hike) => [Number(hike.latitude), Number(hike.longitude)]);

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
  const hikesWithCoords = hikes.filter(
    (hike) => Number.isFinite(Number(hike?.latitude)) && Number.isFinite(Number(hike?.longitude))
  );

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-brand-100/50 shadow-sm"
      style={{ height }}
    >
      <SafeMapContainer
        resetKey={`hike-map-${hikesWithCoords.length}-${center.join("-")}-${zoom}`}
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
      </SafeMapContainer>

      {showLegend && (
        <div className="absolute bottom-3 left-3 z-[1000] flex max-w-[calc(100%-1.5rem)] flex-col gap-1 rounded-xl border border-[#F9C030]/50 bg-white/92 px-3 py-2 text-xs text-[#7C3020] shadow backdrop-blur-sm">
          {Object.entries(seasonConfig).map(([key, { color, label }]) => (
            <div key={key} className="flex items-center gap-2 whitespace-nowrap">
              <span
                style={{
                  background: color,
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  display: "inline-block",
                  border: "2px solid white",
                  boxShadow: "0 1px 3px rgba(124,48,32,0.2)",
                }}
              />
              {label}
            </div>
          ))}
        </div>
      )}

      <style>{`
        .leaflet-popup-content-wrapper {
          border-radius: 20px;
          background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(247,239,232,0.92));
          border: 1px solid rgba(249,192,48,0.42);
          box-shadow: 0 18px 46px rgba(124,48,32,0.18);
          overflow: hidden;
          backdrop-filter: blur(14px);
        }
        .leaflet-popup-content {
          margin: 0;
          width: 300px !important;
        }
        .leaflet-popup-tip {
          background: rgba(247,239,232,0.95);
          border: 1px solid rgba(249,192,48,0.36);
          box-shadow: 0 8px 20px rgba(124,48,32,0.14);
        }
        .hike-popup-wrap {
          min-width: 260px;
          max-width: 300px;
          padding: 0;
        }
        .hike-popup-group-title {
          margin: 0;
          padding: 12px 12px 0;
          color: #7C3020;
          font-size: 13px;
          font-weight: 800;
        }
        .hike-popup-card {
          display: block;
          color: inherit;
          text-decoration: none;
        }
        .hike-popup-card.is-grouped {
          border-top: 1px solid rgba(249,192,48,0.42);
          margin-top: 10px;
        }
        .hike-popup-card.is-grouped:first-of-type {
          border-top: 0;
          margin-top: 0;
        }
        .hike-popup-photo {
          position: relative;
          height: 116px;
          overflow: hidden;
          background: #FDF0E8;
        }
        .hike-popup-image {
          display: block;
          width: 100%;
          height: 116px;
          object-fit: cover;
        }
        .hike-popup-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #C07820;
          font-size: 13px;
          font-weight: 800;
          background: #FDF0E8;
        }
        .hike-popup-badge {
          position: absolute;
          left: 10px;
          bottom: 10px;
          border: 1px solid #F9C030;
          border-radius: 999px;
          padding: 5px 8px;
          font-size: 11px;
          font-weight: 800;
          box-shadow: 0 6px 14px rgba(124,48,32,0.16);
          backdrop-filter: blur(10px);
        }
        .hike-popup-content {
          padding: 12px;
        }
        .hike-popup-title {
          color: #7C3020;
          font-size: 16px;
          font-weight: 800;
          line-height: 1.2;
        }
        .hike-popup-place {
          margin-top: 5px;
          color: #C07820;
          font-size: 12px;
          line-height: 1.25;
        }
        .hike-popup-country {
          margin-top: 3px;
          color: #C07820;
          font-size: 11px;
          line-height: 1.25;
        }
        .hike-popup-stats {
          margin-top: 10px;
          color: #C07820;
          font-size: 12px;
          font-weight: 700;
          line-height: 1.4;
        }
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
          box-shadow: 0 2px 8px rgba(124,48,32,0.24);
          border: 3px solid white;
        }
        .cluster-small { width: 40px; height: 40px; background: linear-gradient(135deg, #F9C030, #F07030); color: #7C3020; font-size: 14px; }
        .cluster-medium { width: 50px; height: 50px; background: linear-gradient(135deg, #F07030, #D4547A); font-size: 16px; }
        .cluster-large { width: 60px; height: 60px; background: linear-gradient(135deg, #A8003C, #7C3020); font-size: 18px; }
      `}</style>
    </div>
  );
}
