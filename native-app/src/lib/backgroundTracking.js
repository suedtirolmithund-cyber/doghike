import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import {
  appendTrackSamples,
  initializeStoredTrack,
} from "./trackingStorage";

export const TRACKING_TASK_NAME = "dogtrails-background-location";

if (!globalThis.__dogtrailsTrackingTaskDefined) {
  TaskManager.defineTask(TRACKING_TASK_NAME, async ({ data, error }) => {
    if (error) {
      console.error("[native-app] background task failed:", error);
      return;
    }

    const locations = data?.locations ?? [];
    if (locations.length === 0) return;

    await appendTrackSamples(locations);
  });

  globalThis.__dogtrailsTrackingTaskDefined = true;
}

export async function ensureLocationPermissions() {
  const foregroundPermission = await Location.requestForegroundPermissionsAsync();
  if (foregroundPermission.status !== "granted") return false;

  const backgroundPermission = await Location.requestBackgroundPermissionsAsync();
  return backgroundPermission.status === "granted";
}

export async function hasActiveBackgroundTracking() {
  return Location.hasStartedLocationUpdatesAsync(TRACKING_TASK_NAME);
}

export async function startBackgroundTracking({ name, dogId, userId }) {
  await initializeStoredTrack({ name, dogId, userId });

  const alreadyStarted = await hasActiveBackgroundTracking();
  if (alreadyStarted) return;

  await Location.startLocationUpdatesAsync(TRACKING_TASK_NAME, {
    accuracy: Location.Accuracy.BestForNavigation,
    activityType: Location.ActivityType.Fitness,
    showsBackgroundLocationIndicator: true,
    pausesUpdatesAutomatically: false,
    distanceInterval: 5,
    deferredUpdatesDistance: 5,
    deferredUpdatesInterval: 4000,
    foregroundService: {
      notificationTitle: "DogTrails zeichnet auf",
      notificationBody: "Deine Wanderung wird im Hintergrund weiter gespeichert.",
    },
  });
}

export async function stopBackgroundTracking() {
  const alreadyStarted = await hasActiveBackgroundTracking();
  if (!alreadyStarted) return;
  await Location.stopLocationUpdatesAsync(TRACKING_TASK_NAME);
}
