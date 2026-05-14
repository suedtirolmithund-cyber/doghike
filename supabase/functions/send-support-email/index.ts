import { createClient } from "npm:@supabase/supabase-js@2.56.0";

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

function normalizeEmail(email: unknown) {
  if (typeof email !== "string") return null;
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null;
  return trimmed;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const resendApiKey =
      Deno.env.get("RESEND_API_KEY")
      || Deno.env.get("resend_api_key")
      || "";
    const supportInbox =
      Deno.env.get("SUPPORT_EMAIL")
      || Deno.env.get("support_email")
      || "suedtirolmithund@gmail.com";
    const supportFromEmail =
      Deno.env.get("SUPPORT_FROM_EMAIL")
      || Deno.env.get("support_from_email")
      || "DogTrails <onboarding@resend.dev>";

    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: "supabase_not_configured" }, 500);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const accessToken = getAccessToken(request);

    let authUserId: string | null = null;
    let authEmail: string | null = null;

    if (accessToken) {
      const {
        data: { user },
      } = await admin.auth.getUser(accessToken);

      authUserId = user?.id ?? null;
      authEmail = normalizeEmail(user?.email) ?? null;
    }

    const payload = await request.json();
    const subject = typeof payload?.subject === "string" ? payload.subject.trim() : "";
    const message = typeof payload?.message === "string" ? payload.message.trim() : "";
    const category = typeof payload?.category === "string" ? payload.category.trim() : "feedback";
    const pageUrl = typeof payload?.pageUrl === "string" ? payload.pageUrl.trim() : null;
    const userAgent = typeof payload?.userAgent === "string" ? payload.userAgent.trim() : null;
    const providedEmail = normalizeEmail(payload?.email);
    const replyTo = authEmail || providedEmail;

    if (!subject || !message) {
      return json({ error: "invalid_payload" }, 400);
    }

    if (subject.length > 160 || message.length > 8000) {
      return json({ error: "payload_too_large" }, 400);
    }

    const { data: insertedRequest, error: insertError } = await admin
      .from("support_requests")
      .insert({
        user_id: authUserId,
        email: replyTo,
        subject,
        message,
        category,
        page_url: pageUrl,
        user_agent: userAgent,
        email_status: resendApiKey && supportInbox ? "pending" : "stored_only",
      })
      .select("id")
      .single();

    if (insertError || !insertedRequest) {
      console.error("[SupportEmail] insert failed", insertError);
      return json({ error: "support_request_insert_failed" }, 500);
    }

    if (!resendApiKey || !supportInbox) {
      return json({ ok: true, requestId: insertedRequest.id, delivery: "stored_only" });
    }

    const supportBody = [
      `Kategorie: ${category || "feedback"}`,
      authUserId ? `User ID: ${authUserId}` : null,
      replyTo ? `Antwortadresse: ${replyTo}` : "Antwortadresse: keine",
      pageUrl ? `Seite: ${pageUrl}` : null,
      userAgent ? `Gerät/Browser: ${userAgent}` : null,
      "",
      message,
    ]
      .filter(Boolean)
      .join("\n");

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: supportFromEmail,
        to: [supportInbox],
        reply_to: replyTo ? [replyTo] : undefined,
        subject: `DogTrails ${category === "bug" ? "Bug" : "Feedback"}: ${subject}`,
        text: supportBody,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error("[SupportEmail] resend failed", errorText);

      await admin
        .from("support_requests")
        .update({
          email_status: "failed",
          email_error: errorText.slice(0, 1000),
        })
        .eq("id", insertedRequest.id);

      return json({ ok: true, requestId: insertedRequest.id, delivery: "stored_only", emailError: "email_send_failed" });
    }

    await admin
      .from("support_requests")
      .update({
        email_status: "sent",
        email_error: null,
      })
      .eq("id", insertedRequest.id);

    return json({ ok: true, requestId: insertedRequest.id, delivery: "email_sent" });
  } catch (error) {
    console.error("[SupportEmail] function error", error);
    return json({ error: "internal_error" }, 500);
  }
});
