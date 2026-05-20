import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
import Stripe from "https://esm.sh/stripe@14.25.0?target=denonext";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-11-20",
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
    const { successUrl, cancelUrl, plan } = await request.json().catch(() => ({}));
    const checkoutPlan = plan === "one_time" ? "one_time" : "monthly";
    const priceId = checkoutPlan === "one_time"
      ? env("STRIPE_PREMIUM_ONE_TIME_PRICE_ID")
      : env("STRIPE_PREMIUM_PRICE_ID");

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await authClient.auth.getUser();

    if (userError || !userData.user) {
      return jsonResponse({ error: "Bitte melde dich erneut an." }, 401);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const user = userData.user;
    const origin = request.headers.get("Origin") ?? "http://localhost:5173";
    const safeSuccessUrl = sameOriginUrl(successUrl, origin, "/Premium?checkout=success");
    const safeCancelUrl = sameOriginUrl(cancelUrl, origin, "/Premium?checkout=cancelled");

    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    let customerId = profile?.stripe_customer_id ?? null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;

      const { error: updateError } = await adminClient
        .from("profiles")
        .update({ stripe_customer_id: customerId, premium_updated_at: new Date().toISOString() })
        .eq("user_id", user.id);

      if (updateError) {
        throw updateError;
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: checkoutPlan === "one_time" ? "payment" : "subscription",
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: safeSuccessUrl,
      cancel_url: safeCancelUrl,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      customer_update: {
        address: "auto",
        name: "auto",
      },
      ...(checkoutPlan === "monthly"
        ? { subscription_data: { metadata: { user_id: user.id } } }
        : {}),
      metadata: { user_id: user.id, checkout_plan: checkoutPlan },
    });

    return jsonResponse({ url: session.url });
  } catch (error) {
    console.error("[create-checkout-session]", error);
    return jsonResponse({ error: "Checkout konnte gerade nicht gestartet werden." }, 500);
  }
});
