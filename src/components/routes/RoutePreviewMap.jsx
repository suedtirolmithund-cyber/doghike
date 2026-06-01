import { TileLayer, Polyline, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { configureLeafletDefaultIcon } from "@/lib/leafletDefaultIcon";
import SafeMapContainer from "@/components/map/SafeMapContainer";


configureLeafletDefaultIcon();


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
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          />
          <Polyline positions={coordinates} color="#A8003C" weight={4} />
          <Marker position={startPoint} title="Start" />
          <Marker position={endPoint} title="Ende" />
        </SafeMapContainer>
      </div>
    </div>
  );
}
