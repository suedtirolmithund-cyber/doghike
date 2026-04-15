import { supabase } from "./supabaseClient";

// ── File upload ──────────────────────────────────────────────
export async function uploadFile(bucket, userId, file) {
  const ext = file.name.split(".").pop();
  const path = `${userId}/${Date.now()}.${ext}`;
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true });
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
  const { data, error } = await supabase
    .from("profiles")
    .upsert({ user_id: userId, ...updates }, { onConflict: "user_id" })
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

export async function createDog(userId, dogData) {
  const { data, error } = await supabase
    .from("dogs")
    .insert({ user_id: userId, ...dogData })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateDog(dogId, dogData) {
  const { data, error } = await supabase
    .from("dogs")
    .update(dogData)
    .eq("id", dogId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDog(dogId) {
  const { error } = await supabase
    .from("dogs")
    .delete()
    .eq("id", dogId);
  if (error) throw error;
}
