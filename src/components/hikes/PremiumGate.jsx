import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Lock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const premiumItems = [
  "Zugang zu allen Premium-Touren",
  "Detaillierte Routenbeschreibungen & Karten",
  "Exklusive Fotos & Insider-Tipps",
  "Wetter- & Saisoninfos für Touren",
];

const inlineItems = [
  "komplette Beschreibung und Tipps",
  "weitere Fotos und Zusatzinfos",
  "Parken, Einkehr und Hinweise",
  "alle Premium-Touren in voller Ansicht",
];

function PremiumList({ title, items }) {
  return (
    <div className="mb-6 rounded-2xl border border-brand-100 bg-brand-50 p-5 text-left">
      <p className="mb-3 flex items-center gap-2 font-semibold text-brand-700">
        <Crown className="h-4 w-4" /> {title}
      </p>
      <ul className="space-y-2 text-sm text-brand-600">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2">
            <span className="font-bold text-brand-400">✓</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function PremiumGate({ hikeName, coverPhoto, variant = "page" }) {
  if (variant === "inline") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="doghike-glass-card p-8"
      >
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand-100">
          <Crown className="h-7 w-7 text-brand-500" />
        </div>

        <div className="mb-6 text-center">
          <h2 className="mb-2 text-2xl font-semibold text-[#7C3020]">Mehr Infos mit Premium</h2>
          <p className="text-sm leading-6 text-[#C07820]">
            Die Vorschau zu <span className="font-semibold text-[#7C3020]">{hikeName}</span> ist sichtbar.
            Die ganzen Details, Fotos und Zusatzinfos gibt es mit Premium.
          </p>
        </div>

        <PremiumList title="Mit Premium siehst du:" items={inlineItems} />

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to={createPageUrl("Premium")}>
            <Button>
              <Crown className="mr-2 h-5 w-5" />
              Jetzt Premium werden
            </Button>
          </Link>
          <Link to={createPageUrl("Hikes")}>
            <Button variant="outline">Zurück zu allen Touren</Button>
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50/60">
      {coverPhoto && (
        <div className="relative h-[40vh] overflow-hidden">
          <img
            src={coverPhoto}
            alt={hikeName}
            className="h-full w-full scale-110 object-cover blur-md"
          />
          <div className="absolute inset-0 bg-brand-900/62" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Lock className="h-16 w-16 text-white/55" />
          </div>
        </div>
      )}

      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="doghike-glass-card p-10"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100">
            <Crown className="h-8 w-8 text-brand-500" />
          </div>

          <h2 className="mb-2 text-2xl font-semibold text-[#7C3020]">Premium-Tour</h2>
          <p className="mb-2 text-lg font-medium text-[#C07820]">{hikeName}</p>
          <p className="mb-8 text-sm leading-6 text-[#C07820]">
            Diese Tour ist exklusiv für Premium-Mitglieder verfügbar. Schließe ein Abo ab, um alle Details, Karten, Fotos und Tipps zu sehen.
          </p>

          <PremiumList title="Premium beinhaltet:" items={premiumItems} />

          <Link to={createPageUrl("Premium")}>
            <Button className="mb-3 h-12 w-full text-base">
              <Crown className="mr-2 h-5 w-5" />
              Jetzt Premium werden
            </Button>
          </Link>
          <Link to={createPageUrl("Hikes")}>
            <Button variant="ghost" className="w-full">
              Zurück zu allen Touren
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
