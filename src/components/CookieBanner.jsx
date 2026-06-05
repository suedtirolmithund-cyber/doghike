import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";

const NOTICE_KEY = "doghike_cookie_notice_ack";
const LEGACY_NOTICE_KEY = "doghike_cookie_consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(NOTICE_KEY) || localStorage.getItem(LEGACY_NOTICE_KEY);
    if (!stored) {
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  const acknowledge = () => {
    localStorage.setItem(NOTICE_KEY, JSON.stringify({ acknowledged: true, date: new Date().toISOString() }));
    localStorage.removeItem(LEGACY_NOTICE_KEY);
    setVisible(false);
  };

  const closeNecessary = () => {
    localStorage.setItem(
      NOTICE_KEY,
      JSON.stringify({ acknowledged: true, necessaryOnly: true, date: new Date().toISOString() })
    );
    localStorage.removeItem(LEGACY_NOTICE_KEY);
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="fixed inset-x-3 bottom-20 z-[9999] sm:inset-x-4 md:bottom-5"
        >
          <div
            role="region"
            aria-label="Cookie-Hinweis"
            className="mx-auto max-w-xl rounded-2xl border border-brand-200/80 bg-white/95 p-3 text-brand-900 shadow-[0_12px_32px_rgba(124,48,32,0.16)] backdrop-blur-xl sm:p-3.5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-start gap-2.5">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Cookie className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold leading-tight text-brand-900">Nur notwendige Cookies</h3>
                  <p className="mt-1 text-[11px] leading-snug text-brand-700 sm:text-xs">
                    DogTrails speichert nur, was Login, Sicherheit und App-Funktionen brauchen. Kein Tracking.{" "}
                    <Link
                      to={createPageUrl("Datenschutz")}
                      className="font-semibold text-brand-600 underline underline-offset-2 hover:text-brand-700"
                    >
                      Datenschutz
                    </Link>
                  </p>
                </div>
              </div>

              <div className="flex gap-2 sm:shrink-0">
                <Button
                  onClick={acknowledge}
                  className="h-9 flex-1 rounded-xl bg-brand-600 px-4 text-xs font-bold text-white hover:bg-brand-700 sm:flex-none"
                >
                  Verstanden
                </Button>
                <Button
                  onClick={closeNecessary}
                  variant="outline"
                  className="h-9 flex-1 rounded-xl border-brand-200 bg-white px-4 text-xs font-semibold text-brand-700 hover:bg-brand-50 sm:flex-none"
                >
                  Schließen
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
