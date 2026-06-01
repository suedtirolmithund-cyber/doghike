import { supabase } from "./supabaseClient";
import { optimizeImageForUpload, validateImageUpload } from "./uploadValidation";

function sanitizeUsername(username) {
  if (typeof username !== "string") return null;
  const normalized = username.trim().replace(/^@+/, "").toLowerCase();
  return normalized || null;
}

function getStorageDescriptor(fileUrl, bucket) {
  if (!fileUrl || typeof fileUrl !== "string") return null;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = fileUrl.indexOf(marker);
  if (index === -1) return null;

  return {
    bucket,
    path: decodeURIComponent(fileUrl.slice(index + marker.length)),
  };
}

function normalizeNullableText(value) {
  if (typeof value !== "string") return value ?? null;
  const trimmed = value.trim();
  return trimmed || null;
}

function sanitizeDogPayload(dogData = {}) {
  return {
    ...dogData,
    name: typeof dogData.name === "string" ? dogData.name.trim() : dogData.name,
    breed: normalizeNullableText(dogData.breed),
    birth_date: normalizeNullableText(dogData.birth_date),
    character: normalizeNullableText(dogData.character),
    notes: normalizeNullableText(dogData.notes),
    favorite_food: normalizeNullableText(dogData.favorite_food),
    photo_url: normalizeNullableText(dogData.photo_url),
  };
}

function sanitizeProfileUpdates(updates = {}) {
  const {
    role,
    is_premium,
    stripe_customer_id,
    stripe_subscription_id,
    premium_current_period_end,
    premium_updated_at,
    subscription_status,
    ...safeUpdates
  } = updates;

  return {
    ...safeUpdates,
    username: Object.prototype.hasOwnProperty.call(safeUpdates, "username")
      ? sanitizeUsername(safeUpdates.username)
      : safeUpdates.username,
  };
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

// ── File upload ──────────────────────────────────────────────
export async function uploadFile(bucket, userId, file) {
  validateImageUpload(file);
  const preparedFile = await optimizeImageForUpload(file);
  const ext = preparedFile.name.split(".").pop();
  const path = `${userId}/${Date.now()}.${ext}`;
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, preparedFile, { upsert: true, contentType: preparedFile.type });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);
  return publicUrl;
}

// ── Profiles ─────────────────────────────────────────────────
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
  // PGRST116 = row not found – kein Fehler, Profil noch nicht angelegt
  if (error && error.code !== "PGRST116") throw error;
  return data ?? null;
}

export async function upsertProfile(userId, updates) {
  const nextUpdates = sanitizeProfileUpdates(updates);

  if (Object.prototype.hasOwnProperty.call(nextUpdates, "username")) {
    if (nextUpdates.username) {
      const { data: currentProfile, error: currentProfileError } = await supabase
        .from("public_profiles")
        .select("username")
        .eq("user_id", userId)
        .maybeSingle();

      if (currentProfileError) throw currentProfileError;

      const currentUsername = sanitizeUsername(currentProfile?.username);

      if (currentUsername === nextUpdates.username) {
        const { data, error } = await supabase
          .from("profiles")
          .upsert({ user_id: userId, ...nextUpdates }, { onConflict: "user_id" })
          .select()
          .single();
        if (error) throw error;
        return data;
      }

      const { data: existingProfiles, error: usernameError } = await supabase
        .from("profiles")
        .select("user_id, username")
        .neq("user_id", userId)
        .not("username", "is", null);

      if (usernameError) throw usernameError;

      const conflictingProfile = (existingProfiles ?? []).find(
        (profile) => sanitizeUsername(profile.username) === nextUpdates.username
      );

      if (conflictingProfile?.user_id) {
        const error = new Error("username_taken");
        error.code = "USERNAME_TAKEN";
        throw error;
      }
    }
  }

  const { data, error } = await supabase
    .from("profiles")
    .upsert({ user_id: userId, ...nextUpdates }, { onConflict: "user_id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Dogs ─────────────────────────────────────────────────────
export async function getDogs(userId) {
  const { data, error } = await supabase
    .from("dogs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getDogProfileCount() {
  const { data: rpcCount, error: rpcError } = await supabase.rpc("get_public_dog_profile_count");

  if (!rpcError && typeof rpcCount === "number") {
    return rpcCount;
  }

  const { count, error } = await supabase
    .from("dogs")
    .select("id", { count: "exact", head: true });

  if (!error && typeof count === "number") {
    return count;
  }

  const { data, error: fallbackError } = await supabase
    .from("dogs")
    .select("id");

  if (fallbackError) throw fallbackError;
  return Array.isArray(data) ? data.length : 0;
}

export async function createDog(userId, dogData) {
  const payload = sanitizeDogPayload(dogData);
  const { data, error } = await supabase
    .from("dogs")
    .insert({ user_id: userId, ...payload })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateDog(dogId, dogData) {
  const currentUserId = await requireCurrentUserId();
  // Strip system fields that must not appear in an UPDATE payload
  const { id, user_id, created_at, updated_at, ...safeData } = dogData;
  const payload = sanitizeDogPayload(safeData);

  const { data, error } = await supabase
    .from("dogs")
    .update(payload)
    .eq("id", dogId)
    .eq("user_id", currentUserId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteDog(dogId) {
  const currentUserId = await requireCurrentUserId();
  const { data: existingDog, error: fetchError } = await supabase
    .from("dogs")
    .select("photo_url")
    .eq("id", dogId)
    .eq("user_id", currentUserId)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") throw fetchError;
  if (!existingDog) {
    throw new Error("Hund nicht gefunden oder keine Berechtigung.");
  }

  const { error } = await supabase
    .from("dogs")
    .delete()
    .eq("id", dogId)
    .eq("user_id", currentUserId);
  if (error) throw error;

  if (existingDog?.photo_url) {
    try {
      await deleteStoredFile(existingDog.photo_url, "dog-photos");
    } catch (cleanupError) {
      console.error("Dog delete cleanup failed:", cleanupError);
    }
  }
}

export async function deleteStoredFile(fileUrl, bucket) {
  const storageDescriptor = getStorageDescriptor(fileUrl, bucket);
  if (!storageDescriptor) return;

  const { error } = await supabase.storage
    .from(storageDescriptor.bucket)
    .remove([storageDescriptor.path]);

  if (error) throw error;
}
