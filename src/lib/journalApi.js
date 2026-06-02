import { supabase } from "./supabaseClient";
import { optimizeImageForUpload, validateImageUpload } from "./uploadValidation";

const JOURNAL_SIGNED_URL_TTL_SECONDS = 60 * 60;

export function getMissingPrivateJournalFields(entry) {
  const missing = [];

  if (!entry?.title?.trim()) missing.push("Titel");
  if (!entry?.location?.trim()) missing.push("Ort");
  if (entry?.latitude === "" || entry?.latitude == null || entry?.longitude === "" || entry?.longitude == null) {
    missing.push("Startpunkt auf Karte");
  }

  return missing;
}

export function getMissingFriendsJournalFields(entry) {
  const missing = [];

  if (!entry?.title?.trim()) missing.push("Titel");
  if (!entry?.location?.trim()) missing.push("Ort");
  if (entry?.latitude === "" || entry?.latitude == null || entry?.longitude === "" || entry?.longitude == null) {
    missing.push("Startpunkt auf Karte");
  }
  if (entry?.distance_km === "" || entry?.distance_km == null) missing.push("Distanz (km)");
  if (entry?.elevation_m === "" || entry?.elevation_m == null) missing.push("Höhenmeter");
  if (entry?.duration_minutes === "" || entry?.duration_minutes == null) missing.push("Dauer (Stunden)");
  if (!entry?.difficulty) missing.push("Schwierigkeit (Mensch)");
  if (!entry?.dog_difficulty) missing.push("Schwierigkeit (Hund)");
  if (entry?.water_available === "" || entry?.water_available == null) missing.push("Wasserverfügbarkeit");

  return missing;
}

export function getMissingSharedJournalFields(entry) {
  const missing = [];

  if (!entry?.title?.trim()) missing.push("Titel");
  if (!entry?.location?.trim()) missing.push("Ort");
  if (entry?.latitude === "" || entry?.latitude == null || entry?.longitude === "" || entry?.longitude == null) {
    missing.push("Startpunkt auf Karte");
  }
  if (entry?.distance_km === "" || entry?.distance_km == null) missing.push("Distanz (km)");
  if (entry?.elevation_m === "" || entry?.elevation_m == null) missing.push("Höhenmeter");
  if (entry?.duration_minutes === "" || entry?.duration_minutes == null) missing.push("Dauer (Stunden)");
  if (!entry?.difficulty) missing.push("Schwierigkeit (Mensch)");
  if (!entry?.dog_difficulty) missing.push("Schwierigkeit (Hund)");
  if (entry?.water_available === "" || entry?.water_available == null) missing.push("Wasserverfügbarkeit");
  if (!entry?.description?.trim()) missing.push("Beschreibung");
  if (!Array.isArray(entry?.photos) || entry.photos.length === 0) missing.push("Mindestens 1 Foto");
  if (!Array.isArray(entry?.seasons) || entry.seasons.length === 0) missing.push("Empfohlene Jahreszeit");

  return missing;
}

export function getMissingPublicJournalFields(entry) {
  return getMissingSharedJournalFields(entry);
}

export function validatePublicJournalEntry(entry) {
  const missing = getMissingSharedJournalFields(entry);
  if (missing.length > 0) {
    throw new Error(`Fehlende Pflichtfelder für öffentliche Touren: ${missing.join(", ")}`);
  }
}

function isRemoteJournalReference(value) {
  return typeof value === "string" && /^(https?:|blob:|data:)/i.test(value);
}

function isJournalStoragePath(value) {
  return typeof value === "string" && value.length > 0 && !isRemoteJournalReference(value);
}

function getCommentStorageDescriptor(photoReference) {
  if (!photoReference) return null;

  if (photoReference.startsWith("pending://")) {
    return {
      bucket: "comments-pending",
      path: photoReference.slice("pending://".length),
    };
  }

  const marker = "/storage/v1/object/public/comments/";
  const index = photoReference.indexOf(marker);
  if (index === -1) return null;

  return {
    bucket: "comments",
    path: decodeURIComponent(photoReference.slice(index + marker.length)),
  };
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function removeStoragePathsWithRetry(bucket, paths, logLabel, attempts = 3) {
  const uniquePaths = [...new Set((paths ?? []).filter(Boolean))];
  if (uniquePaths.length === 0) return;

  let lastError = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const { error } = await supabase.storage
      .from(bucket)
      .remove(uniquePaths);

    if (!error) {
      return;
    }

    lastError = error;

    if (attempt < attempts) {
      await delay(250 * attempt);
    }
  }

  console.error(
    `[${logLabel}] storage cleanup failed after ${attempts} attempts:`,
    lastError?.message,
    uniquePaths
  );
}

