const SHEETS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vS6YeL4WqJZWHAQ8HBuodH98vwfIeaUV4p89bAvnM3TDavLKtnsmGUOfcSyAN0ID0rcVYd-OCQUkbiv/pub?gid=624993458&single=true&output=csv";

/**
 * Parses a CSV string into an array of objects using the first row as keys.
 * Handles quoted fields containing commas or newlines.
 */
function parseCsv(text) {
  const rows = [];
  let current = "";
  let inQuotes = false;

  // Normalise line endings
  const normalised = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < normalised.length; i++) {
    const ch = normalised[i];
    if (ch === '"') {
      if (inQuotes && normalised[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "\n" && !inQuotes) {
      rows.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current) rows.push(current);

  const splitRow = (row) => {
    const fields = [];
    let field = "";
    let quoted = false;
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (ch === '"') {
        if (quoted && row[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = !quoted;
        }
      } else if (ch === "," && !quoted) {
        fields.push(field);
        field = "";
      } else {
        field += ch;
      }
    }
    fields.push(field);
    return fields;
  };

  if (rows.length === 0) return [];
  const headers = splitRow(rows[0]);
  const results = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r].trim();
    if (!row) continue;
    const values = splitRow(row);
    const obj = {};
    headers.forEach((h, i) => {
      obj[h.trim()] = (values[i] ?? "").trim();
    });
    results.push(obj);
  }
  return results;
}

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Converts a raw CSV row (column names from the Google Sheet) into a Hike
 * object shaped exactly like the base44 Hike entity used throughout the app.
 */
function rowToHike(row, index) {
  const parsedLat = parseFloat(row.lat);
  const parsedLng = parseFloat(row.lng);
  const parsedDistance = parseFloat(row.distance_km);
  const parsedAscent = parseFloat(row.ascent_m);
  const parsedDurationH = parseFloat(row.duration_h);

  // Split comma-separated tags into an array, ignore empty strings
  const tags = row.tags
    ? row.tags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  // Wrap single image URL in an array so photos[0] works like base44 objects
  const photos = row.image ? [row.image] : [];

  const id = row.id || (row.title ? slugify(row.title) : String(index));

  return {
    id,
    trail_name: row.title,
    location: row.location,
    country: row.country || null,

    latitude: isNaN(parsedLat) ? null : parsedLat,
    longitude: isNaN(parsedLng) ? null : parsedLng,

    photos,
    link: row.link || null,

    tags,

    distance_km: isNaN(parsedDistance) ? null : parsedDistance,
    elevation_gain_m: isNaN(parsedAscent) ? null : parsedAscent,
    // Sheet stores hours; the app expects minutes
    duration_minutes: isNaN(parsedDurationH) ? null : Math.round(parsedDurationH * 60),

    // difficulty_mensch → difficulty (1-5 scale, stored as string)
    difficulty: row.difficulty_mensch || null,
    // difficulty_hund  → dog_difficulty (1-5 scale, stored as string)
    dog_difficulty: row.difficulty_hund || null,

    // water → water_availability (none | little | moderate | plenty)
    water_availability: row.water || null,

    is_premium: row.is_premium === "true" || row.is_premium === "1",

    status: row.status,
    // Sheets hikes are always public (visibility concept lives in base44 only)
    visibility: "public",

    season: row.season || null,
    availability: row.availability || null,

    hazard_notes: row.hazard_notes || null,
    parking_info: row.parking_info || null,
    restaurant_info: row.restaurant_info || null,
    notes: row.notes || null,

    // Mark origin so consumers can distinguish Sheets hikes from base44 hikes
    _source: "sheets",
  };
}

/**
 * Fetches all approved hikes from the public Google Sheet.
 * Returns an array of Hike objects compatible with the base44 Hike entity.
 */
export async function getHikes() {
  try {
    console.log("[sheetsClient] fetching CSV...");
    const response = await fetch(SHEETS_CSV_URL);
    if (!response.ok) {
      console.error("[sheetsClient] fetch failed, status:", response.status);
      return [];
    }
    const text = await response.text();
    console.log("[sheetsClient] CSV loaded, length:", text.length);
    const rows = parseCsv(text);
    console.log("[sheetsClient] total rows parsed:", rows.length);
    const hikes = rows
      .filter((row) => row.status === "approved")
      .map((row, index) => rowToHike(row, index));
    console.log("[sheetsClient] approved hikes:", hikes.length, "first id:", hikes[0]?.id);
    return hikes;
  } catch (err) {
    console.error("[sheetsClient] error:", err);
    return [];
  }
}
