import { MapContainer, TileLayer, Polyline, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
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
    <div className="bg-white rounded-xl border border-stone-200/50 overflow-hidden">
      <div className="h-64 md:h-80 w-full">
        <MapContainer center={center} zoom={11} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          />
          <Polyline positions={coordinates} color="#1e293b" weight={4} />
          <Marker position={startPoint} title="Start" />
          <Marker position={endPoint} title="Ende" />
        </MapContainer>
      </div>
    </div>
  );
}