import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { coordinates } = await req.json();

    if (!coordinates || coordinates.length < 2) {
      return Response.json({ error: 'At least 2 coordinates required' }, { status: 400 });
    }

    // Calculate distance using Haversine formula
    const calculateDistance = (points) => {
      let totalDistance = 0;
      for (let i = 0; i < points.length - 1; i++) {
        const [lat1, lon1] = points[i];
        const [lat2, lon2] = points[i + 1];
        
        const R = 6371;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        totalDistance += R * c;
      }
      return parseFloat(totalDistance.toFixed(2));
    };

    // Try GraphHopper for elevation and routing
    const pointsParam = coordinates.map(p => `point=${p[0]},${p[1]}`).join('&');
    const ghResponse = await fetch(
      `https://graphhopper.com/api/1/route?${pointsParam}&profile=hike&locale=de&calc_points=true&instructions=false&points_encoded=false&key=LijBPDQGfu7Iiq80ebFCtWMuznIa7Ca3pbXHQnrCn1M8`
    );
    const ghData = await ghResponse.json();

    let distanceKm = calculateDistance(coordinates);
    let elevationGainM = 0;
    let durationMinutes = 0;

    if (ghData.paths && ghData.paths[0]) {
      const path = ghData.paths[0];
      distanceKm = parseFloat((path.distance / 1000).toFixed(2));
      elevationGainM = path.ascend ? Math.round(path.ascend) : 0;
      // Naismith's rule: 1h per 5km + 1h per 600m ascent
      durationMinutes = Math.round((distanceKm / 5) * 60 + (elevationGainM / 600) * 60);
    } else {
      // Fallback to simple calculation
      durationMinutes = Math.round((distanceKm / 5) * 60);
    }

    return Response.json({
      distance_km: distanceKm,
      elevation_gain_m: elevationGainM,
      duration_minutes: durationMinutes,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});