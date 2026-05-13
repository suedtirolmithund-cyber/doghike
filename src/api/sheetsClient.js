import { supabase } from "@/lib/supabaseClient";
import { resolvePublicHikePhotoReferences } from "@/lib/publicHikesApi";

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

function normalizeOptionalText(value) {
  if (typeof value !== "string") return value ?? null;

  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.toLowerCase() === "null") return null;
  return trimmed;
}

function pickFirstText(row, keys) {
  for (const key of keys) {
    const value = normalizeOptionalText(row?.[key]);
    if (value) return value;
  }
  return null;
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

  const tags = normalizeTags(...getLegacyTagColumns(row));

  // Wrap single image URL in an array so photos[0] works consistently in the app
  const photos = row.image ? [row.image] : [];

  const id = row.id || (row.title ? slugify(row.title) : String(index));

  return {
    id,
    trail_name: pickFirstText(row, ["title", "trail_name", "name", "tour", "tour_name"]) || row.title,
    location: row.location,
    country: row.country || null,

    latitude: isNaN(parsedLat) ? null : parsedLat,
    longitude: isNaN(parsedLng) ? null : parsedLng,

    photos,
    link: null,

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
    water_availability: (() => { const w = row.water?.trim(); if (!w) return null; return mapSupabaseWaterLevel(w) ?? w; })(),

    is_premium: row.is_premium === "true" || row.is_premium === "1",

    status: row.status,
    // Sheets hikes are always public
    visibility: "public",

    season: row.season || null,
    availability: row.availability || null,

    hazard_notes: pickFirstText(row, ["hazard_notes", "hazards", "danger_notes", "danger", "warning", "warnings", "achtung", "gefahr", "gefahren"]),
    parking_info: pickFirstText(row, ["parking_info", "parking", "parking_notes", "parken", "ausgangspunkt"]),
    restaurant_info: pickFirstText(row, ["restaurant_info", "restaurant", "restaurant_notes", "einkehr", "hutte", "hütte"]),
    notes: pickFirstText(row, ["notes", "description", "beschreibung", "text", "details", "tipps"]),
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

function splitTagString(value) {
  return value
    .split(/[,#;|]/)
    .map((tag) => tag.trim().replace(/^#+/, ""))
    .filter(Boolean);
}

function normalizeTags(...values) {
  return Array.from(
    new Set(
      values.flatMap((value) => {
        if (Array.isArray(value)) {
          return value
            .map((tag) => String(tag).trim().replace(/^#+/, ""))
            .filter(Boolean);
        }

        if (typeof value === "string") {
          return splitTagString(value);
        }

        return [];
      })
    )
  );
}

function getLegacyTagColumns(row) {
  return [
    row?.tags,
    row?.tag,
    row?.tag1,
    row?.tag2,
    row?.tag3,
    row?.tag4,
    row?.tag5,
    row?.tags2,
    row?.tags3,
    row?.tags4,
    row?.tags5,
    row?.["tag 1"],
    row?.["tag 2"],
    row?.["tag 3"],
    row?.["tag 4"],
    row?.["tag 5"],
    row?.tag_1,
    row?.tag_2,
    row?.tag_3,
    row?.tag_4,
    row?.tag_5,
  ];
}

function normalizeStoredPublicPhotoReference(value) {
  if (typeof value !== "string") return "";

  const trimmed = value.trim();
  if (!trimmed) return "";

  return trimmed;
}

function getLegacyPhotoColumns(row) {
  return [
    row?.image,
    row?.bild,
    row?.bilder,
    row?.image2,
    row?.image3,
    row?.image4,
    row?.image5,
    row?.image6,
    row?.image7,
    row?.image8,
    row?.image9,
    row?.image10,
    row?.photo,
    row?.photo2,
    row?.photo3,
    row?.photo4,
    row?.photo5,
    row?.photo6,
    row?.photo7,
    row?.photo8,
    row?.photo9,
    row?.photo10,
    row?.foto,
    row?.foto2,
    row?.foto3,
    row?.foto4,
    row?.foto5,
    row?.foto6,
    row?.foto7,
    row?.foto8,
    row?.foto9,
    row?.foto10,
    row?.bild2,
    row?.bild3,
    row?.bild4,
    row?.bild5,
    row?.fotos,
    row?.fotos2,
    row?.fotos3,
    row?.fotos4,
    row?.fotos5,
    row?.["image 2"],
    row?.["image 3"],
    row?.["image 4"],
    row?.["image 5"],
    row?.["photo 2"],
    row?.["photo 3"],
    row?.["photo 4"],
    row?.["photo 5"],
    row?.["photo 6"],
    row?.["photo 7"],
    row?.["photo 8"],
    row?.["photo 9"],
    row?.["photo 10"],
    row?.["foto 2"],
    row?.["foto 3"],
    row?.["foto 4"],
    row?.["foto 5"],
    row?.["foto 6"],
    row?.["foto 7"],
    row?.["foto 8"],
    row?.["foto 9"],
    row?.["foto 10"],
    row?.["bild 2"],
    row?.["bild 3"],
    row?.["bild 4"],
    row?.["bild 5"],
    row?.["fotos 2"],
    row?.["fotos 3"],
    row?.["fotos 4"],
    row?.["fotos 5"],
    row?.foto_2,
    row?.foto_3,
    row?.foto_4,
    row?.foto_5,
    row?.photo_2,
    row?.photo_3,
    row?.photo_4,
    row?.photo_5,
    row?.photo_6,
    row?.photo_7,
    row?.photo_8,
    row?.photo_9,
    row?.photo_10,
    row?.image_2,
    row?.image_3,
    row?.image_4,
    row?.image_5,
    row?.image_6,
    row?.image_7,
    row?.image_8,
    row?.image_9,
    row?.image_10,
    row?.foto_6,
    row?.foto_7,
    row?.foto_8,
    row?.foto_9,
    row?.foto_10,
    row?.bild_2,
    row?.bild_3,
    row?.bild_4,
    row?.bild_5,
  ]
    .map((value) => normalizeStoredPublicPhotoReference(value))
    .filter(Boolean);
}

function mergePhotoLists(...photoLists) {
  return Array.from(
    new Set(
      photoLists.flatMap((photoList) =>
        Array.isArray(photoList)
          ? photoList.map((photo) => (typeof photo === "string" ? photo.trim() : "")).filter(Boolean)
          : []
      )
    )
  );
}

function publicHikeRowToHike(row, photos = []) {
  return {
    // Keep the old external id shape stable so saved hikes, comments, and ratings keep matching.
    id: slugify(row.title || String(row.id)),
    route_id: String(row.id),
    trail_name: pickFirstText(row, ["title", "trail_name", "name", "tour", "tour_name"]) || row.title,
    location: row.location,
    country: row.country || null,

    latitude: row.latitude != null ? Number(row.latitude) : null,
    longitude: row.longitude != null ? Number(row.longitude) : null,

    photos,
    link: null,
    gpx_url: null,

    tags: normalizeTags(...getLegacyTagColumns(row)),

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

    hazard_notes: pickFirstText(row, ["hazard_notes", "hazards", "danger_notes", "danger", "warning", "warnings", "achtung", "gefahr", "gefahren"]),
    parking_info: pickFirstText(row, ["parking_info", "parking", "parking_notes", "parken", "ausgangspunkt"]),
    restaurant_info: pickFirstText(row, ["restaurant_info", "restaurant", "restaurant_notes", "einkehr", "hutte", "hütte"]),
    notes: pickFirstText(row, ["notes", "description", "beschreibung", "text", "details", "tipps"]),
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

    if (photosError) {
      console.error("[sheetsClient] public_hike_photos fetch failed, continuing without table photos:", photosError);
    }

    const photosByHikeId = {};
    for (const photoRow of photoRows ?? []) {
      if (!photosByHikeId[photoRow.hike_id]) {
        photosByHikeId[photoRow.hike_id] = [];
      }
      photosByHikeId[photoRow.hike_id].push(photoRow.photo_url);
    }

    const hikes = await Promise.all(
      hikeRows.map(async (row) => {
        const resolvedPhotos = await resolvePublicHikePhotoReferences(
          mergePhotoLists(photosByHikeId[row.id] ?? [], getLegacyPhotoColumns(row))
        );

        return publicHikeRowToHike(row, resolvedPhotos);
      })
    );

    return hikes;
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

    hazard_notes: normalizeOptionalText(entry.hazard_notes),
    parking_info: null,
    restaurant_info: null,
    notes: normalizeOptionalText(entry.description),

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
