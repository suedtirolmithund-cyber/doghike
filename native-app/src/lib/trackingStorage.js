import AsyncStorage from "@react-native-async-storage/async-storage";

export const TRACK_STORAGE_KEY = "dogtrails:native-track";

export async function getStoredTrack() {
  try {
    const rawValue = await AsyncStorage.getItem(TRACK_STORAGE_KEY);
    if (!rawValue) return null;
    return JSON.parse(rawValue);
  } catch (error) {
    console.error("[native-app] read track failed:", error);
    return null;
  }
}

export async function writeStoredTrack(track) {
  await AsyncStorage.setItem(TRACK_STORAGE_KEY, JSON.stringify(track));
}

export async function clearStoredTrack() {
  await AsyncStorage.removeItem(TRACK_STORAGE_KEY);
}

export async function initializeStoredTrack({ name, dogId, userId }) {
  const track = {
    name,
    dogId: dogId ?? null,
    userId,
    startedAt: Date.now(),
    lastUpdatedAt: Date.now(),
    samples: [],
  };
  await writeStoredTrack(track);
  return track;
}

export async function appendTrackSamples(locations) {
  const currentTrack = (await getStoredTrack()) ?? {
    name: "Neue Route",
    dogId: null,
    userId: null,
    startedAt: Date.now(),
    lastUpdatedAt: Date.now(),
    samples: [],
  };

  const nextSamples = [...currentTrack.samples];

  for (const location of locations) {
    const point = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      altitude:
        typeof location.coords.altitude === "number"
          ? location.coords.altitude
          : null,
      accuracy:
        typeof location.coords.accuracy === "number"
          ? location.coords.accuracy
          : null,
      timestamp: location.timestamp ?? Date.now(),
    };

    const lastPoint = nextSamples[nextSamples.length - 1];
    if (
      lastPoint &&
      lastPoint.latitude === point.latitude &&
      lastPoint.longitude === point.longitude &&
      lastPoint.timestamp === point.timestamp
    ) {
      continue;
    }

    nextSamples.push(point);
  }

  const nextTrack = {
    ...currentTrack,
    samples: nextSamples,
    lastUpdatedAt: Date.now(),
  };

  await writeStoredTrack(nextTrack);
  return nextTrack;
}

function haversineDistance(fromPoint, toPoint) {
  const radius = 6371;
  const dLat = ((toPoint.latitude - fromPoint.latitude) * Math.PI) / 180;
  const dLon = ((toPoint.longitude - fromPoint.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((fromPoint.latitude * Math.PI) / 180) *
      Math.cos((toPoint.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getTrackSummary(track) {
  if (!track?.samples?.length) {
    return {
      pointCount: 0,
      distanceKm: 0,
      elevationGainM: 0,
      durationMinutes: 0,
      avgSpeedKmh: 0,
    };
  }

  let distanceKm = 0;
  let elevationGainM = 0;

  for (let index = 1; index < track.samples.length; index += 1) {
    const previousSample = track.samples[index - 1];
    const currentSample = track.samples[index];
    distanceKm += haversineDistance(previousSample, currentSample);

    if (
      Number.isFinite(previousSample.altitude) &&
      Number.isFinite(currentSample.altitude) &&
      currentSample.altitude > previousSample.altitude
    ) {
      elevationGainM += currentSample.altitude - previousSample.altitude;
    }
  }

  const startedAt = track.startedAt ?? track.samples[0]?.timestamp ?? Date.now();
  const endedAt =
    track.samples[track.samples.length - 1]?.timestamp ??
    track.lastUpdatedAt ??
    startedAt;
  const durationMinutes = Math.max(0, Math.round((endedAt - startedAt) / 60000));
  const avgSpeedKmh =
    durationMinutes > 0 ? distanceKm / (durationMinutes / 60) : 0;

  return {
    pointCount: track.samples.length,
    distanceKm,
    elevationGainM: Math.round(elevationGainM),
    durationMinutes,
    avgSpeedKmh,
  };
}
