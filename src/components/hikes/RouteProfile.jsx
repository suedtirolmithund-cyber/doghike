import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Route as RouteIcon, Mountain, Clock, Activity } from "lucide-react";

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
}

function formatPace(paceMinPerKm) {
  const min = Math.floor(paceMinPerKm);
  const sec = Math.round((paceMinPerKm - min) * 60);
  return `${min}:${String(sec).padStart(2, "0")}`;
}

function getIntensity(distKm, elevM) {
  const score = (distKm || 0) * 1.5 + (elevM || 0) * 0.02;
  if (score < 10) return { label: "Leicht", icon: "🟢", bg: "bg-emerald-50 border-emerald-200 text-emerald-800" };
  if (score < 22) return { label: "Mittel", icon: "🟡", bg: "bg-amber-50 border-amber-200 text-amber-800" };
  if (score < 40) return { label: "Anspruchsvoll", icon: "🟠", bg: "bg-orange-50 border-orange-200 text-orange-800" };
  return { label: "Sehr schwer", icon: "🔴", bg: "bg-red-50 border-red-200 text-red-800" };
}

export default function RouteProfile({ hike }) {
  const profileData = useMemo(() => {
    if (!hike.route_coordinates || hike.route_coordinates.length < 2) return null;
    const coords = hike.route_coordinates;
    let cumDist = 0;
    const data = coords.map((coord, i) => {
      if (i > 0) {
        const [lat1, lon1] = coords[i - 1];
        const [lat2, lon2] = coord;
        cumDist += haversine(lat1, lon1, lat2, lon2);
      }
      let elevation = 0;
      if (hike.elevation_gain_m && coords.length > 1) {
        const p = i / (coords.length - 1);
        elevation = p * hike.elevation_gain_m + Math.sin(p * Math.PI * 3) * (hike.elevation_gain_m * 0.1);
      }
      return { distance: cumDist, elevation: Math.max(0, elevation), distanceLabel: cumDist.toFixed(1) };
    });
    return { data, totalDistance: cumDist };
  }, [hike.route_coordinates, hike.elevation_gain_m]);

  const pace = hike.duration_minutes && hike.distance_km && hike.distance_km > 0
    ? hike.duration_minutes / hike.distance_km : null;

  const gradient = hike.elevation_gain_m && hike.distance_km && hike.distance_km > 0
    ? ((hike.elevation_gain_m / (hike.distance_km * 1000)) * 100).toFixed(1) : null;

  const calories = hike.duration_minutes ? Math.round(hike.duration_minutes * 8) : null;

  const intensity = getIntensity(hike.distance_km, hike.elevation_gain_m);

  const hasAnyData = hike.distance_km || hike.elevation_gain_m || hike.duration_minutes;
  if (!hasAnyData && !profileData) return null;

  return (
    <div className="space-y-4">
      {/* Primary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {hike.distance_km && (
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-1.5 text-blue-600 mb-1">
              <RouteIcon className="w-4 h-4" />
              <span className="text-xs font-medium">Strecke</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              {hike.distance_km} <span className="text-sm font-normal">km</span>
            </p>
          </div>
        )}
        {hike.elevation_gain_m && (
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
            <div className="flex items-center gap-1.5 text-orange-600 mb-1">
              <Mountain className="w-4 h-4" />
              <span className="text-xs font-medium">Aufstieg</span>
            </div>
            <p className="text-2xl font-bold text-orange-900">
              +{hike.elevation_gain_m} <span className="text-sm font-normal">m</span>
            </p>
          </div>
        )}
        {hike.duration_minutes && (
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
            <div className="flex items-center gap-1.5 text-green-600 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">Gehzeit</span>
            </div>
            <p className="text-xl font-bold text-green-900">
              {formatDuration(hike.duration_minutes)}
            </p>
          </div>
        )}
        {pace && (
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center gap-1.5 text-purple-600 mb-1">
              <Activity className="w-4 h-4" />
              <span className="text-xs font-medium">Tempo</span>
            </div>
            <p className="text-xl font-bold text-purple-900">
              {formatPace(pace)} <span className="text-xs font-normal">min/km</span>
            </p>
          </div>
        )}
      </div>

      {/* Secondary Stats */}
      <div className="flex flex-wrap gap-3">
        {gradient && (
          <div className="flex-1 min-w-[110px] bg-white rounded-xl p-3 border border-stone-200 text-center">
            <p className="text-xs text-stone-500 mb-1">⛰️ Ø Steigung</p>
            <p className="text-lg font-bold text-stone-800">{gradient}%</p>
          </div>
        )}
        {calories && (
          <div className="flex-1 min-w-[110px] bg-white rounded-xl p-3 border border-stone-200 text-center">
            <p className="text-xs text-stone-500 mb-1">🔥 Kalorien (ca.)</p>
            <p className="text-lg font-bold text-stone-800">{calories} kcal</p>
          </div>
        )}
        <div className={`flex-1 min-w-[110px] rounded-xl p-3 border text-center ${intensity.bg}`}>
          <p className="text-xs mb-1">{intensity.icon} Intensität</p>
          <p className="text-base font-bold">{intensity.label}</p>
        </div>
      </div>

      {/* Elevation Profile */}
      {profileData && hike.elevation_gain_m && hike.elevation_gain_m > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-stone-200/50">
          <h3 className="text-base font-medium text-stone-800 mb-4 flex items-center gap-2">
            <Mountain className="w-4 h-4 text-stone-600" />
            Höhenprofil
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={profileData.data} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis
                dataKey="distanceLabel"
                label={{ value: "Distanz (km)", position: "insideBottom", offset: -12 }}
                stroke="#78716c"
                tick={{ fontSize: 11 }}
              />
              <YAxis
                label={{ value: "Höhe (m)", angle: -90, position: "insideLeft", offset: 10 }}
                stroke="#78716c"
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "rgba(255,255,255,0.95)", border: "1px solid #e7e5e4", borderRadius: "8px", fontSize: "12px" }}
                labelFormatter={(v) => `${v} km`}
                formatter={(v) => [`${Math.round(v)} m`, "Höhe"]}
              />
              <Area type="monotone" dataKey="elevation" stroke="#f97316" strokeWidth={2.5} fill="url(#elevGrad)" />
            </AreaChart>
          </ResponsiveContainer>
          <p className="text-xs text-stone-400 mt-1 text-center italic">
            * Approximiertes Höhenprofil basierend auf Gesamthöhenmetern
          </p>
        </div>
      )}
    </div>
  );
}