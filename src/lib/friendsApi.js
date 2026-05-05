import { supabase } from "./supabaseClient";
import { hydrateJournalEntriesMedia } from "./journalApi";

async function triggerFriendshipWebPush(eventType, friendshipId) {
  if (!friendshipId) return;

  try {
    await supabase.functions.invoke("send-web-push", {
      body: {
        type: eventType,
        friendshipId,
      },
    });
  } catch (error) {
    console.error("[WebPush] Versand fehlgeschlagen:", error);
  }
}

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

// Accepted friends only - returns the other user's id for each friendship
export async function getFriendIds(userId) {
  const friendships = await getFriendships(userId);
  return friendships
    .filter((f) => f.status === "accepted")
    .map((f) => (f.requester_id === userId ? f.receiver_id : f.requester_id));
}

// Send a friend request
export async function sendFriendRequest(requesterId, receiverId) {
  if (!requesterId || !receiverId) {
    throw new Error("Freundschaftsanfrage unvollständig.");
  }

  if (requesterId === receiverId) {
    throw new Error("Du kannst dir nicht selbst eine Freundschaftsanfrage senden.");
  }

  const { data: existing, error: existingError } = await supabase
    .from("friendships")
    .select("id, requester_id, receiver_id, status")
    .or(
      `and(requester_id.eq.${requesterId},receiver_id.eq.${receiverId}),and(requester_id.eq.${receiverId},receiver_id.eq.${requesterId})`
    );

  if (existingError) throw existingError;

  const acceptedFriendship = (existing ?? []).find((friendship) => friendship.status === "accepted");
  if (acceptedFriendship) {
    throw new Error("Ihr seid bereits befreundet.");
  }

  const staleFriendships = (existing ?? []).filter((friendship) => friendship.status !== "accepted");
  if (staleFriendships.length > 0) {
    const { error: deleteError } = await supabase
      .from("friendships")
      .delete()
      .in("id", staleFriendships.map((friendship) => friendship.id));

    if (deleteError) throw deleteError;
  }

  const { data, error } = await supabase
    .from("friendships")
    .insert({ requester_id: requesterId, receiver_id: receiverId })
    .select()
    .single();
  if (error) throw error;
  await triggerFriendshipWebPush("friend_request", data.id);
  return data;
}

// Accept a request (only receiver can do this)
export async function acceptFriendRequest(friendshipId) {
  const { error } = await supabase
    .from("friendships")
    .update({ status: "accepted" })
    .eq("id", friendshipId);
  if (error) throw error;
  await triggerFriendshipWebPush("friend_accepted", friendshipId);
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

// Search profiles by username or full_name (excludes self)
export async function searchProfiles(query, currentUserId) {
  const q = query.trim().replace(/[,%()]/g, " ").replace(/\s+/g, " ");
  if (!q) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, username, full_name, avatar_url")
    .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
    .neq("user_id", currentUserId)
    .limit(15);

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

  const hydratedEntries = await hydrateJournalEntriesMedia(data);
  return hydratedEntries.map((entry) => ({ ...entry, profile: profileMap[entry.user_id] ?? null }));
}
