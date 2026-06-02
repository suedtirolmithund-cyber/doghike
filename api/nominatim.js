const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";
const DEFAULT_ACCEPT_LANGUAGE = "de";

function buildUserAgent(req) {
  const host = req.headers.host || "dogtrails.local";
  return `DogTrails/1.0 (${host}; route-search-proxy)`;
}

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function fetchNominatim(req, endpoint, params) {
  const url = new URL(`${NOMINATIM_BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    url.searchParams.set(key, String(value));
  });

  const response = await fetch(url, {
    headers: {
      "Accept": "application/json",
      "Accept-Language": params["accept-language"] || DEFAULT_ACCEPT_LANGUAGE,
      "User-Agent": buildUserAgent(req),
    },
  });

  if (!response.ok) {
    const error = new Error(`nominatim_${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  try {
    const mode = String(req.query.mode || "search");

    if (mode === "reverse") {
      const lat = Number.parseFloat(String(req.query.lat ?? ""));
      const lon = Number.parseFloat(String(req.query.lon ?? ""));

      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return res.status(400).json({ error: "invalid_coordinates" });
      }

      const data = await fetchNominatim(req, "/reverse", {
        lat,
        lon,
        format: "json",
        "accept-language": req.query.acceptLanguage || DEFAULT_ACCEPT_LANGUAGE,
        addressdetails: req.query.addressdetails ?? "1",
      });

      res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
      return res.status(200).json(data);
    }

    const query = String(req.query.q || "").trim();
    if (!query) {
      return res.status(400).json({ error: "missing_query" });
    }

    const data = await fetchNominatim(req, "/search", {
      q: query,
      format: "json",
      limit: toPositiveInt(req.query.limit, 5),
      "accept-language": req.query.acceptLanguage || DEFAULT_ACCEPT_LANGUAGE,
      addressdetails: req.query.addressdetails ?? "0",
      countrycodes: req.query.countrycodes || "",
    });

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json(data);
  } catch (error) {
    console.error("[api/nominatim] request failed:", error);
    const status = Number.isFinite(error?.status) ? error.status : 502;
    return res.status(status).json({ error: "nominatim_request_failed" });
  }
}
