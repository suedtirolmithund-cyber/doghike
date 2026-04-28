import { supabase } from "@/lib/supabaseClient";

const SHEETS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vS6YeL4WqJZWHAQ8HBuodH98vwfIeaUV4p89bAvnM3TDavLKtnsmGUOfcSyAN0ID0rcVYd-OCQUkbiv/pub?gid=624993458&single=true&output=csv";

/**
 * RFC-4180-compliant CSV parser.
 *
 * Single-pass, character-by-character — no row-then-field two-step that can
 * desynchronise quote state for cells containing embedded newlines or commas.
 *
 * Handles:
 *  - Quoted fields:  "hello, world"  →  hello, world
 *  - Embedded newlines inside quotes: "line1\nline2"  →  line1\nline2
 *  - Escaped quotes: "say ""hi"""  →  say "hi"
 *  - Unquoted fields with any length
 */
function parseCsv(text) {
  const str = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const records = []; // array of string[]
  let i = 0;

  while (i <= str.length) {
    const record = [];

    // Parse one full row of fields
    while (true) {
      let field = "";

      if (str[i] === '"') {
        // ── Quoted field ──────────────────────────────────────
        i++; // skip opening quote
        while (i < str.length) {
          if (str[i] === '"') {
            if (str[i + 1] === '"') {
              // Escaped quote → literal "
              field += '"';
              i += 2;
            } else {
              // Closing quote
              i++;
              break;
            }
          } else {
            field += str[i];
            i++;
          }
        }
      } else {
        // ── Unquoted field ────────────────────────────────────
        while (i < str.length && str[i] !== "," && str[i] !== "\n") {
          field += str[i];
          i++;
        }
      }

      record.push(field);

      if (i >= str.length || str[i] === "\n") {
        // End of row
        break;
      }
      // Must be a comma — advance and parse next field
      i++;
    }

    // Skip the newline (or we've reached EOF)
    if (i < str.length && str[i] === "\n") i++;

    records.push(record);

    if (i >= str.length) break;
  }

  if (records.length === 0) return [];

  const headers = records[0].map((h) => h.trim());
  const results = [];

  for (let r = 1; r < records.length; r++) {
    const fields = records[r];
    // Skip entirely blank rows
    if (fields.every((f) => f === "")) continue;
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = (fields[idx] ?? "").trim();
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
 * object shaped exactly like the hike objects used throughout the app.
 */
function rowToHike(row, index) {
  const parsedLat = parseFloat(row.lat || row.latitude);
  const parsedLng = parseFloat(row.lng || row.longitude);
  const parsedDistance = parseFloat(row.distance_km || row.distance || row.distanz_km);
  const parsedAscent = parseFloat(row.ascent_m || row.elevation_gain_m || row.hm || row.hoehenmeter);
  const parsedDurationH = parseFloat(row.duration_h || row.dauer_h || row.duration_hours);

  // Split comma-separated tags into an array, ignore empty strings
  const tags = row.tags
    ? row.tags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  // Wrap single image URL in an array so photos[0] works consistently in the app
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

    // difficulty_mensch / difficulty / schwierigkeit_mensch → difficulty (1-5)
    difficulty: row.difficulty_mensch || row.difficulty || row.schwierigkeit_mensch || row.schwierigkeit || null,
    // difficulty_hund / dog_difficulty / schwierigkeit_hund → dog_difficulty (1-5)
    dog_difficulty: row.difficulty_hund || row.dog_difficulty || row.schwierigkeit_hund || null,

    // water → water_availability (none | little | moderate | plenty)
    water_availability: (() => { const w = row.water?.trim(); if (!w) return null; if (w === "0") return "none"; return w; })(),

    is_premium: row.is_premium === "true" || row.is_premium === "1",

    status: row.status,
    // Sheets hikes are always public
    visibility: "public",

    season: row.season || null,
    availability: row.availability || null,

    hazard_notes: row.hazard_notes || null,
    parking_info: row.parking_info || null,
    restaurant_info: row.restaurant_info || null,
    notes: row.notes || null,
    date: row.date || row.datum || null,

    // Mark origin so consumers can distinguish Sheets hikes from journal hikes
    _source: "sheets",
  };
}

function mapSupabaseWaterLevel(value) {
  if (value === 0 || value === "0") return "none";
  if (value === 1 || value === "1") return "little";
  if (value === 2 || value === "2") return "moderate";
  if (value === 3 || value === "3") return "plenty";
  return null;
}

function normalizeTags(value) {
  if (Array.isArray(value)) {
    return value.map((tag) => String(tag).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
}

function publicHikeRowToHike(row, photos = []) {
  return {
    // Keep the old external id shape stable so saved hikes, comments, and ratings keep matching.
    id: slugify(row.title || String(row.id)),
    trail_name: row.title,
    location: row.location,
    country: row.country || null,

    latitude: row.latitude != null ? Number(row.latitude) : null,
    longitude: row.longitude != null ? Number(row.longitude) : null,

    photos,
    link: row.gpx_url || null,
    gpx_url: row.gpx_url || null,

    tags: normalizeTags(row.tags),

    distance_km: row.distance_km != null ? Number(row.distance_km) : null,
    elevation_gain_m: row.elevation_gain_m ?? null,
    duration_minutes: row.duration_minutes ?? null,

    difficulty: row.difficulty != null ? String(row.difficulty) : null,
    dog_difficulty: row.dog_difficulty != null ? String(row.dog_difficulty) : null,
    water_availability: mapSupabaseWaterLevel(row.water_availability),

    is_premium: row.is_premium === true,
    status: row.status,
    visibility: "public",

    season: row.season || null,
    seasons: row.season ? [row.season] : [],
    availability: null,

    hazard_notes: row.hazard_notes || null,
    parking_info: row.parking_info || null,
    restaurant_info: row.restaurant_info || null,
    notes: row.notes || null,
    date: row.date || null,

    _source: "sheets",
    _public_hike_id: row.id,
  };
}

async function getLegacySheetHikes() {
  try {
    const response = await fetch(SHEETS_CSV_URL);
    if (!response.ok) {
      console.error("[sheetsClient] fetch failed, status:", response.status);
      return [];
    }
    const text = await response.text();
    const rows = parseCsv(text);
    const hikes = rows
      .filter((row) => row.status === "approved")
      .map((row, index) => rowToHike(row, index));
    return hikes;
  } catch (err) {
    console.error("[sheetsClient] error:", err);
    return [];
  }
}

/**
 * Fetches all approved hikes from Supabase.
 * Falls back to the old public Google Sheet if the new source is not readable yet.
 */
export async function getHikes() {
  try {
    const { data: hikeRows, error: hikesError } = await supabase
      .from("public_hikes")
      .select("*")
      .eq("status", "approved")
      .order("date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (hikesError) throw hikesError;
    if (!hikeRows?.length) return [];

    const hikeIds = hikeRows.map((row) => row.id);
    const { data: photoRows, error: photosError } = await supabase
      .from("public_hike_photos")
      .select("hike_id, photo_url, sort_order")
      .in("hike_id", hikeIds)
      .order("sort_order", { ascending: true });

    if (photosError) throw photosError;

    const photosByHikeId = {};
    for (const photoRow of photoRows ?? []) {
      if (!photosByHikeId[photoRow.hike_id]) {
        photosByHikeId[photoRow.hike_id] = [];
      }
      photosByHikeId[photoRow.hike_id].push(photoRow.photo_url);
    }

    return hikeRows.map((row) => publicHikeRowToHike(row, photosByHikeId[row.id] ?? []));
  } catch (err) {
    console.error("[sheetsClient] public_hikes fetch failed, falling back to sheet:", err);
    return getLegacySheetHikes();
  }
}

/**
 * Converts an approved journal_entry (from Supabase) into the same
 * Hike shape used throughout the app so both sources are interchangeable.
 */
// dog and profile are pre-fetched objects passed in from getApprovedJournalEntries
function journalEntryToHike(entry, dog = null, profile = null) {
  const seasons = Array.isArray(entry.seasons)
    ? entry.seasons.filter(Boolean)
    : [];

  return {
    id: `journal-${entry.id}`,
    trail_name: entry.title,
    location: entry.location || null,
    country: null,

    latitude: entry.latitude ? Number(entry.latitude) : null,
    longitude: entry.longitude ? Number(entry.longitude) : null,

    photos: Array.isArray(entry.photos) ? entry.photos : [],
    link: null,
    tags: [],

    distance_km: entry.distance_km ? Number(entry.distance_km) : null,
    elevation_gain_m: entry.elevation_m || null,
    duration_minutes: entry.duration_minutes || null,

    difficulty: entry.difficulty ? String(entry.difficulty) : null,
    dog_difficulty: entry.dog_difficulty ? String(entry.dog_difficulty) : null,

    water_availability:
      entry.water_available === 0 ? "none"
      : entry.water_available === 1 ? "little"
      : entry.water_available === 2 ? "moderate"
      : entry.water_available === 3 ? "plenty"
      : null,

    is_premium: false,
    status: "approved",
    visibility: "public",

    season: seasons[0] || null,
    seasons,
    availability: null,

    hazard_notes: entry.hazard_notes || null,
    parking_info: null,
    restaurant_info: null,
    notes: entry.description || null,

    // Journal metadata
    rating: entry.rating || null,
    dog_suitable: entry.dog_suitable,
    date: entry.date || null,

    // Dog & author info for display
    dog_photo_url: dog?.photo_url || null,
    dog_name: dog?.name || null,
    author_username: profile?.username || profile?.full_name || null,
    author_avatar: profile?.avatar_url || null,

    _source: "journal",
    _journal_id: entry.id,
    _user_id: entry.user_id,
  };
}

/**
 * Fetches approved journal entries from Supabase.
 * Returns [] gracefully if Supabase is unavailable.
 */
async function getApprovedJournalEntries() {
  try {
    const { supabase } = await import("@/lib/supabaseClient");
    const { hydrateJournalEntriesMedia } = await import("@/lib/journalApi");

    // 1. Fetch approved public entries
    const { data: entries, error } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("status", "approved")
      .eq("visibility", "public");

    if (error) {
      console.error("[sheetsClient] Supabase journal fetch error:", error.message);
      return [];
    }
    if (!entries?.length) return [];

    const hydratedEntries = await hydrateJournalEntriesMedia(entries);

    // 2. Fetch dogs for entries that have a dog_id
    const dogIds = [...new Set(hydratedEntries.filter((e) => e.dog_id).map((e) => e.dog_id))];
    const dogMap = {};
    if (dogIds.length > 0) {
      const { data: dogs } = await supabase
        .from("dogs")
        .select("id, name, photo_url")
        .in("id", dogIds);
      (dogs ?? []).forEach((d) => { dogMap[d.id] = d; });
    }

    // 3. Fetch author profiles (separate query — no direct FK to public.profiles)
    const userIds = [...new Set(hydratedEntries.map((e) => e.user_id))];
    const profileMap = {};
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, username, full_name, avatar_url")
      .in("user_id", userIds);
    (profiles ?? []).forEach((p) => { profileMap[p.user_id] = p; });

    return hydratedEntries.map((entry) =>
      journalEntryToHike(
        entry,
        dogMap[entry.dog_id] ?? null,
        profileMap[entry.user_id] ?? null,
      )
    );
  } catch (err) {
    console.error("[sheetsClient] getApprovedJournalEntries failed:", err);
    return [];
  }
}

/**
 * Combines Google Sheets hikes + approved Supabase journal entries.
 * Keeps Sheets and journal hikes separate, even when ids collide.
 * Use this as the single source of truth for all public hike lists.
 */
export async function getAllHikes() {
  const [sheetsHikes, journalHikes] = await Promise.all([
    getHikes(),
    getApprovedJournalEntries(),
  ]);

  return [...sheetsHikes, ...journalHikes];
}
