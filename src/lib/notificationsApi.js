import { supabase } from "@/lib/supabaseClient";
import { createPageUrl } from "@/utils";

const NOTIFICATION_SEEN_KEY = "doghike:notifications-seen";
const NOTIFICATION_START_KEY = "doghike:notifications-start";

function getSeenStorageKey(userId) {
  return `${NOTIFICATION_SEEN_KEY}:${userId}`;
}

function getStartStorageKey(userId) {
  return `${NOTIFICATION_START_KEY}:${userId}`;
}

function readSeenAt(userId) {
  if (!userId || typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(getSeenStorageKey(userId));
  } catch {
    return null;
  }
}

function writeSeenAt(userId, value) {
  if (!userId || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(getSeenStorageKey(userId), value);
  } catch {
    // Ignore localStorage issues and keep notifications usable.
  }
}

function readStartAt(userId) {
  if (!userId || typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(getStartStorageKey(userId));
  } catch {
    return null;
  }
}

function writeStartAt(userId, value) {
  if (!userId || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(getStartStorageKey(userId), value);
  } catch {
    // Ignore localStorage issues and keep notifications usable.
  }
}

function getNotificationTime(notification) {
  const timestamp = notification?.time ? new Date(notification.time).getTime() : NaN;
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function profileHasActivePremium(profile) {
  if (!profile?.is_premium) return false;
  if (!profile?.premium_current_period_end) return true;

  const premiumEndTimestamp = new Date(profile.premium_current_period_end).getTime();
  return Number.isFinite(premiumEndTimestamp) && premiumEndTimestamp > Date.now();
}

export function getNotificationsSeenAt(userId) {
  return readSeenAt(userId);
}

export function markNotificationsSeen(userId, seenAt = new Date().toISOString()) {
  writeSeenAt(userId, seenAt);
}

export function getNotificationsStartAt(userId) {
  return readStartAt(userId);
}

export function initializeNotificationsStartAt(userId, startAt = new Date().toISOString()) {
  if (!readStartAt(userId)) {
    writeStartAt(userId, startAt);
  }
}

export function resetNotificationsStartAt(userId, startAt = new Date().toISOString()) {
  writeStartAt(userId, startAt);
}

export function subscribeToNotificationStorage(userId, onChange) {
  if (!userId || typeof window === "undefined" || typeof onChange !== "function") {
    return () => {};
  }

  const seenKey = getSeenStorageKey(userId);
  const startKey = getStartStorageKey(userId);

  const handleStorage = (event) => {
    if (event.storageArea !== window.localStorage) return;
    if (event.key !== seenKey && event.key !== startKey) return;
    onChange(event);
  };

  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener("storage", handleStorage);
  };
}

function isAtOrAfterStartTime(notification, startAt) {
  if (!startAt) return true;

  const startTimestamp = new Date(startAt).getTime();
  if (!Number.isFinite(startTimestamp)) return true;

  return getNotificationTime(notification) >= startTimestamp;
}

