export const ROUTE_LINE_COLOR = "#A8003C";

export const ROUTE_WAYPOINT_COLORS = {
  start: "#F9C030",
  middle: "#F07030",
  end: "#A8003C",
};

export const ROUTE_TILE_LAYER = {
  label: "Standard",
  url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
  maxZoom: 19,
  maxNativeZoom: 19,
};

export function getRouteWaypointColor(index, total) {
  if (index === 0) return ROUTE_WAYPOINT_COLORS.start;
  if (total > 1 && index === total - 1) return ROUTE_WAYPOINT_COLORS.end;
  return ROUTE_WAYPOINT_COLORS.middle;
}

export function getRouteWaypointLabel(index, total, fallbackLabel) {
  if (index === 0) return "S";
  if (total > 1 && index === total - 1) return "Z";
  return fallbackLabel || String(index + 1);
}
