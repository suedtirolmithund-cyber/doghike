import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Crown, Check, ArrowLeft, Mountain, Star, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  "Zugang zu allen Premium-Touren",
  "Detaillierte Routenbeschreibungen & Karten",
  "Exklusive Fotos & Insider-Tipps",
  "Wetter- & Saisoninfos für jeden Trail",
  "Routenprofil & Höhendiagramme",
  "Neue Premium-Touren jeden Monat",
];

export default function Premium() {
  const { user, isAuthenticated } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("is_premium")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const isPremium = profile?.is_premium === true;

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-slate-50 pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Link to={createPageUrl("Hikes")}>
            <Button variant="ghost" className="mb-6 text-stone-600">
              <ArrowLeft className="w-4 h-4 mr-2" /> Zurück
            </Button>
          </Link>
        </motion.div>

        {isPremium ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-10 border border-stone-200 shadow-xl text-center">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Crown className="w-10 h-10 text-amber-500" />
            </div>
            <h2 className="text-3xl font-semibold text-stone-800 mb-3">Du bist Premium! 🎉</h2>
            <p className="text-stone-500 mb-8">
              Du hast Zugang zu allen exklusiven Premium-Touren auf Südtirol mit Hund.
            </p>
            <Link to={createPageUrl("Hikes")}>
              <Button className="bg-amber-500 hover:bg-amber-600 text-white h-12 px-8">
                <Mountain className="w-5 h-5 mr-2" /> Alle Touren entdecken
              </Button>
            </Link>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-amber-500" />
              </div>
              <h1 className="text-4xl font-light text-stone-800 mb-3">Premium Mitgliedschaft</h1>
              <p className="text-stone-500 text-lg">Entdecke exklusive hundefreundliche Touren in Südtirol</p>
            </div>

            {/* Pricing card */}
            <div className="bg-white rounded-3xl border-2 border-amber-300 shadow-xl p-8 mb-6">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-5xl font-bold text-stone-800">4,99 €</span>
                <span className="text-stone-500">/ Monat</span>
              </div>
              <p className="text-stone-400 text-sm mb-8">Jederzeit kündbar</p>

              <ul className="space-y-3 mb-10">
                {features.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-stone-700">
                    <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-amber-600" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA — Stripe kommt bald */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
                <Crown className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                <p className="font-semibold text-stone-800 mb-1">Online-Zahlung kommt bald</p>
                <p className="text-sm text-stone-500 mb-4">
                  Stripe-Integration wird gerade eingerichtet. Interesse an Premium?
                </p>
                <a href="mailto:suedtirolmithund@gmail.com?subject=Premium Mitgliedschaft">
                  <Button className="bg-amber-500 hover:bg-amber-600 text-white w-full h-12 rounded-xl">
                    <Mail className="w-4 h-4 mr-2" />
                    Jetzt per E-Mail anfragen
                  </Button>
                </a>
                <p className="text-xs text-stone-400 mt-3">
                  Wir schalten dein Premium-Konto manuell frei.
                </p>
              </div>
            </div>

            <div className="flex justify-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-5 h-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-center text-stone-500 text-sm italic">
              "Endlich eine App, die wirklich auf unsere Vierbeiner ausgerichtet ist!" – Martina S.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
