import { TileLayer, Polyline, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { configureLeafletDefaultIcon } from "@/lib/leafletDefaultIcon";
import SafeMapContainer from "@/components/map/SafeMapContainer";
import {
  ROUTE_LINE_COLOR,
  ROUTE_TILE_LAYER,
  getRouteWaypointColor,
  getRouteWaypointLabel,
} from "@/lib/routeMapStyle";


configureLeafletDefaultIcon();

const routeWaypointIcon = (index, total) => L.divIcon({
  html: `<div style="
    background: ${getRouteWaypointColor(index, total)};
    color: ${index === 0 ? '#7C3020' : 'white'};
    width: 28px; height: 28px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 800; border: 3px solid white;
    box-shadow: 0 2px 8px rgba(124,48,32,0.26);">
    ${getRouteWaypointLabel(index, total)}
  </div>`,
  className: "",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});


export default function RoutePreviewMap({ coordinates }) {
  if (!coordinates || coordinates.length < 2) return null;

  const startPoint = coordinates[0];
  const endPoint = coordinates[coordinates.length - 1];
  const center = [
    (startPoint[0] + endPoint[0]) / 2,
    (startPoint[1] + endPoint[1]) / 2,
  ];

  return (
    <div className="doghike-glass-card rounded-xl overflow-hidden">
      <div className="h-64 md:h-80 w-full">
        <SafeMapContainer resetKey={`route-preview-${coordinates.length}-${center.join("-")}`} center={center} zoom={11} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            url={ROUTE_TILE_LAYER.url}
            attribution={ROUTE_TILE_LAYER.attribution}
            maxZoom={ROUTE_TILE_LAYER.maxZoom}
            maxNativeZoom={ROUTE_TILE_LAYER.maxNativeZoom}
          />
          <Polyline positions={coordinates} color={ROUTE_LINE_COLOR} weight={4} />
          <Marker position={startPoint} title="Start" icon={routeWaypointIcon(0, 2)} />
          <Marker position={endPoint} title="Ende" icon={routeWaypointIcon(1, 2)} />
        </SafeMapContainer>
      </div>
    </div>
  );
}
