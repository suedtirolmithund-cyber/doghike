const HOURS_DISPLAY_FORMATTER = new Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

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

  const numericHours = Number(hoursValue);
  if (!Number.isFinite(numericHours)) return null;

  return Math.round(numericHours * 60);
}