export async function getSignedJournalUrl(fileReference) {
  if (!fileReference) return null;
  if (!isJournalStoragePath(fileReference)) return fileReference;

  const { data, error } = await supabase.storage
    .from("journal")
    .createSignedUrl(fileReference, JOURNAL_SIGNED_URL_TTL_SECONDS);

  if (error) {
    console.error("[getSignedJournalUrl] failed:", error.message);
    return null;
  }

  return data?.signedUrl ?? null;
}

export async function getSignedJournalUrls(fileReferences = []) {
  if (!Array.isArray(fileReferences) || fileReferences.length === 0) return [];

  const resolved = [...fileReferences];
  const storagePaths = [];
  const storageIndexes = [];

  fileReferences.forEach((fileReference, index) => {
    if (isJournalStoragePath(fileReference)) {
      storagePaths.push(fileReference);
      storageIndexes.push(index);
      return;
    }
    resolved[index] = fileReference;
  });

  if (storagePaths.length > 0) {
    const { data, error } = await supabase.storage
      .from("journal")
      .createSignedUrls(storagePaths, JOURNAL_SIGNED_URL_TTL_SECONDS);

    if (error) {
      console.error("[getSignedJournalUrls] failed:", error.message);
      storageIndexes.forEach((index) => {
        resolved[index] = null;
      });
    } else {
      data?.forEach((item, index) => {
        resolved[storageIndexes[index]] = item?.signedUrl ?? null;
      });
    }
  }

  return resolved;
}

export async function hydrateJournalEntryMedia(entry) {
  if (!entry) return entry;

  const [photos, gpxUrl] = await Promise.all([
    getSignedJournalUrls(entry.photos ?? []),
    getSignedJournalUrl(entry.gpx_url),
  ]);

  return {
    ...entry,
    photos: photos.filter(Boolean),
    gpx_url: gpxUrl,
  };
}

export async function hydrateJournalEntriesMedia(entries = []) {
  if (!Array.isArray(entries) || entries.length === 0) return [];
  return Promise.all(entries.map((entry) => hydrateJournalEntryMedia(entry)));
}

export async function getJournalEntries(userId, { limit = 100 } = {}) {
  const { data, error } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function getJournalEntriesForDisplay(userId, options) {
  const entries = await getJournalEntries(userId, options);
  return hydrateJournalEntriesMedia(entries);
}

export async function getJournalEntry(id) {
  const { data, error } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("id", id)
    .single();
  // PGRST116 = row not found — return null instead of throwing
  if (error && error.code !== "PGRST116") throw error;
  return data ?? null;
}

export async function getJournalEntryForDisplay(id) {
  const entry = await getJournalEntry(id);
  return hydrateJournalEntryMedia(entry);
}

function withoutUnsupportedOptionalColumns(entry = {}, error) {
  const fallbackEntry = { ...entry };
  const message = String(error?.message ?? "");

  if (message.includes("dog_ids") && message.includes("column")) {
    delete fallbackEntry.dog_ids;
    if (!fallbackEntry.dog_id && Array.isArray(entry.dog_ids) && entry.dog_ids.length > 0) {
      fallbackEntry.dog_id = entry.dog_ids[0];
    }
  }

  if (message.includes("dog_mood_tags") && message.includes("column")) {
    delete fallbackEntry.dog_mood_tags;
  }

  if (message.includes("seasons") && message.includes("column")) {
    delete fallbackEntry.seasons;
  }

  return fallbackEntry;
}

function isMissingOptionalJournalColumnError(error) {
  const message = String(error?.message ?? "");
  return (
    (message.includes("dog_ids") && message.includes("column")) ||
    (message.includes("dog_mood_tags") && message.includes("column")) ||
    (message.includes("seasons") && message.includes("column"))
  );
}

async function requireCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;

  const userId = data?.user?.id;
  if (!userId) {
    throw new Error("Du musst eingeloggt sein.");
  }

  return userId;
}

