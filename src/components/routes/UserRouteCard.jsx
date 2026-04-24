import { MapContainer, TileLayer, Polyline } from "react-leaflet";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Map, Navigation, Clock, Route, Eye, Trash2, Edit } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import "leaflet/dist/leaflet.css";

export default function UserRouteCard({ route, index, onDelete }) {
  const routeIcon = route.route_type === "recorded" ? Navigation : Map;
  const RouteIcon = routeIcon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-xl overflow-hidden border border-stone-200 hover:shadow-lg transition-shadow"
    >
      {/* Map Preview */}
      <div className="h-48 relative">
        <MapContainer
          center={route.coordinates[0] || [46.5, 11.9]}
          zoom={12}
          style={{ height: "100%", width: "100%" }}
          dragging={false}
          scrollWheelZoom={false}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Polyline positions={route.coordinates} color="#1e293b" weight={3} />
        </MapContainer>
        
        <div className="absolute top-3 left-3 z-[1000] bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-stone-700 flex items-center gap-1">
          <RouteIcon className="w-3 h-3" />
          {route.route_type === "recorded" ? "GPS-Aufzeichnung" : "Geplante Route"}
        </div>

        {route.is_public && (
          <div className="absolute top-3 right-3 z-[1000] bg-brand-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <Eye className="w-3 h-3" />
            Öffentlich
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-stone-800 mb-2">{route.name}</h3>
        
        {route.description && (
          <p className="text-sm text-stone-600 mb-3 line-clamp-2">{route.description}</p>
        )}

        {route.start_location && (
          <p className="text-xs text-stone-500 mb-3">📍 {route.start_location}</p>
        )}

        {/* Stats */}
        <div className="flex flex-wrap gap-3 mb-3 text-xs text-stone-600">
          <div className="flex items-center gap-1">
            <Route className="w-3 h-3" />
            <span>{route.distance_km} km</span>
          </div>
          {route.duration_minutes && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{route.duration_minutes} min</span>
            </div>
          )}
          {route.avg_speed_kmh && (
            <div className="flex items-center gap-1">
              <Navigation className="w-3 h-3" />
              <span>{route.avg_speed_kmh} km/h ⌀</span>
            </div>
          )}
        </div>

        <div className="text-xs text-stone-400 mb-3">
          Erstellt am {format(new Date(route.created_date), "dd.MM.yyyy")}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link to={createPageUrl(`RouteDetail?id=${route.id}`)} className="flex-1">
            <Button variant="outline" className="w-full" size="sm">
              Details
            </Button>
          </Link>
          <Link to={createPageUrl(`EditRoute?id=${route.id}`)}>
            <Button variant="ghost" size="icon" className="text-stone-600 hover:bg-stone-100">
              <Edit className="w-4 h-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(route.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}