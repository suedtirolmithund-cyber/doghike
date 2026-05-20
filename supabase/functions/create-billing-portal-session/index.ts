import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
import Stripe from "https://esm.sh/stripe@14.25.0?target=denonext";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-11-20.acacia",
  httpClient: Stripe.createFetchHttpClient(),
});

function env(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function sameOriginUrl(value: unknown, origin: string, fallbackPath: string) {
  const fallback = `${origin}${fallbackPath}`;
  if (typeof value !== "string") return fallback;

  try {
    const url = new URL(value, origin);
    return url.origin === origin ? url.toString() : fallback;
  } catch {
    return fallback;
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const authHeader = request.headers.get("Authorization") ?? "";
    const supabaseUrl = env("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? env("SUPABASE_PUBLISHABLE_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? env("SUPABASE_SECRET_KEY");

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await authClient.auth.getUser();

    if (userError || !userData.user) {
      return jsonResponse({ error: "Bitte melde dich erneut an." }, 401);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("stripe_customer_id")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    if (!profile?.stripe_customer_id) {
      return jsonResponse({ error: "Für dieses Konto wurde noch keine Stripe-Kundennummer gefunden." }, 404);
    }

    const { returnUrl } = await request.json().catch(() => ({}));
    const origin = request.headers.get("Origin") ?? "http://localhost:5173";
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: sameOriginUrl(returnUrl, origin, "/Premium"),
    });

    return jsonResponse({ url: session.url });
  } catch (error) {
    console.error("[create-billing-portal-session]", error);
    return jsonResponse({ error: "Kundenportal konnte gerade nicht geöffnet werden." }, 500);
  }
});
