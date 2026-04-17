import { supabase } from "./supabaseClient";

export async function getPendingEntries() {
  const { data, error } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error) throw error;
  if (!data?.length) return [];

  const userIds = [...new Set(data.map((e) => e.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, username, full_name, avatar_url")
    .in("user_id", userIds);

  const profileMap = Object.fromEntries(
    (profiles ?? []).map((p) => [p.user_id, p])
  );
  return data.map((entry) => ({
    ...entry,
    profiles: profileMap[entry.user_id] ?? null,
  }));
}

export async function approveEntry(id) {
  const { error } = await supabase
    .from("journal_entries")
    .update({ status: "approved" })
    .eq("id", id);
  if (error) throw error;
}

export async function rejectEntry(id, reason) {
  const { error } = await supabase
    .from("journal_entries")
    .update({ status: "rejected", rejection_reason: reason || null })
    .eq("id", id);
  if (error) throw error;
}

export async function getAllComments() {
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!data?.length) return [];

  const userIds = [...new Set(data.map((c) => c.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, username, full_name, avatar_url")
    .in("user_id", userIds);

  const profileMap = Object.fromEntries(
    (profiles ?? []).map((p) => [p.user_id, p])
  );
  return data.map((c) => ({ ...c, profiles: profileMap[c.user_id] ?? null }));
}

export async function adminDeleteComment(id) {
  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) throw error;
}
