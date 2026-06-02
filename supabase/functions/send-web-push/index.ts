import { createClient } from "npm:@supabase/supabase-js@2.56.0";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function getAccessToken(request: Request) {
  const authHeader = request.headers.get("Authorization") || "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) return null;
  return authHeader.slice(7);
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const vapidPublicKey =
      Deno.env.get("WEB_PUSH_VAPID_PUBLIC_KEY")
      || Deno.env.get("web_push_vapid_public_key")
      || "";
    const vapidPrivateKey =
      Deno.env.get("WEB_PUSH_VAPID_PRIVATE_KEY")
      || Deno.env.get("web_push_vapid_private_key")
      || "";
    const contactEmail =
      Deno.env.get("WEB_PUSH_CONTACT_EMAIL")
      || Deno.env.get("web_push_contact_email")
      || "mailto:hello@doghike.app";

    if (!supabaseUrl || !serviceRoleKey || !vapidPublicKey || !vapidPrivateKey) {
      return json({ error: "web_push_not_configured" }, 500);
    }

    const accessToken = getAccessToken(request);
    if (!accessToken) {
      return json({ error: "missing_auth" }, 401);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const {
      data: { user },
      error: authError,
    } = await admin.auth.getUser(accessToken);

    if (authError || !user) {
      return json({ error: "invalid_auth" }, 401);
    }

    const { type, friendshipId, hikeId, entryId } = await request.json();
    if (!type) {
      return json({ error: "invalid_payload" }, 400);
    }

    let targetUserId = "";
    let targetUserIds: string[] = [];
    let title = "DogHike";
    let body = "Es gibt eine neue Benachrichtigung.";
    let url = "/Notifications";

    const { data: actorProfile } = await admin
      .from("profiles")
      .select("full_name, username")
      .eq("user_id", user.id)
      .maybeSingle();

    const actorName = actorProfile?.full_name?.trim() || actorProfile?.username?.trim() || "Jemand";

    if (type === "friend_request" || type === "friend_accepted") {
      if (!friendshipId) {
        return json({ error: "invalid_payload" }, 400);
      }

      const { data: friendship, error: friendshipError } = await admin
        .from("friendships")
        .select("id, requester_id, receiver_id, status")
        .eq("id", friendshipId)
        .maybeSingle();

      if (friendshipError || !friendship) {
        return json({ error: "friendship_not_found" }, 404);
      }

      if (type === "friend_request") {
        if (friendship.requester_id !== user.id || friendship.status !== "pending") {
          return json({ error: "not_allowed" }, 403);
        }

        targetUserId = friendship.receiver_id;
        title = "Neue Freundschaftsanfrage 🐕";
        body = `${actorName} möchte dein Freund sein.`;
        url = "/Friends";
      } else {
        if (friendship.receiver_id !== user.id || friendship.status !== "accepted") {
          return json({ error: "not_allowed" }, 403);
        }

        targetUserId = friendship.requester_id;
        title = "Freundschaft bestätigt ✅";
        body = `${actorName} hat deine Anfrage angenommen.`;
        url = "/Friends";
      }
    } else if (type === "friend_entry") {
      if (!entryId) {
        return json({ error: "invalid_payload" }, 400);
      }

      const { data: entry, error: entryError } = await admin
        .from("journal_entries")
        .select("id, user_id, title, visibility, status")
        .eq("id", entryId)
        .maybeSingle();

      if (entryError || !entry) {
        return json({ error: "entry_not_found" }, 404);
      }

      const isVisibleToFriends =
        (entry.visibility === "friends" && (entry.status === "approved" || entry.status === "draft"))
        || (entry.visibility === "public" && entry.status === "approved");

      if (entry.user_id !== user.id || !isVisibleToFriends) {
        return json({ error: "not_allowed" }, 403);
      }

      const { data: friendships, error: friendshipsError } = await admin
        .from("friendships")
        .select("requester_id, receiver_id")
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq("status", "accepted");

      if (friendshipsError) {
        return json({ error: "friendships_load_failed" }, 500);
      }

      targetUserIds = (friendships ?? [])
        .map((friendship) => (friendship.requester_id === user.id ? friendship.receiver_id : friendship.requester_id))
        .filter(Boolean);

      if (!targetUserIds.length) {
        return json({ sent: 0, skipped: true });
      }

      title = "Neue Tour von einem Freund";
      body = `${actorName} hat "${entry.title}" geteilt.`;
      url = `/JournalDetail?id=${encodeURIComponent(String(entry.id))}`;
    } else if (type === "free_hike") {
      if (!hikeId) {
        return json({ error: "invalid_payload" }, 400);
      }

      const { data: requesterProfile, error: requesterProfileError } = await admin
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (requesterProfileError || requesterProfile?.role !== "admin") {
        return json({ error: "not_allowed" }, 403);
      }

      const { data: hike, error: hikeError } = await admin
        .from("public_hikes")
        .select("id, title, location, status, is_premium")
        .eq("id", hikeId)
        .maybeSingle();

      if (hikeError || !hike) {
        return json({ error: "hike_not_found" }, 404);
      }

      if (hike.status !== "approved" || hike.is_premium === true) {
        return json({ error: "hike_not_published_free" }, 400);
      }

      const { data: publicProfiles, error: publicProfilesError } = await admin
        .from("profiles")
        .select("user_id")
        .neq("user_id", user.id);

      if (publicProfilesError) {
        return json({ error: "public_profiles_load_failed" }, 500);
      }

      targetUserIds = (publicProfiles ?? [])
        .map((profile) => profile.user_id)
        .filter(Boolean);

      if (!targetUserIds.length) {
        return json({ sent: 0, skipped: true });
      }

      title = "Neue kostenlose Tour";
      body = hike.location
        ? `"${hike.title}" ist jetzt neu in ${hike.location}.`
        : `"${hike.title}" ist jetzt neu verfugbar.`;
      url = `/HikeDetail?id=${encodeURIComponent(String(hike.id))}&source=supabase`;
    } else if (type === "premium_hike") {
      if (!hikeId) {
        return json({ error: "invalid_payload" }, 400);
      }

      const { data: requesterProfile, error: requesterProfileError } = await admin
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (requesterProfileError || requesterProfile?.role !== "admin") {
        return json({ error: "not_allowed" }, 403);
      }

      const { data: hike, error: hikeError } = await admin
        .from("public_hikes")
        .select("id, title, location, status, is_premium")
        .eq("id", hikeId)
        .maybeSingle();

      if (hikeError || !hike) {
        return json({ error: "hike_not_found" }, 404);
      }

      if (hike.status !== "approved" || hike.is_premium !== true) {
        return json({ error: "hike_not_published_premium" }, 400);
      }

      const { data: premiumProfiles, error: premiumProfilesError } = await admin
        .from("profiles")
        .select("user_id, role, is_premium, premium_current_period_end")
        .or("is_premium.eq.true,role.eq.admin");

      if (premiumProfilesError) {
        return json({ error: "premium_profiles_load_failed" }, 500);
      }

      const now = Date.now();
      targetUserIds = (premiumProfiles ?? [])
        .filter((profile) => {
          if (profile.role === "admin") return true;
          if (profile.is_premium !== true) return false;
          if (!profile.premium_current_period_end) return false;
          const endTime = new Date(profile.premium_current_period_end).getTime();
          return Number.isFinite(endTime) && endTime > now;
        })
        .map((profile) => profile.user_id)
        .filter(Boolean);

      title = "Neue Premium-Tour";
      body = hike.location
        ? `"${hike.title}" ist jetzt neu in ${hike.location}.`
        : `"${hike.title}" ist jetzt für Premium-Mitglieder verfügbar.`;
      url = `/HikeDetail?id=${encodeURIComponent(String(hike.id))}&source=supabase`;
    } else {
      return json({ error: "unsupported_type" }, 400);
    }

    const subscriptionsQuery = admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh_key, auth_key");
    const { data: subscriptions, error: subscriptionsError } = targetUserIds.length > 0
      ? await subscriptionsQuery.in("user_id", targetUserIds)
      : await subscriptionsQuery.eq("user_id", targetUserId);

    if (subscriptionsError) {
      return json({ error: "subscriptions_load_failed" }, 500);
    }

    if (!subscriptions?.length) {
      return json({ sent: 0, skipped: true });
    }

    webpush.setVapidDetails(contactEmail.startsWith("mailto:") ? contactEmail : `mailto:${contactEmail}`, vapidPublicKey, vapidPrivateKey);

    const staleIds: string[] = [];
    let sent = 0;

    await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh_key,
                auth: subscription.auth_key,
              },
            },
            JSON.stringify({
              title,
              body,
              url,
            }),
          );
          sent += 1;
        } catch (error) {
          const statusCode = typeof error === "object" && error && "statusCode" in error
            ? Number(error.statusCode)
            : null;

          if (statusCode === 404 || statusCode === 410) {
            staleIds.push(subscription.id);
          } else {
            console.error("[WebPush] send failed", error);
          }
        }
      }),
    );

    if (staleIds.length > 0) {
      await admin.from("push_subscriptions").delete().in("id", staleIds);
    }

    return json({ sent, staleRemoved: staleIds.length });
  } catch (error) {
    console.error("[WebPush] function error", error);
    return json({ error: "internal_error" }, 500);
  }
});
