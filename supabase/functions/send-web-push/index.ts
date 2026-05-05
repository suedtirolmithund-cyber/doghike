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
    const vapidPublicKey = Deno.env.get("WEB_PUSH_VAPID_PUBLIC_KEY") || "";
    const vapidPrivateKey = Deno.env.get("WEB_PUSH_VAPID_PRIVATE_KEY") || "";
    const contactEmail = Deno.env.get("WEB_PUSH_CONTACT_EMAIL") || "mailto:hello@doghike.app";

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

    const { type, friendshipId } = await request.json();
    if (!type || !friendshipId) {
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

    let targetUserId = "";
    let title = "DogHike";
    let body = "Es gibt eine neue Benachrichtigung.";
    let url = "/Notifications";

    const { data: actorProfile } = await admin
      .from("profiles")
      .select("full_name, username")
      .eq("user_id", user.id)
      .maybeSingle();

    const actorName = actorProfile?.full_name?.trim() || actorProfile?.username?.trim() || "Jemand";

    if (type === "friend_request") {
      if (friendship.requester_id !== user.id || friendship.status !== "pending") {
        return json({ error: "not_allowed" }, 403);
      }

      targetUserId = friendship.receiver_id;
      title = "Neue Freundschaftsanfrage 🐕";
      body = `${actorName} möchte dein Freund sein.`;
      url = "/Friends";
    } else if (type === "friend_accepted") {
      if (friendship.receiver_id !== user.id || friendship.status !== "accepted") {
        return json({ error: "not_allowed" }, 403);
      }

      targetUserId = friendship.requester_id;
      title = "Freundschaft bestätigt ✅";
      body = `${actorName} hat deine Anfrage angenommen.`;
      url = "/Friends";
    } else {
      return json({ error: "unsupported_type" }, 400);
    }

    const { data: subscriptions, error: subscriptionsError } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh_key, auth_key")
      .eq("user_id", targetUserId);

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
