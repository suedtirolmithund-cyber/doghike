import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
import Stripe from "https://esm.sh/stripe@14.25.0?target=denonext";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-11-20",
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

function oneMonthFromNow() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date.toISOString();
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

  if (identifiers.userId) {
    return adminClient.from("profiles").update(payload).eq("user_id", identifiers.userId);
  }

  if (identifiers.customerId) {
    return adminClient.from("profiles").update(payload).eq("stripe_customer_id", identifiers.customerId);
  }

  if (identifiers.subscriptionId) {
    return adminClient.from("profiles").update(payload).eq("stripe_subscription_id", identifiers.subscriptionId);
  }

  throw new Error("No profile identifier found in Stripe event");
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

  try {
    const adminClient = createClient(
      env("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? env("SUPABASE_SECRET_KEY"),
    );

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
              subscription_status: "one_time_active",
              premium_current_period_end: oneMonthFromNow(),
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

    return jsonResponse({ received: true });
  } catch (error) {
    console.error("[stripe-webhook] processing failed", error);
    return jsonResponse({ error: "Webhook processing failed" }, 500);
  }
});
