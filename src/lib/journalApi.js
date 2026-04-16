import { supabase } from "./supabaseClient";

export async function getJournalEntries(userId) {
  const { data, error } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });
  if (error) throw error;
  return data ?? [];
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

export async function createJournalEntry(userId, entry) {
  const { data, error } = await supabase
    .from("journal_entries")
    .insert({ user_id: userId, ...entry })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateJournalEntry(id, entry) {
  const { data, error } = await supabase
    .from("journal_entries")
    .update(entry)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteJournalEntry(id) {
  const { error } = await supabase
    .from("journal_entries")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// Upload photo or GPX to "journal" bucket
export async function uploadJournalFile(userId, file) {
  const ext = file.name.split(".").pop();
  const path = `${userId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const { data, error } = await supabase.storage
    .from("journal")
    .upload(path, file, { upsert: true });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage
    .from("journal")
    .getPublicUrl(data.path);
  return publicUrl;
}
