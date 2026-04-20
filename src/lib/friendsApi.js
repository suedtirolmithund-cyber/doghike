import { supabase } from "./supabaseClient";

// Returns all friendships involving the current user (pending + accepted)
export async function getFriendships(userId) {
  const { data, error } = await supabase
    .from("friendships")
    .select("*")
    .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// Accepted friends only — returns the OTHER user's id for each friendship
export async function getFriendIds(userId) {
  const friendships = await getFriendships(userId);
  return friendships
    .filter((f) => f.status === "accepted")
    .map((f) => (f.requester_id === userId ? f.receiver_id : f.requester_id));
}

// Send a friend request
export async function sendFriendRequest(requesterId, receiverId) {
  const { data, error } = await supabase
    .from("friendships")
    .insert({ requester_id: requesterId, receiver_id: receiverId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Accept a request (only receiver can do this)
export async function acceptFriendRequest(friendshipId) {
  const { error } = await supabase
    .from("friendships")
    .update({ status: "accepted" })
    .eq("id", friendshipId);
  if (error) throw error;
}

// Reject a request
export async function rejectFriendRequest(friendshipId) {
  const { error } = await supabase
    .from("friendships")
    .update({ status: "rejected" })
    .eq("id", friendshipId);
  if (error) throw error;
}

// Remove a friend (either side can do this)
export async function removeFriend(friendshipId) {
  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId);
  if (error) throw error;
}

// Search profiles by username (excludes self)
export async function searchProfiles(query, currentUserId) {
  if (!query.trim()) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, username, full_name, avatar_url")
    .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
    .neq("user_id", currentUserId)
    .limit(10);
  if (error) throw error;
  return data ?? [];
}

// Journal entries from friends with visibility = 'friends' or 'public' (approved)
export async function getFriendFeedEntries(friendIds) {
  if (!friendIds.length) return [];
  // friends entries: show approved OR draft (before the status fix was deployed)
  // public entries: only show approved (went through admin review)
  const { data, error } = await supabase
    .from("journal_entries")
    .select("*")
    .in("user_id", friendIds)
    .or("and(visibility.eq.friends,status.in.(approved,draft)),and(visibility.eq.public,status.eq.approved)")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  if (!data?.length) return [];

  // Fetch author profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, username, full_name, avatar_url")
    .in("user_id", friendIds);
  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.user_id, p]));

  return data.map((e) => ({ ...e, profile: profileMap[e.user_id] ?? null }));
}
