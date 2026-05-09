import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Crown, Check, ArrowLeft, Mountain, Star, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PREMIUM_FEATURES_ENABLED } from "@/lib/premiumConfig";

const features = [
  "Zugang zu allen Premium-Touren",
  "Detaillierte Routenbeschreibungen & Karten",
  "Exklusive Fotos & Insider-Tipps",
  "Wetter- & Saisoninfos für jeden Trail",
  "Routenprofil & Höhendiagramme",
  "Neue Premium-Touren jeden Monat",
];

export default function Premium() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("is_premium")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const isPremium = profile?.is_premium === true;

  if (!PREMIUM_FEATURES_ENABLED) {
    return (
      <div className="doghike-page-shell">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Link to={createPageUrl("Hikes")}>
              <Button variant="ghost" className="mb-6 text-slate-600">
                <ArrowLeft className="w-4 h-4 mr-2" /> Zurück
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="doghike-empty-state"
          >
            <div className="doghike-page-icon mx-auto mb-5 h-14 w-14 text-slate-500">
              <Crown className="h-7 w-7" />
            </div>
            <h1 className="doghike-page-title mb-3">Premium ist noch nicht aktiv</h1>
            <p className="text-slate-500">
              Die Premium-Funktionen sind im Code vorbereitet, werden für die aktuelle Testphase aber noch nicht für Nutzer freigeschaltet.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="doghike-page-shell">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Link to={createPageUrl("Hikes")}>
            <Button variant="ghost" className="mb-6 text-slate-600">
              <ArrowLeft className="w-4 h-4 mr-2" /> Zurück
            </Button>
          </Link>
        </motion.div>

        {isPremium ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="doghike-glass-card p-8 text-center md:p-10"
          >
            <div className="doghike-page-icon mx-auto mb-6 h-16 w-16">
              <Crown className="h-8 w-8" />
            </div>
            <h2 className="mb-3 text-3xl font-semibold text-slate-900">Du bist Premium!</h2>
            <p className="mb-8 text-slate-500">
              Du hast Zugang zu allen exklusiven Premium-Touren auf DogHike.
            </p>
            <Link to={createPageUrl("Hikes")}>
              <Button className="doghike-primary-action h-12 px-8">
                <Mountain className="w-5 h-5 mr-2" /> Alle Touren entdecken
              </Button>
            </Link>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-8 text-center">
              <div className="doghike-page-icon mx-auto mb-4 h-14 w-14">
                <Crown className="h-7 w-7" />
              </div>
              <h1 className="doghike-page-title mb-3">Premium Mitgliedschaft</h1>
              <p className="doghike-page-subtitle">Entdecke exklusive hundefreundliche Touren in Südtirol</p>
            </div>

            <div className="mb-6 overflow-hidden rounded-2xl border border-yellow-100/70 bg-gradient-to-br from-[#5f241d] via-[#d94a3a] to-[#f6c43d] p-8 text-white shadow-[0_20px_46px_rgba(95,36,29,0.16)]">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-5xl font-bold">4,99 €</span>
                <span className="text-white/75">/ Monat</span>
              </div>
              <p className="mb-8 text-sm text-white/70">Jederzeit kündbar</p>

              <ul className="space-y-3 mb-10">
                {features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-white/90">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="rounded-2xl border border-white/22 bg-white/14 p-5 text-center backdrop-blur-md">
                <Crown className="mx-auto mb-3 h-8 w-8 text-white" />
                <p className="mb-1 font-semibold text-white">Online-Zahlung kommt bald</p>
                <p className="mb-4 text-sm text-white/72">
                  Stripe-Integration wird gerade eingerichtet. Interesse an Premium?
                </p>
                <a href="mailto:suedtirolmithund@gmail.com?subject=Premium Mitgliedschaft">
                  <Button className="h-12 w-full rounded-xl bg-white text-[#7a3f2e] hover:bg-white/90">
                    <Mail className="w-4 h-4 mr-2" />
                    Jetzt per E-Mail anfragen
                  </Button>
                </a>
                <p className="mt-3 text-xs text-white/62">
                  Wir schalten dein Premium-Konto manuell frei.
                </p>
              </div>
            </div>

            <div className="flex justify-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-5 h-5 fill-[#d94a3a] text-[#d94a3a]" />
              ))}
            </div>
            <p className="text-center text-slate-500 text-sm italic">
              "Endlich eine App, die wirklich auf unsere Vierbeiner ausgerichtet ist!" - Martina S.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