export async function createJournalEntry(userId, entry) {
  const payload = { user_id: userId, ...entry };
  let { data, error } = await supabase
    .from("journal_entries")
    .insert(payload)
    .select()
    .single();

  if (error && isMissingOptionalJournalColumnError(error)) {
    ({ data, error } = await supabase
      .from("journal_entries")
      .insert(withoutUnsupportedOptionalColumns(payload, error))
      .select()
      .single());
  }

  if (error) throw error;
  return data;
}

export async function updateJournalEntry(id, entry) {
  const currentUserId = await requireCurrentUserId();
  let { data, error } = await supabase
    .from("journal_entries")
    .update(entry)
    .eq("id", id)
    .eq("user_id", currentUserId)
    .select()
    .single();

  if (error && isMissingOptionalJournalColumnError(error)) {
    ({ data, error } = await supabase
      .from("journal_entries")
      .update(withoutUnsupportedOptionalColumns(entry, error))
      .eq("id", id)
      .eq("user_id", currentUserId)
      .select()
      .single());
  }

  if (error) throw error;
  return data;
}

export async function deleteJournalEntry(id) {
  const currentUserId = await requireCurrentUserId();
  const { data: existingEntry, error: fetchError } = await supabase
    .from("journal_entries")
    .select("photos, gpx_url")
    .eq("id", id)
    .eq("user_id", currentUserId)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") throw fetchError;
  if (!existingEntry) {
    throw new Error("Eintrag nicht gefunden oder keine Berechtigung.");
  }

  const { data: relatedComments, error: commentsFetchError } = await supabase
    .from("comments")
    .select("photo_url")
    .eq("hike_id", id)
    .eq("hike_source", "journal");

  if (commentsFetchError) throw commentsFetchError;

  const { error } = await supabase
    .from("journal_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", currentUserId);
  if (error) throw error;

  const cleanupResults = await Promise.allSettled([
    supabase.from("comments").delete().eq("hike_id", id).eq("hike_source", "journal"),
    supabase.from("ratings").delete().eq("hike_id", id).eq("hike_source", "journal"),
    supabase.from("saved_hikes").delete().eq("hike_id", id).eq("hike_source", "journal"),
  ]);

  cleanupResults.forEach((result, index) => {
    const label = ["comments", "ratings", "saved_hikes"][index];
    const errorMessage =
      result.status === "rejected"
        ? result.reason?.message
        : result.value?.error?.message;

    if (errorMessage) {
      console.error(`[deleteJournalEntry] ${label} cleanup failed:`, errorMessage);
    }
  });

  const storagePaths = [
    ...(Array.isArray(existingEntry?.photos) ? existingEntry.photos : []),
    existingEntry?.gpx_url,
  ].filter((fileReference) => isJournalStoragePath(fileReference));

  if (storagePaths.length > 0) {
    await removeStoragePathsWithRetry("journal", storagePaths, "deleteJournalEntry:journal");
  }

  const commentStorageByBucket = (relatedComments ?? [])
    .map((comment) => getCommentStorageDescriptor(comment.photo_url))
    .filter(Boolean)
    .reduce((acc, descriptor) => {
      acc[descriptor.bucket] = [...(acc[descriptor.bucket] ?? []), descriptor.path];
      return acc;
    }, {});

  await Promise.all(
    Object.entries(commentStorageByBucket).map(async ([bucket, paths]) => {
      await removeStoragePathsWithRetry(bucket, paths, `deleteJournalEntry:${bucket}`);
    })
  );
}

export async function deleteJournalFiles(fileReferences = []) {
  const storagePaths = fileReferences.filter((fileReference) => isJournalStoragePath(fileReference));
  if (storagePaths.length === 0) return;

  await removeStoragePathsWithRetry("journal", storagePaths, "deleteJournalFiles:journal");
}

export async function uploadJournalImage(userId, file) {
  validateImageUpload(file);
  const preparedFile = await optimizeImageForUpload(file);
  const path = `${userId}/${Date.now()}_${preparedFile.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const { data, error } = await supabase.storage
    .from("journal")
    .upload(path, preparedFile, { upsert: true, contentType: preparedFile.type });
  if (error) throw error;
  return data.path;
}

export async function uploadJournalGpx(userId, file) {
  const path = `${userId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const { data, error } = await supabase.storage
    .from("journal")
    .upload(path, file, { upsert: true, contentType: file.type || "application/gpx+xml" });
  if (error) throw error;
  return data.path;
}

// Backward-compatible image upload helper for existing image callers.
export async function uploadJournalFile(userId, file) {
  return uploadJournalImage(userId, file);
}
