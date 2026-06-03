export const ROUTE_LINE_COLOR = "#A8003C";

export const ROUTE_WAYPOINT_COLORS = {
  start: "#F9C030",
  middle: "#F07030",
  end: "#A8003C",
};

export const ROUTE_TILE_LAYERS = [
  {
    id: "standard",
    label: "Standard",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 19,
    maxNativeZoom: 19,
  },
  {
    id: "topo",
    label: "Topografisch",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution:
      'Kartendaten: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, SRTM | Kartenstil: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    maxZoom: 17,
    maxNativeZoom: 17,
  },
  {
    id: "satellite",
    label: "Satellit",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      'Tiles &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community',
    maxZoom: 19,
    maxNativeZoom: 19,
  },
];

export const ROUTE_TILE_LAYER = ROUTE_TILE_LAYERS[0];

export function getRouteTileLayer(layerId) {
  return ROUTE_TILE_LAYERS.find((layer) => layer.id === layerId) ?? ROUTE_TILE_LAYER;
}

export function getRouteWaypointColor(index, total) {
  if (index === 0) return ROUTE_WAYPOINT_COLORS.start;
  if (total > 1 && index === total - 1) return ROUTE_WAYPOINT_COLORS.end;
  return ROUTE_WAYPOINT_COLORS.middle;
}

export function getRouteWaypointType(index, total) {
  if (index === 0) return "start";
  if (total > 1 && index === total - 1) return "end";
  return "middle";
}

export function getRouteWaypointRoleLabel(index, total) {
  const type = getRouteWaypointType(index, total);
  if (type === "start") return "Start";
  if (type === "end") return "Ziel";
  return "Zwischenstopp";
}

export function getRouteWaypointListStyle(index, total) {
  const type = getRouteWaypointType(index, total);

  if (type === "start") {
    return {
      backgroundColor: "#FFF8E0",
      borderColor: "#F9C030",
      textColor: "#7C3020",
      badgeTextColor: "#7C3020",
    };
  }

  if (type === "end") {
    return {
      backgroundColor: "#FFF3F7",
      borderColor: "#A8003C",
      textColor: "#A8003C",
      badgeTextColor: "#FFFFFF",
    };
  }

  return {
    backgroundColor: "#FFF3EC",
    borderColor: "#F07030",
    textColor: "#7C3020",
    badgeTextColor: "#FFFFFF",
  };
}

export function getRouteWaypointLabel(index, total, fallbackLabel) {
  if (index === 0) return "S";
  if (total > 1 && index === total - 1) return "Z";
  return fallbackLabel || String(index + 1);
}
