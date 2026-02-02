import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { format } from "date-fns";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const customIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function HikeMap({ hikes, center = [46.41, 11.84], zoom = 10, height = "400px" }) {
  const hikesWithCoords = hikes.filter(h => h.latitude && h.longitude);

  return (
    <div className="rounded-2xl overflow-hidden border border-stone-200/50 shadow-sm" style={{ height }}>
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
            icon={customIcon}
          >
            <Popup>
              <div className="p-1">
                <h3 className="font-semibold text-stone-800">{hike.trail_name}</h3>
                <p className="text-sm text-stone-500">{hike.location}</p>
                {hike.date && (
                  <p className="text-xs text-stone-400 mt-1">
                    {format(new Date(hike.date), "MMM d, yyyy")}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}