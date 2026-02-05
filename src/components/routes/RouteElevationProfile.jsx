import { useMemo } from "react";
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Mountain, Route as RouteIcon } from "lucide-react";

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function RouteElevationProfile({ coordinates, distance }) {
  const profileData = useMemo(() => {
    if (!coordinates || coordinates.length < 2) {
      return null;
    }

    let cumulativeDistance = 0;
    const data = [];

    coordinates.forEach((coord, index) => {
      if (index > 0) {
        const [lat1, lon1] = coordinates[index - 1];
        const [lat2, lon2] = coord;
        const segmentDistance = calculateDistance(lat1, lon1, lat2, lon2);
        cumulativeDistance += segmentDistance;
      }

      // Simulate elevation with gentle variations
      const progress = index / (coordinates.length - 1);
      const baseElevation = 1000 + (progress * 200); // Base elevation 1000-1200m
      const variation = Math.sin(progress * Math.PI * 4) * 50; // Gentle ups and downs
      const elevation = baseElevation + variation;

      data.push({
        distance: cumulativeDistance,
        elevation: Math.round(elevation),
        distanceLabel: cumulativeDistance.toFixed(1)
      });
    });

    return {
      data,
      totalDistance: cumulativeDistance,
      maxElevation: Math.max(...data.map(d => d.elevation)),
      minElevation: Math.min(...data.map(d => d.elevation))
    };
  }, [coordinates]);

  if (!profileData) {
    return null;
  }

  const { data, totalDistance, maxElevation, minElevation } = profileData;
  const elevationGain = maxElevation - minElevation;

  return (
    <div className="space-y-4">
      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <p className="text-xs text-blue-600 font-medium">Distanz</p>
          <p className="text-lg font-bold text-blue-900">{distance || totalDistance.toFixed(1)} km</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
          <p className="text-xs text-orange-600 font-medium">Höhenunterschied</p>
          <p className="text-lg font-bold text-orange-900">{Math.round(elevationGain)} m</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
          <p className="text-xs text-purple-600 font-medium">Max. Höhe</p>
          <p className="text-lg font-bold text-purple-900">{Math.round(maxElevation)} m</p>
        </div>
      </div>

      {/* Elevation Chart */}
      <div className="bg-white rounded-xl p-4 border border-stone-200/50">
        <h3 className="text-sm font-semibold text-stone-800 mb-3 flex items-center gap-2">
          <Mountain className="w-4 h-4" />
          Höhenprofil
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="elevGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#f97316" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis dataKey="distanceLabel" stroke="#78716c" style={{ fontSize: '11px' }} />
            <YAxis stroke="#78716c" style={{ fontSize: '11px' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                border: '1px solid #e7e5e4',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              labelFormatter={(value) => `${value} km`}
              formatter={(value) => [`${value} m`, 'Höhe']}
            />
            <Area type="monotone" dataKey="elevation" stroke="#f97316" strokeWidth={2} fill="url(#elevGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}