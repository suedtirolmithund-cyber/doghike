import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ArrowLeft,
  CalendarClock,
  Check,
  CreditCard,
  Loader2,
  Mountain,
  Settings,
  ShieldCheck,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PREMIUM_FEATURES_ENABLED } from "@/lib/premiumConfig";
import { toast } from "sonner";
import { PremiumPawMark } from "@/components/premium/PremiumPawBadge";

const features = [
  "Schalte ausgewählte Touren frei, die du sonst nur als Vorschau siehst",
  "Plane entspannter mit mehr Details, Kartenansicht und hilfreichen Tourinfos",
  "Sieh Wetterinfos direkt dort, wo du deine Tour planst",
  "Entdecke sorgfältig ergänzte Hinweise und Tipps, die unterwegs wirklich zählen",
  "Speichere Premium-Touren als PDF, wenn du offline oder ohne Empfang unterwegs bist",
  "Freue dich auf neue Premium-Touren, die regelmäßig dazukommen",
];

const testimonials = [
  {
    quote: "Endlich eine App, die wirklich auf unsere Hunde ausgerichtet ist!",
    author: "Martina S.",
  },
  {
    quote: "Ideal für unseren Urlaub mit Hund in Südtirol.",
    author: "Axel F.",
  },
  {
    quote: "Endlich weiß ich, welche Wanderungen für meinen Timmy geeignet sind und welche nicht.",
    author: "Martina W.",
  },
];

async function getFunctionErrorMessage(error, fallback) {
  const response = error?.context;

  if (response && typeof response.clone === "function") {
    const cloned = response.clone();
    const data = await cloned.json().catch(() => null);
    if (data?.error) return data.error;
    if (data?.message) return data.message;

    const text = await response.clone().text().catch(() => "");
    if (text) return text;
  }

  return error?.message || fallback;
}

