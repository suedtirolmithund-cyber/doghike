import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/ui/BackButton";
import { motion } from "framer-motion";
import { PremiumPawBadge, PremiumPawMark } from "@/components/premium/PremiumPawBadge";

const premiumItems = [
  "Premium-Wanderungen",
  "Mehr Wanderungsdetails",
  "Kartenansicht",
  "Wetterinfos",
  "Tipps & Hinweise",
  "PDF-Download",
];

const inlineItems = [
  "Beschreibung",
  "Zusatzinfos",
  "Parken & Einkehr",
  "Tipps & Hinweise",
  "PDF-Download",
  "Immer neue Wanderungen",
];

function PremiumList({ title, items }) {
  return (
    <div className="mb-6 rounded-2xl border border-brand-100 bg-brand-50 p-3.5 text-left sm:p-5">
      <div className="mb-3 flex justify-center sm:justify-start">
        <PremiumPawBadge label={title} className="min-h-7 max-w-full px-2.5 py-1 text-[11px] sm:text-xs" />
      </div>
      <ul className="grid grid-cols-2 gap-2 text-xs text-brand-700 min-[420px]:grid-cols-3 sm:text-sm">
        {items.map((item) => (
          <li
            key={item}
            className="flex min-h-10 min-w-0 items-center gap-1.5 rounded-xl border border-brand-100 bg-white/72 px-2.5 py-2 leading-tight shadow-sm"
          >
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-brand-400" />
            <span className="min-w-0 break-words">{item}</span>
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
        className="doghike-glass-card p-5 sm:p-8"
      >
        <PremiumPawMark className="mx-auto mb-4 h-12 w-12 text-xl sm:mb-5 sm:h-14 sm:w-14 sm:text-2xl" />

        <div className="mb-5 text-center sm:mb-6">
          <h2 className="doghike-page-title mb-2">Mehr Infos mit Premium</h2>
          <p className="text-sm leading-6 text-[#C07820]">
            Die Vorschau zu <span className="font-semibold text-[#7C3020]">{hikeName}</span> ist sichtbar.
            Die ganzen Details, Fotos und Zusatzinfos gibt es mit Premium.
          </p>
        </div>

        <PremiumList title="Mit Premium siehst du:" items={inlineItems} />

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to={createPageUrl("Premium")} className="w-full sm:w-auto">
            <Button className="w-full bg-[#A8003C] text-white hover:bg-[#8C002F] sm:w-auto">
              Jetzt Premium werden
            </Button>
          </Link>
          <BackButton to={createPageUrl("Hikes")} variant="outline" className="w-full sm:w-auto" />
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

      <div className="mx-auto max-w-xl px-4 py-10 text-center sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="doghike-glass-card p-5 sm:p-10"
        >
          <PremiumPawMark className="mx-auto mb-5 h-14 w-14 text-2xl sm:mb-6 sm:h-16 sm:w-16 sm:text-3xl" />

          <h2 className="doghike-page-title mb-2">Premium-Wanderung</h2>
          <p className="mb-2 text-base font-medium text-[#C07820] sm:text-lg">{hikeName}</p>
          <p className="mb-6 text-sm leading-6 text-[#C07820] sm:mb-8">
            Diese Wanderung ist exklusiv für Premium-Mitglieder verfügbar. Schließe Premium ab, um alle Details, Karten,
            Fotos und Tipps zu sehen.
          </p>

          <PremiumList title="Premium beinhaltet:" items={premiumItems} />

          <Link to={createPageUrl("Premium")}>
            <Button className="mb-3 h-12 w-full bg-[#A8003C] text-base text-white hover:bg-[#8C002F]">
              Jetzt Premium werden
            </Button>
          </Link>
          <BackButton to={createPageUrl("Hikes")} className="w-full" />
        </motion.div>
      </div>
    </div>
  );
}
