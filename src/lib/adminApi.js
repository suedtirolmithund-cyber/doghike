import { supabase } from "./supabaseClient";

// Fetch all journal entries with status "pending" + author profile
export async function getPendingEntries() {
  const { data, error } = await supabase
    .from("journal_entries")
    .select(`
      *,
      profiles:user_id ( username, full_name, avatar_url )
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
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
