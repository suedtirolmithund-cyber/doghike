import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
import Stripe from "https://esm.sh/stripe@14.25.0?target=denonext";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-11-20.acacia",
  httpClient: Stripe.createFetchHttpClient(),
});
const cryptoProvider = Stripe.createSubtleCryptoProvider();

function env(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function subscriptionToProfileUpdate(subscription: Stripe.Subscription) {
  const status = subscription.status;
  const isPremium = status === "active" || status === "trialing";
  const currentPeriodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;

  return {
    is_premium: isPremium,
    stripe_subscription_id: subscription.id,
    subscription_status: status,
    premium_current_period_end: currentPeriodEnd,
    premium_updated_at: new Date().toISOString(),
  };
}

function oneMonthFromTimestamp(timestamp: number) {
  const date = new Date(timestamp * 1000);
  const targetYear = date.getUTCFullYear();
  const targetMonth = date.getUTCMonth() + 1;
  const lastTargetMonthDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const targetDay = Math.min(date.getUTCDate(), lastTargetMonthDay);

  return new Date(Date.UTC(
    targetYear,
    targetMonth,
    targetDay,
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
    date.getUTCMilliseconds(),
  )).toISOString();
}

async function claimWebhookEvent(
  adminClient: ReturnType<typeof createClient>,
  event: Stripe.Event,
) {
  const now = new Date().toISOString();
  const { error: insertError } = await adminClient
    .from("stripe_webhook_events")
    .insert({
      event_id: event.id,
      event_type: event.type,
      processing_status: "processing",
      updated_at: now,
    });

  if (!insertError) return "claimed";

  if (insertError.code !== "23505") {
    throw insertError;
  }

  const { data: existingEvent, error: selectError } = await adminClient
    .from("stripe_webhook_events")
    .select("processing_status")
    .eq("event_id", event.id)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existingEvent?.processing_status === "processed") return "processed";

  if (existingEvent?.processing_status === "failed") {
    const { error: retryError } = await adminClient
      .from("stripe_webhook_events")
      .update({
        processing_status: "processing",
        error_message: null,
        updated_at: now,
      })
      .eq("event_id", event.id)
      .eq("processing_status", "failed");

    if (retryError) throw retryError;
    return "claimed";
  }

  return "processing";
}

async function markWebhookEventProcessed(
  adminClient: ReturnType<typeof createClient>,
  eventId: string,
) {
  const now = new Date().toISOString();
  const { error } = await adminClient
    .from("stripe_webhook_events")
    .update({
      processing_status: "processed",
      processed_at: now,
      updated_at: now,
      error_message: null,
    })
    .eq("event_id", eventId);

  if (error) throw error;
}

async function markWebhookEventFailed(
  adminClient: ReturnType<typeof createClient>,
  eventId: string,
  error: unknown,
) {
  const message = error instanceof Error ? error.message : String(error);
  await adminClient
    .from("stripe_webhook_events")
    .update({
      processing_status: "failed",
      error_message: message.slice(0, 500),
      updated_at: new Date().toISOString(),
    })
    .eq("event_id", eventId)
    .eq("processing_status", "processing");
}

async function resolveProfileUpdateTarget(
  adminClient: ReturnType<typeof createClient>,
  identifiers: { userId?: string | null; customerId?: string | null; subscriptionId?: string | null },
) {
  if (identifiers.userId) {
    return { column: "user_id", value: identifiers.userId };
  }

  const lookup = identifiers.customerId
    ? { column: "stripe_customer_id", value: identifiers.customerId }
    : identifiers.subscriptionId
      ? { column: "stripe_subscription_id", value: identifiers.subscriptionId }
      : null;

  if (!lookup) {
    throw new Error("No profile identifier found in Stripe event");
  }

  const { data: profiles, error } = await adminClient
    .from("profiles")
    .select("user_id")
    .eq(lookup.column, lookup.value)
    .limit(2);

  if (error) throw error;
  if (!profiles || profiles.length !== 1) {
    throw new Error(`Expected exactly one profile for ${lookup.column}`);
  }

  return { column: "user_id", value: profiles[0].user_id };
}

async function updateProfile(
  adminClient: ReturnType<typeof createClient>,
  identifiers: { userId?: string | null; customerId?: string | null; subscriptionId?: string | null },
  update: Record<string, unknown>,
) {
  const payload = {
    ...update,
    ...(identifiers.customerId ? { stripe_customer_id: identifiers.customerId } : {}),
  };

  const target = await resolveProfileUpdateTarget(adminClient, identifiers);
  return adminClient.from("profiles").update(payload).eq(target.column, target.value);
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const signature = request.headers.get("Stripe-Signature");
  const body = await request.text();

  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature ?? "",
      env("STRIPE_WEBHOOK_SIGNING_SECRET"),
      undefined,
      cryptoProvider,
    );
  } catch (error) {
    console.error("[stripe-webhook] signature verification failed", error);
    return new Response("Invalid signature", { status: 400 });
  }

  const adminClient = createClient(
    env("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? env("SUPABASE_SECRET_KEY"),
  );

  try {
    const claimStatus = await claimWebhookEvent(adminClient, event);
    if (claimStatus === "processed") {
      return jsonResponse({ received: true, duplicate: true });
    }
    if (claimStatus === "processing") {
      return jsonResponse({ error: "Webhook event is already processing" }, 409);
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
        const subscriptionId = typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;

        if (!subscriptionId) {
          if (session.payment_status !== "paid") break;

          const userId = session.client_reference_id ?? session.metadata?.user_id ?? null;
          const { error } = await updateProfile(
            adminClient,
            { userId, customerId },
            {
              is_premium: true,
              subscription_status: null,
              premium_current_period_end: oneMonthFromTimestamp(event.created),
              premium_updated_at: new Date().toISOString(),
            },
          );
          if (error) throw error;
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const userId =
          session.client_reference_id ??
          session.metadata?.user_id ??
          subscription.metadata?.user_id ??
          null;

        const { error } = await updateProfile(
          adminClient,
          { userId, customerId, subscriptionId },
          subscriptionToProfileUpdate(subscription),
        );
        if (error) throw error;
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer?.id;
        const userId = subscription.metadata?.user_id ?? null;

        const { error } = await updateProfile(
          adminClient,
          { userId, customerId, subscriptionId: subscription.id },
          subscriptionToProfileUpdate(subscription),
        );
        if (error) throw error;
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = typeof invoice.subscription === "string"
          ? invoice.subscription
          : invoice.subscription?.id;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;

        if (!subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const { error } = await updateProfile(
          adminClient,
          { userId: subscription.metadata?.user_id ?? null, customerId, subscriptionId },
          subscriptionToProfileUpdate(subscription),
        );
        if (error) throw error;
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = typeof invoice.subscription === "string"
          ? invoice.subscription
          : invoice.subscription?.id;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;

        if (!subscriptionId) break;

        const { error } = await updateProfile(
          adminClient,
          { customerId, subscriptionId },
          {
            is_premium: false,
            subscription_status: "past_due",
            premium_updated_at: new Date().toISOString(),
          },
        );
        if (error) throw error;
        break;
      }

      default:
        break;
    }

    await markWebhookEventProcessed(adminClient, event.id);
    return jsonResponse({ received: true });
  } catch (error) {
    console.error("[stripe-webhook] processing failed", error);
    await markWebhookEventFailed(adminClient, event.id, error);
    return jsonResponse({ error: "Webhook processing failed" }, 500);
  }
});
