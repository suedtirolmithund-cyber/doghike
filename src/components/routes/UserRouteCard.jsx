import { MapContainer, TileLayer, Polyline } from "react-leaflet";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import {
  Map,
  Navigation,
  CheckCircle2,
  Trash2,
  Edit,
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import "leaflet/dist/leaflet.css";
import { TOUR_ICONS } from "@/lib/difficultyConfig";
import { formatDurationHours } from "@/lib/duration";

function getRouteTypeLabel(routeType) {
  if (routeType === "recorded") return "GPS-Aufzeichnung";
  if (routeType === "gpx") return "GPX-Import";
  return "Geplante Route";
}

export default function UserRouteCard({ route, index, onDelete }) {
  const RouteIcon = route.route_type === "recorded" ? Navigation : Map;
  const coordinates = route.waypoints ?? [];
  const createdAt = route.created_at ?? null;
  const effectiveDurationMinutes = route.completed_duration_minutes ?? route.duration_minutes ?? null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="doghike-glass-card-hover overflow-hidden"
    >
      <div className="h-48 relative">
        <MapContainer
          center={coordinates[0] || [46.5, 11.9]}
          zoom={12}
          style={{ height: "100%", width: "100%" }}
          dragging={false}
          scrollWheelZoom={false}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Polyline positions={coordinates} color="#b8785f" weight={4} />
        </MapContainer>

        <div className="absolute left-3 top-3 z-[1000] flex items-center gap-1 rounded-full border border-white/70 bg-white/82 px-3 py-1 text-xs font-medium text-stone-700 shadow-sm backdrop-blur-sm">
          <RouteIcon className="w-3 h-3" />
          {getRouteTypeLabel(route.route_type)}
        </div>

        {route.completed && (
          <div className="absolute right-3 top-3 z-[1000] flex items-center gap-1 rounded-full bg-brand-500 px-2 py-1 text-xs font-medium text-white shadow-sm">
            <CheckCircle2 className="w-3 h-3" />
            Erledigt
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-stone-800 mb-2">{route.name}</h3>

        {route.description && (
          <p className="text-sm text-stone-600 mb-3 line-clamp-2">{route.description}</p>
        )}

        {route.start_location && (
          <p className="text-xs text-stone-500 mb-3">Ort: {route.start_location}</p>
        )}

        <div className="flex flex-wrap gap-3 mb-3 text-xs text-stone-600">
          <div className="flex items-center gap-1">
            <span className="text-sm leading-none">{TOUR_ICONS.distance}</span>
            <span>{route.distance_km} km</span>
          </div>
          {effectiveDurationMinutes && (
            <div className="flex items-center gap-1">
              <span className="text-sm leading-none">{TOUR_ICONS.duration}</span>
              <span>{formatDurationHours(effectiveDurationMinutes)}</span>
            </div>
          )}
          {route.avg_speed_kmh && (
            <div className="flex items-center gap-1">
              <span className="text-sm leading-none">{TOUR_ICONS.speed}</span>
              <span>{route.avg_speed_kmh} km/h</span>
            </div>
          )}
        </div>

        <div className="text-xs text-stone-400 mb-3">
          Erstellt am {createdAt ? format(new Date(createdAt), "dd.MM.yyyy") : "-"}
        </div>

        <div className="flex gap-2">
          <Link to={`${createPageUrl("RouteDetail")}?id=${route.id}`} className="flex-1">
            <Button variant="outline" className="doghike-secondary-action w-full" size="sm">
              Details
            </Button>
          </Link>
          <Link to={`${createPageUrl("EditRoute")}?id=${route.id}`}>
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