export default function Premium() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [withdrawalConsent, setWithdrawalConsent] = useState(false);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const queryClient = useQueryClient();
  const checkoutStatus = searchParams.get("checkout");

  const { data: profile, isFetching } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("is_premium, stripe_customer_id, subscription_status, premium_current_period_end")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!user?.id || checkoutStatus !== "success") return;

    toast.success("Zahlung abgeschlossen. Dein Premium-Status wird aktualisiert.");
    queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
  }, [checkoutStatus, queryClient, user?.id]);

  useEffect(() => {
    if (checkoutStatus === "cancelled") {
      toast.info("Checkout wurde abgebrochen. Du kannst jederzeit neu starten.");
    }
  }, [checkoutStatus]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setTestimonialIndex((currentIndex) => (currentIndex + 1) % testimonials.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, []);

  const checkoutMutation = useMutation({
    mutationFn: async (plan = "monthly") => {
      const premiumUrl = `${window.location.origin}${createPageUrl("Premium")}`;
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          plan,
          successUrl: `${premiumUrl}?checkout=success`,
          cancelUrl: `${premiumUrl}?checkout=cancelled`,
        },
      });

      if (error) {
        throw new Error(await getFunctionErrorMessage(error, "Checkout konnte gerade nicht gestartet werden."));
      }
      if (data?.error) throw new Error(data.error);
      if (!data?.url) throw new Error("Stripe hat keine Checkout-URL zurückgegeben.");

      return data.url;
    },
    onSuccess: (url) => {
      window.location.assign(url);
    },
    onError: (error) => {
      toast.error(error?.message || "Checkout konnte gerade nicht gestartet werden.");
    },
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("create-billing-portal-session", {
        body: {
          returnUrl: `${window.location.origin}${createPageUrl("Premium")}`,
        },
      });

      if (error) {
        throw new Error(await getFunctionErrorMessage(error, "Kundenportal konnte gerade nicht geöffnet werden."));
      }
      if (data?.error) throw new Error(data.error);
      if (!data?.url) throw new Error("Stripe hat keine Portal-URL zurückgegeben.");

      return data.url;
    },
    onSuccess: (url) => {
      window.location.assign(url);
    },
    onError: (error) => {
      toast.error(error?.message || "Kundenportal konnte gerade nicht geoeffnet werden.");
    },
  });

  const premiumEndDate = profile?.premium_current_period_end ? new Date(profile.premium_current_period_end) : null;
  const premiumHasTimeLeft = !premiumEndDate || premiumEndDate.getTime() > Date.now();
  const isPremium = profile?.is_premium === true && premiumHasTimeLeft;
  const isStartingMonthly = checkoutMutation.isPending && checkoutMutation.variables === "monthly";
  const isStartingOneTime = checkoutMutation.isPending && checkoutMutation.variables === "one_time";
  const canOpenPortal = !!profile?.stripe_customer_id;
  const currentPeriodEnd = premiumEndDate
    ? new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(premiumEndDate)
    : null;
  const checkoutPending = checkoutStatus === "success" && !isPremium;

  if (!PREMIUM_FEATURES_ENABLED) {
    return (
      <div className="doghike-page-shell">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Link to={createPageUrl("Hikes")}>
              <Button variant="ghost" className="mb-6 text-slate-600">
                <ArrowLeft className="mr-2 h-4 w-4" /> Zurück
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="doghike-empty-state"
          >
            <PremiumPawMark className="mx-auto mb-5 h-14 w-14 text-2xl" />
            <h1 className="doghike-page-title mb-3">Premium ist noch nicht aktiv</h1>
            <p className="text-slate-500">
              Die Premium-Funktionen sind vorbereitet, aber für Nutzer noch nicht freigeschaltet.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="doghike-page-shell">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Link to={createPageUrl("Hikes")}>
            <Button variant="ghost" className="mb-6 text-slate-600">
              <ArrowLeft className="mr-2 h-4 w-4" /> Zurück
            </Button>
          </Link>
        </motion.div>

        {isPremium ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="doghike-glass-card p-8 text-center md:p-10"
          >
            <PremiumPawMark className="mx-auto mb-6 h-16 w-16 text-3xl" />
            <h2 className="doghike-page-title mb-3">Du bist Premium!</h2>
            <p className="mb-8 text-slate-500">
              Du hast Zugang zu allen exklusiven Premium-Touren auf DogTrails.
            </p>
            {currentPeriodEnd && (
              <p className="mb-8 text-sm text-slate-400">Aktueller Zeitraum bis {currentPeriodEnd}</p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <Link to={createPageUrl("Hikes")}>
                <Button className="doghike-primary-action h-12 w-full">
                  <Mountain className="mr-2 h-5 w-5" /> Touren entdecken
                </Button>
              </Link>
              {canOpenPortal && (
                <Button
                  variant="outline"
                  className="h-12"
                  onClick={() => portalMutation.mutate()}
                  disabled={portalMutation.isPending}
                >
                  {portalMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Settings className="mr-2 h-4 w-4" />
                  )}
                  Abo verwalten
                </Button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-8 text-center">
              <PremiumPawMark className="mx-auto mb-4 h-14 w-14 text-2xl" />
              <h1 className="doghike-page-title mb-3">Premium Mitgliedschaft</h1>
              <p className="doghike-page-subtitle text-lg sm:text-xl">
                Entdecke exklusive hundefreundliche Touren in Südtirol
              </p>
            </div>

            {checkoutPending && (
              <div className="mb-6 rounded-2xl border border-brand-100 bg-brand-50 p-4 text-sm text-brand-800">
                Deine Zahlung war erfolgreich. Der Stripe-Webhook aktualisiert deinen Premium-Status gleich automatisch.
              </div>
            )}

            <div className="mb-6 overflow-hidden rounded-2xl border border-brand-100/70 bg-gradient-to-br from-[#501F14] via-[#A8003C] to-[#F9C030] p-8 text-white shadow-[0_20px_46px_rgba(168,0,60,0.16)]">
              <div className="mb-8 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/22 bg-white/14 p-4 backdrop-blur-md">
                  <p className="mb-1 text-sm font-medium text-white/84">Monatliches Abo</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">3,99 EUR</span>
                    <span className="text-white/75">/ Monat</span>
                  </div>
                  <p className="mt-1 text-xs text-white/70">Automatisch, jederzeit kündbar</p>
                </div>
                <div className="rounded-2xl border border-white/22 bg-white/10 p-4 backdrop-blur-md">
                  <p className="mb-1 text-sm font-medium text-white/84">Einmalig</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">4,99 EUR</span>
                    <span className="text-white/75">/ 1 Monat</span>
                  </div>
                  <p className="mt-1 text-xs text-white/70">Einmal zahlen, läuft nach 1 Monat aus</p>
                </div>
              </div>

              <ul className="mb-10 space-y-3">
                {features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-white/90">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="space-y-3 rounded-2xl border border-white/22 bg-white/14 p-5 backdrop-blur-md">
                <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-white/20 bg-white/10 p-3 text-left">
                  <Checkbox
                    id="withdrawal-consent"
                    checked={withdrawalConsent}
                    onCheckedChange={setWithdrawalConsent}
                    className="mt-0.5 shrink-0 border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-[#7C3020]"
                  />
                  <span className="text-xs leading-relaxed text-white/85">
                    Ich stimme zu, dass der Premium-Zugang sofort nach Zahlung freigeschaltet wird,
                    und nehme zur Kenntnis, dass ich damit mein 14-tägiges Widerrufsrecht gemäß
                    Art. 59 lit. a D.Lgs. 206/2005 verliere.
                  </span>
                </label>

                <Button
                  className="h-12 w-full rounded-xl bg-white text-[#7C3020] hover:bg-white/90 disabled:opacity-50"
                  onClick={() => checkoutMutation.mutate("monthly")}
                  disabled={checkoutMutation.isPending || isFetching || !withdrawalConsent}
                >
                  {isStartingMonthly ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="mr-2 h-4 w-4" />
                  )}
                  Monatliches Abo starten
                </Button>
                <Button
                  variant="outline"
                  className="h-12 w-full rounded-xl border-white/30 bg-white/10 text-white hover:bg-white/20 disabled:opacity-50"
                  onClick={() => checkoutMutation.mutate("one_time")}
                  disabled={checkoutMutation.isPending || isFetching || !withdrawalConsent}
                >
                  {isStartingOneTime ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CalendarClock className="mr-2 h-4 w-4" />
                  )}
                  1 Monat einmalig kaufen
                </Button>
                {canOpenPortal && (
                  <Button
                    variant="outline"
                    className="h-12 w-full rounded-xl border-white/30 bg-white/10 text-white hover:bg-white/20"
                    onClick={() => portalMutation.mutate()}
                    disabled={portalMutation.isPending}
                  >
                    {portalMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Settings className="mr-2 h-4 w-4" />
                    )}
                    Abo verwalten / kündigen
                  </Button>
                )}
                <p className="flex items-center justify-center gap-2 text-xs text-white/62">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Sichere Zahlung und Aboverwaltung über Stripe.
                </p>
              </div>
            </div>

            <div className="mb-4 flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="h-5 w-5 fill-[#A8003C] text-[#A8003C]" />
              ))}
            </div>
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-700 ease-out"
                style={{ transform: `translateX(-${testimonialIndex * 100}%)` }}
              >
                {testimonials.map((testimonial) => (
                  <figure key={testimonial.author} className="w-full shrink-0 px-2 text-center">
                    <blockquote className="text-sm italic leading-6 text-slate-500">
                      "{testimonial.quote}"
                    </blockquote>
                    <figcaption className="mt-1 text-sm font-semibold text-[#7C3020]">
                      {testimonial.author}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
