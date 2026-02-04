import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { TrendingUp, Route as RouteIcon, Mountain, Clock } from "lucide-react";

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function RouteProfile({ hike }) {
  const profileData = useMemo(() => {
    if (!hike.route_coordinates || hike.route_coordinates.length < 2) {
      return null;
    }

    const coords = hike.route_coordinates;
    let cumulativeDistance = 0;
    const data = [];
    
    // Calculate cumulative distance and approximate elevation
    coords.forEach((coord, index) => {
      if (index > 0) {
        const [lat1, lon1] = coords[index - 1];
        const [lat2, lon2] = coord;
        const segmentDistance = calculateDistance(lat1, lon1, lat2, lon2);
        cumulativeDistance += segmentDistance;
      }

      // Approximate elevation based on total elevation gain
      // Create a more realistic profile with ups and downs
      let elevation = 0;
      if (hike.elevation_gain_m && coords.length > 1) {
        const progress = index / (coords.length - 1);
        // Create a curve that goes up gradually with some variation
        const baseElevation = progress * hike.elevation_gain_m;
        const variation = Math.sin(progress * Math.PI * 3) * (hike.elevation_gain_m * 0.1);
        elevation = baseElevation + variation;
      }

      data.push({
        distance: cumulativeDistance,
        elevation: Math.max(0, elevation),
        distanceLabel: cumulativeDistance.toFixed(1)
      });
    });

    return {
      data,
      totalDistance: cumulativeDistance,
      maxElevation: Math.max(...data.map(d => d.elevation)),
      minElevation: Math.min(...data.map(d => d.elevation))
    };
  }, [hike.route_coordinates, hike.elevation_gain_m]);

  if (!profileData) {
    return null;
  }

  const { data, totalDistance, maxElevation, minElevation } = profileData;

  return (
    <div className="space-y-6">
      {/* Statistics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <RouteIcon className="w-4 h-4" />
            <span className="text-xs font-medium">Gesamtstrecke</span>
          </div>
          <p className="text-2xl font-semibold text-blue-900">
            {hike.distance_km || totalDistance.toFixed(1)} km
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
          <div className="flex items-center gap-2 text-orange-600 mb-1">
            <Mountain className="w-4 h-4" />
            <span className="text-xs font-medium">Höhenmeter</span>
          </div>
          <p className="text-2xl font-semibold text-orange-900">
            {hike.elevation_gain_m || 0} m
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-medium">Gehzeit</span>
          </div>
          <p className="text-2xl font-semibold text-green-900">
            {hike.duration_minutes ? `${(hike.duration_minutes / 60).toFixed(1)} h` : "—"}
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center gap-2 text-purple-600 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium">Max. Höhe</span>
          </div>
          <p className="text-2xl font-semibold text-purple-900">
            {maxElevation > 0 ? `${Math.round(maxElevation)} m` : "—"}
          </p>
        </div>
      </div>

      {/* Elevation Profile Chart */}
      {hike.elevation_gain_m && hike.elevation_gain_m > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-stone-200/50">
          <h3 className="text-lg font-medium text-stone-800 mb-4 flex items-center gap-2">
            <Mountain className="w-5 h-5 text-stone-600" />
            Höhenprofil
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="elevationGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis 
                dataKey="distanceLabel" 
                label={{ value: 'Distanz (km)', position: 'insideBottom', offset: -5 }}
                stroke="#78716c"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                label={{ value: 'Höhe (m)', angle: -90, position: 'insideLeft' }}
                stroke="#78716c"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: '1px solid #e7e5e4',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                labelFormatter={(value) => `${value} km`}
                formatter={(value) => [`${Math.round(value)} m`, 'Höhe']}
              />
              <Area 
                type="monotone" 
                dataKey="elevation" 
                stroke="#f97316" 
                strokeWidth={2}
                fill="url(#elevationGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
          <p className="text-xs text-stone-500 mt-2 text-center">
            * Approximiertes Höhenprofil basierend auf Gesamthöhenmetern
          </p>
        </div>
      )}

      {/* Distance Profile */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200/50">
        <h3 className="text-lg font-medium text-stone-800 mb-4 flex items-center gap-2">
          <RouteIcon className="w-5 h-5 text-stone-600" />
          Streckenverlauf
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis 
              dataKey="distanceLabel" 
              label={{ value: 'Distanz (km)', position: 'insideBottom', offset: -5 }}
              stroke="#78716c"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              hide
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                border: '1px solid #e7e5e4',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              labelFormatter={(value) => `${value} km erreicht`}
              formatter={() => ['']}
            />
            <Line 
              type="monotone" 
              dataKey="distance" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-xs text-stone-500 mt-2 text-center">
          Gesamtstrecke: {totalDistance.toFixed(2)} km • {data.length} Wegpunkte
        </p>
      </div>
    </div>
  );
}