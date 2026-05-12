import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const startIcon = L.divIcon({
  html: `<div style="
    background: #A8003C;
    color: white;
    width: 38px;
    height: 38px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 3px solid white;
    box-shadow: 0 10px 24px rgba(74,42,28,0.28);
  "><span style="transform: rotate(45deg); font-size: 17px; font-weight: 800;">S</span></div>`,
  className: "",
  iconSize: [38, 38],
  iconAnchor: [19, 38],
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

export default function InteractiveHikeMap({
  latitude,
  longitude,
  routeCoordinates,
  trailName,
  location,
  stats = [],
}) {
  if (!latitude || !longitude) {
    return (
      <div className="rounded-2xl border border-brand-100 bg-brand-100/80 p-8 text-center">
        <p className="text-slate-500">Keine Karteninformationen verfügbar</p>
      </div>
    );
  }

  const center = [latitude, longitude];
  const hasRoute = routeCoordinates && routeCoordinates.length > 1;

  return (
    <div className="doghike-glass-card overflow-hidden rounded-2xl p-2 shadow-sm">
      <div className="relative h-[360px] overflow-hidden rounded-xl border border-white/70 shadow-sm md:h-[500px]">
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

          <Marker position={center} icon={startIcon}>
            <Popup>
              <div className="text-center">
                <p className="font-semibold text-[#A8003C]">Ausgangspunkt</p>
                <p className="text-sm text-slate-600">{trailName}</p>
                {location && <p className="mt-1 text-xs text-slate-500">{location}</p>}
              </div>
            </Popup>
          </Marker>

          {hasRoute && (
            <Polyline
              positions={routeCoordinates}
              color="#A8003C"
              weight={5}
              opacity={0.82}
            />
          )}
        </MapContainer>

        {hasRoute && (
          <div className="absolute right-3 top-3 z-[1000] rounded-xl border border-white/70 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-md">
            <p className="text-xs font-medium text-slate-700">{routeCoordinates.length} Wegpunkte</p>
          </div>
        )}
      </div>

      {stats.length > 0 && (
      <div className="px-1 pb-1 pt-3">
        <div className="flex flex-wrap gap-2">
          {stats.map((item) => (
            <span
              key={item.label}
              className="inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50/70 px-3 py-1.5 text-xs font-medium text-slate-700"
            >
              <span className="text-sm leading-none">{item.icon}</span>
              {item.value}
            </span>
          ))}
        </div>
      </div>
      )}
    </div>
  );
}
