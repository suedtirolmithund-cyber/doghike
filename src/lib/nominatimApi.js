function buildUrl(params) {
  const url = new URL("/api/nominatim", window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    url.searchParams.set(key, String(value));
  });
  return url.toString();
}

async function requestNominatim(params) {
  const response = await fetch(buildUrl(params), {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error("nominatim_request_failed");
  }

  return response.json();
}

export function searchNominatim(query, options = {}) {
  return requestNominatim({
    mode: "search",
    q: query,
    limit: options.limit ?? 5,
    acceptLanguage: options.acceptLanguage ?? "de",
    addressdetails: options.addressdetails ?? 0,
    countrycodes: options.countrycodes ?? "",
  });
}

export function reverseNominatim(lat, lon, options = {}) {
  return requestNominatim({
    mode: "reverse",
    lat,
    lon,
    acceptLanguage: options.acceptLanguage ?? "de",
    addressdetails: options.addressdetails ?? 1,
  });
}
