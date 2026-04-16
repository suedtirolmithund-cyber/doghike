import { supabase } from "./supabaseClient";

// Fetch all journal entries with status "pending" + author profile
export async function getPendingEntries() {
  console.log("[adminApi] getPendingEntries called");

  // Step 1: fetch entries without join to isolate RLS / status issues
  const { data, error, status, statusText } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  console.log("[adminApi] HTTP status:", status, statusText);
  console.log("[adminApi] error:", error);
  console.log("[adminApi] data length:", data?.length ?? "null");
  console.log("[adminApi] data:", data);

  if (error) throw error;
  if (!data || data.length === 0) return [];

  // Step 2: fetch profiles separately to avoid FK-join issue
  const userIds = [...new Set(data.map((e) => e.user_id))];
  console.log("[adminApi] fetching profiles for user_ids:", userIds);

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("user_id, username, full_name, avatar_url")
    .in("user_id", userIds);

  console.log("[adminApi] profiles error:", profilesError);
  console.log("[adminApi] profiles:", profiles);

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

// ── Comment moderation ───────────────────────────────────────
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
