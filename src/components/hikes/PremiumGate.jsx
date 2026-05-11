import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Lock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function PremiumGate({ hikeName, coverPhoto, variant = "page" }) {
  if (variant === "inline") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-8 border border-brand-100 shadow-sm"
      >
        <div className="w-14 h-14 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <Crown className="w-7 h-7 text-brand-500" />
        </div>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">Mehr Infos mit Premium</h2>
          <p className="text-slate-500">
            Die Vorschau zu <span className="font-medium text-slate-700">{hikeName}</span> ist sichtbar.
            Die ganzen Details, Fotos und Zusatzinfos gibt es mit Premium.
          </p>
        </div>

        <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5 mb-6 text-left">
          <p className="font-semibold text-brand-700 mb-3 flex items-center gap-2">
            <Crown className="w-4 h-4" /> Mit Premium siehst du:
          </p>
          <ul className="space-y-2 text-sm text-brand-600">
            <li className="flex items-center gap-2">✓ komplette Beschreibung und Tipps</li>
            <li className="flex items-center gap-2">✓ weitere Fotos und Zusatzinfos</li>
            <li className="flex items-center gap-2">✓ Parken, Einkehr und Hinweise</li>
            <li className="flex items-center gap-2">✓ alle Premium-Touren in voller Ansicht</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to={createPageUrl("Premium")}>
            <Button className="bg-brand-500 hover:bg-brand-500 text-white">
              <Crown className="w-5 h-5 mr-2" />
              Jetzt Premium werden
            </Button>
          </Link>
          <Link to={createPageUrl("Hikes")}>
            <Button variant="outline">
              Zurück zu allen Touren
            </Button>
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-slate-50">
      {/* Blurred preview */}
      {coverPhoto && (
        <div className="relative h-[40vh] overflow-hidden">
          <img
            src={coverPhoto}
            alt={hikeName}
            className="w-full h-full object-cover blur-md scale-110"
          />
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Lock className="w-16 h-16 text-white/50" />
          </div>
        </div>
      )}

      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-10 border border-brand-100 shadow-xl"
        >
          <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Crown className="w-8 h-8 text-brand-500" />
          </div>

          <h2 className="text-2xl font-semibold text-slate-900 mb-2">Premium-Tour</h2>
          <p className="text-slate-500 mb-2 text-lg font-medium">{hikeName}</p>
          <p className="text-slate-500 mb-8">
            Diese Tour ist exklusiv für Premium-Mitglieder verfügbar. Schließe ein Abo ab, um alle Details, Karten, Fotos und Tipps zu sehen.
          </p>

          <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5 mb-8 text-left">
            <p className="font-semibold text-brand-700 mb-3 flex items-center gap-2">
              <Crown className="w-4 h-4" /> Premium beinhaltet:
            </p>
            <ul className="space-y-2 text-sm text-brand-600">
              <li className="flex items-center gap-2">✓ Zugang zu allen Premium-Touren</li>
              <li className="flex items-center gap-2">✓ Detaillierte Routenbeschreibungen & Karten</li>
              <li className="flex items-center gap-2">✓ Exklusive Fotos & Insider-Tipps</li>
              <li className="flex items-center gap-2">✓ Wetter- & Saisoninfos für Touren</li>
            </ul>
          </div>

          <Link to={createPageUrl("Premium")}>
            <Button className="w-full bg-brand-500 hover:bg-brand-500 text-white h-12 text-base font-medium mb-3">
              <Crown className="w-5 h-5 mr-2" />
              Jetzt Premium werden
            </Button>
          </Link>
          <Link to={createPageUrl("Hikes")}>
            <Button variant="ghost" className="w-full text-slate-500">
              Zurück zu allen Touren
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
