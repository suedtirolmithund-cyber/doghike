const HOURS_DISPLAY_FORMATTER = new Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});
const ROUTE_BASE_SPEED_KMH = 5;
const ROUTE_ASCENT_METERS_PER_HOUR = 600;

export function formatDurationHours(minutes) {
  if (minutes === null || minutes === undefined || minutes === "") return null;

  const numericMinutes = Number(minutes);
  if (!Number.isFinite(numericMinutes)) return null;

  const hours = numericMinutes / 60;
  return `${HOURS_DISPLAY_FORMATTER.format(hours)} Std`;
}

export function minutesToHoursInput(minutes) {
  if (minutes === null || minutes === undefined || minutes === "") return "";

  const numericMinutes = Number(minutes);
  if (!Number.isFinite(numericMinutes)) return "";

  return String(Number((numericMinutes / 60).toFixed(1)));
}

export function hoursInputToMinutes(hoursValue) {
  if (hoursValue === null || hoursValue === undefined || hoursValue === "") return null;

  const normalizedHoursValue =
    typeof hoursValue === "string" ? hoursValue.replace(",", ".").trim() : hoursValue;
  const numericHours = Number(normalizedHoursValue);
  if (!Number.isFinite(numericHours)) return null;

  return Math.round(numericHours * 60);
}

export function estimateRouteDurationMinutes(distanceKm, elevationGainM = 0) {
  const normalizedDistanceKm = Number(distanceKm);
  const normalizedElevationGainM = Number(elevationGainM ?? 0);

  if (!Number.isFinite(normalizedDistanceKm) || normalizedDistanceKm <= 0) return 0;

  const distanceHours = normalizedDistanceKm / ROUTE_BASE_SPEED_KMH;
  const ascentHours =
    Number.isFinite(normalizedElevationGainM) && normalizedElevationGainM > 0
      ? normalizedElevationGainM / ROUTE_ASCENT_METERS_PER_HOUR
      : 0;

  return Math.round((distanceHours + ascentHours) * 60);
}

export function getRouteDurationRuleLabel() {
  return `${ROUTE_BASE_SPEED_KMH} km/h + ${ROUTE_ASCENT_METERS_PER_HOUR} Hm/h`;
}
