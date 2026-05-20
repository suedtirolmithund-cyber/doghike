# DogHike Premium setup

## Stripe

1. Create a monthly recurring Stripe price for the Premium product.
2. Copy the price id, for example `price_...`.
3. Add a Stripe webhook endpoint pointing to:

   `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`

4. Subscribe the endpoint to these events:

   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`

5. Configure the Stripe Customer Portal in the Stripe Dashboard so users can cancel and update payment methods.

## Supabase

Run the updated billing columns and trigger from `supabase/schema.sql`, then set these Edge Function secrets:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_PREMIUM_PRICE_ID=price_...
supabase secrets set STRIPE_WEBHOOK_SIGNING_SECRET=whsec_...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
```

Deploy the functions:

```bash
supabase functions deploy create-checkout-session
supabase functions deploy create-billing-portal-session
supabase functions deploy stripe-webhook
```

The webhook function is configured in `supabase/config.toml` with `verify_jwt = false` because Stripe cannot send a Supabase user token.