export async function loadNotifications(userId) {
  const results = [];
  const startAt = readStartAt(userId);

  const { data: currentProfile, error: currentProfileError } = await supabase
    .from("profiles")
    .select("is_premium, premium_current_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  if (currentProfileError) throw currentProfileError;

  const { data: incoming, error: incomingError } = await supabase
    .from("friendships")
    .select("id, requester_id, created_at")
    .eq("receiver_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (incomingError) throw incomingError;

  if (incoming?.length) {
    const requesterIds = incoming.map((friendship) => friendship.requester_id);
    const { data: profiles, error: profileError } = await supabase
      .from("public_profiles")
      .select("user_id, full_name, username, avatar_url")
      .in("user_id", requesterIds);

    if (profileError) throw profileError;

    const profileMap = Object.fromEntries((profiles ?? []).map((profile) => [profile.user_id, profile]));

    incoming.forEach((friendship) => {
      const profile = profileMap[friendship.requester_id];

      results.push({
        id: `fr-${friendship.id}`,
        type: "friend_request",
        title: `${profile?.full_name || profile?.username || "Jemand"} möchte dein Freund sein`,
        time: friendship.created_at,
        link: createPageUrl("Friends"),
      });
    });
  }

  const { data: myEntries, error: myEntriesError } = await supabase
    .from("journal_entries")
    .select("id, title, status, visibility, updated_at, created_at, rejection_reason")
    .eq("user_id", userId)
    .eq("visibility", "public")
    .in("status", ["pending", "approved", "rejected"])
    .order("updated_at", { ascending: false })
    .limit(10);

  if (myEntriesError) throw myEntriesError;

  (myEntries ?? []).forEach((entry) => {
    const pending = entry.status === "pending";
    const approved = entry.status === "approved";

    results.push({
      id: `je-${entry.id}`,
      type: pending ? "pending" : approved ? "approved" : "rejected",
      title: pending
        ? `"${entry.title}" wartet auf die Admin-Prüfung`
        : approved
          ? `"${entry.title}" wurde genehmigt und ist jetzt öffentlich sichtbar`
          : entry.rejection_reason?.trim()
            ? `"${entry.title}" wurde abgelehnt: ${entry.rejection_reason.trim()}`
            : `"${entry.title}" wurde abgelehnt`,
      time: pending ? (entry.created_at || entry.updated_at) : entry.updated_at,
      link: createPageUrl("Journal"),
    });
  });

  const { data: acceptedFriendships, error: friendshipsError } = await supabase
    .from("friendships")
    .select("requester_id, receiver_id")
    .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
    .eq("status", "accepted");

  if (friendshipsError) throw friendshipsError;

  const friendIds = (acceptedFriendships ?? []).map((friendship) =>
    friendship.requester_id === userId ? friendship.receiver_id : friendship.requester_id,
  );

  if (friendIds.length > 0) {
    const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const { data: friendEntries, error: friendEntriesError } = await supabase
      .from("journal_entries")
      .select("id, title, user_id, created_at")
      .in("user_id", friendIds)
      .or("and(visibility.eq.friends,status.eq.approved),and(visibility.eq.public,status.eq.approved)")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5);

    if (friendEntriesError) throw friendEntriesError;

    if (friendEntries?.length) {
      const profileIds = [...new Set(friendEntries.map((entry) => entry.user_id))];
      const { data: profiles, error: friendProfilesError } = await supabase
        .from("public_profiles")
        .select("user_id, full_name, username")
        .in("user_id", profileIds);

      if (friendProfilesError) throw friendProfilesError;

      const profileMap = Object.fromEntries((profiles ?? []).map((profile) => [profile.user_id, profile]));

      friendEntries.forEach((entry) => {
        const profile = profileMap[entry.user_id];

        results.push({
          id: `fe-${entry.id}`,
          type: "friend_entry",
          title: `${profile?.full_name || profile?.username || "Freund"} hat "${entry.title}" geteilt`,
          time: entry.created_at,
          link: `${createPageUrl("JournalDetail")}?id=${entry.id}`,
        });
      });
    }
  }

  if (profileHasActivePremium(currentProfile)) {
    const since = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();
    const { data: premiumHikes, error: premiumHikesError } = await supabase
      .from("public_hikes")
      .select("id, title, location, updated_at, created_at, status, is_premium")
      .eq("status", "approved")
      .eq("is_premium", true)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(6);

    if (premiumHikesError) throw premiumHikesError;

    (premiumHikes ?? []).forEach((hike) => {
      results.push({
        id: `ph-${hike.id}`,
        type: "premium_hike",
        title: `Neue Premium-Tour: "${hike.title}"`,
        body: hike.location ? `Jetzt neu in ${hike.location}` : "Jetzt neu f\u00fcr Premium-Mitglieder",
        time: hike.created_at || hike.updated_at,
        link: `${createPageUrl("HikeDetail")}?id=${encodeURIComponent(String(hike.id))}&source=sheets`,
      });
    });
  }

  const freeHikeSince = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();
  const { data: freeHikes, error: freeHikesError } = await supabase
    .from("public_hikes")
    .select("id, title, location, updated_at, created_at, status, is_premium")
    .eq("status", "approved")
    .eq("is_premium", false)
    .gte("created_at", freeHikeSince)
    .order("created_at", { ascending: false })
    .limit(6);

  if (freeHikesError) throw freeHikesError;

  (freeHikes ?? []).forEach((hike) => {
    results.push({
      id: `fh-${hike.id}`,
      type: "free_hike",
      title: `Neue kostenlose Tour: "${hike.title}"`,
      body: hike.location ? `Jetzt neu in ${hike.location}` : "Jetzt neu verfügbar",
      time: hike.created_at || hike.updated_at,
      link: `${createPageUrl("HikeDetail")}?id=${encodeURIComponent(String(hike.id))}&source=sheets`,
    });
  });

  return results
    .filter((notification) => isAtOrAfterStartTime(notification, startAt))
    .sort((left, right) => getNotificationTime(right) - getNotificationTime(left));
}

export async function loadUnreadNotificationCount(userId) {
  const notifications = await loadNotifications(userId);
  const seenAt = readSeenAt(userId);
  if (!seenAt) return notifications.length;

  const seenTimestamp = new Date(seenAt).getTime();
  if (!Number.isFinite(seenTimestamp)) return notifications.length;

  return notifications.filter((notification) => getNotificationTime(notification) > seenTimestamp).length;
}
