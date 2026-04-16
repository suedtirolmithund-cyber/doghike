import { supabase } from "./supabaseClient";

// ── Saved Hikes ───────────────────────────────────────────────
export async function getSavedHikes(userId) {
  const { data, error } = await supabase
    .from("saved_hikes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function saveHike(userId, hikeId, hikeSource = "sheets") {
  const { data, error } = await supabase
    .from("saved_hikes")
    .upsert({ user_id: userId, hike_id: hikeId, hike_source: hikeSource },
             { onConflict: "user_id,hike_id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function unsaveHike(userId, hikeId) {
  const { error } = await supabase
    .from("saved_hikes")
    .delete()
    .eq("user_id", userId)
    .eq("hike_id", hikeId);
  if (error) throw error;
}

// ── Ratings ───────────────────────────────────────────────────
export async function getRatings(hikeId) {
  const { data, error } = await supabase
    .from("ratings")
    .select("*")
    .eq("hike_id", hikeId);
  if (error) throw error;
  return data ?? [];
}

export async function upsertRating(userId, hikeId, rating) {
  const { data, error } = await supabase
    .from("ratings")
    .upsert({ user_id: userId, hike_id: hikeId, rating },
             { onConflict: "user_id,hike_id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Comments ──────────────────────────────────────────────────
export async function getComments(hikeId) {
  const { data, error } = await supabase
    .from("comments")
    .select(`*, profiles:user_id ( username, full_name, avatar_url )`)
    .eq("hike_id", hikeId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createComment(userId, hikeId, text, photoUrl = null) {
  const { data, error } = await supabase
    .from("comments")
    .insert({ user_id: userId, hike_id: hikeId, text, photo_url: photoUrl })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteComment(id) {
  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) throw error;
}

// ── Trigger-Wörter Filter ─────────────────────────────────────
const TRIGGER_WORDS = [
  // Spam
  "spam", "klick hier", "click here", "gratis", "gewinn", "casino", "werbung",
  "http://", "https://bit.ly", "t.me/", "whatsapp.com",
  // Hate / Beleidigung (DE/IT/EN)
  "scheiß", "scheiss", "hurensohn", "wichser", "arschloch", "idiot", "dummkopf",
  "nazi", "heil", "fotze", "nutte", "fick", "kacke", "bastard", "asshole",
  "fuck", "shit", "bitch", "cunt", "nigger", "retard",
  "cazzo", "vaffanculo", "stronzo", "puttana", "merda",
];

export function containsTriggerWord(text) {
  const lower = text.toLowerCase();
  return TRIGGER_WORDS.some((w) => lower.includes(w));
}

export async function reportComment(commentId, reason = "") {
  const { error } = await supabase
    .from("comments")
    .update({ reported: true, reported_reason: reason || null })
    .eq("id", commentId);
  if (error) throw error;
}

export async function uploadCommentPhoto(userId, file) {
  const ext = file.name.split(".").pop();
  const path = `${userId}/${Date.now()}.${ext}`;
  const { data, error } = await supabase.storage
    .from("comments")
    .upload(path, file, { upsert: true });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from("comments").getPublicUrl(data.path);
  return publicUrl;
}
