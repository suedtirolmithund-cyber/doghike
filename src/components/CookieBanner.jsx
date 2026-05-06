import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";

const CONSENT_KEY = "doghike_cookie_consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) {
      // Small delay so the banner doesn't flash during initial render
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ accepted: true, date: new Date().toISOString() }));
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ accepted: false, date: new Date().toISOString() }));
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="fixed bottom-0 left-0 right-0 z-[9999] px-4 pb-4 md:pb-6"
        >
          <div className="mx-auto max-w-2xl rounded-2xl border border-brand-400/30 bg-gradient-to-br from-brand-700 via-brand-600 to-[#2777b8] p-5 text-white shadow-[0_18px_42px_rgba(16,47,74,0.2)] md:p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="rounded-xl bg-white/16 p-2 shrink-0">
                <Cookie className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm mb-1">
                  Datenschutz & technisch notwendige Cookies
                </h3>
                <p className="text-xs text-brand-50 leading-relaxed">
                  Diese App verwendet ausschließlich <strong>technisch notwendige Cookies</strong> zur
                  Authentifizierung (Supabase Session) und zur Speicherung deiner Einstellungen.
                  Es gibt keine Werbe- oder Tracking-Cookies. Daten werden auf
                  EU-Servern (Frankfurt) gespeichert.{" "}
                  <Link
                    to={createPageUrl("Datenschutz")}
                    className="text-white underline hover:text-brand-50"
                  >
                    Mehr erfahren
                  </Link>
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={accept}
                className="flex-1 bg-white text-brand-700 hover:bg-brand-50 h-10 text-sm"
              >
                Verstanden & akzeptieren
              </Button>
              <Button
                onClick={decline}
                variant="outline"
                className="flex-1 border-white/35 bg-white/10 text-white hover:bg-white/18 h-10 text-sm"
              >
                Nur notwendige
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
