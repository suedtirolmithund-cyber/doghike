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
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl border border-stone-200 p-5 md:p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="bg-brand-100 rounded-xl p-2 shrink-0">
                <Cookie className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <h3 className="font-semibold text-stone-800 text-sm mb-1">
                  Datenschutz & technisch notwendige Cookies
                </h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Diese App verwendet ausschließlich <strong>technisch notwendige Cookies</strong> zur
                  Authentifizierung (Supabase Session) und zur Speicherung deiner Einstellungen.
                  Es gibt keine Werbe- oder Tracking-Cookies. Daten werden auf
                  EU-Servern (Frankfurt) gespeichert.{" "}
                  <Link
                    to={createPageUrl("Datenschutz")}
                    className="text-brand-400 hover:underline"
                  >
                    Mehr erfahren
                  </Link>
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={accept}
                className="flex-1 bg-brand-400 hover:bg-brand-600 text-white h-10 text-sm"
              >
                Verstanden & akzeptieren
              </Button>
              <Button
                onClick={decline}
                variant="outline"
                className="flex-1 border-stone-200 text-stone-600 h-10 text-sm"
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
