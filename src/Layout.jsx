import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Mountain,
  Home,
  Route,
  Dog,
  LogIn,
  LogOut,
  BookOpen,
  ShieldCheck,
  Users,
  Trophy,
  Grid,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { ensureWebPushSubscription, notificationPermission, registerServiceWorker } from "@/lib/browserNotifications";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";

const MAIN_NAV = [
  { name: "Dashboard", icon: Home, label: "Home" },
  { name: "Hikes", icon: Mountain, label: "Touren" },
  { name: "Journal", icon: BookOpen, label: "Tagebuch" },
  { name: "RoutePlanner", icon: Route, label: "Planen" },
  { name: "Profile", icon: Dog, label: "Profil" },
];

const MORE_ITEMS = [
  { name: "Friends", icon: Users, label: "Freunde" },
  { name: "TopDogs", icon: Trophy, label: "Top Dogs" },
];

const DESKTOP_NAV = [
  { name: "Dashboard", icon: Home, label: "Startseite" },
  { name: "Hikes", icon: Mountain, label: "Alle Touren" },
  { name: "Journal", icon: BookOpen, label: "Tagebuch" },
  { name: "RoutePlanner", icon: Route, label: "Routenplaner" },
  { name: "Friends", icon: Users, label: "Freunde" },
  { name: "TopDogs", icon: Trophy, label: "Top Dogs" },
  { name: "Profile", icon: Dog, label: "Mein Profil" },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    registerServiceWorker();
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    if (notificationPermission() !== "granted") return;

    ensureWebPushSubscription(user.id).catch((error) => {
      console.error("[WebPush] Subscription-Sync fehlgeschlagen:", error);
    });
  }, [user?.id]);

  useRealtimeNotifications(user?.id);

  const isActive = (pageName) => currentPageName === pageName;

  return (
    <div className="min-h-screen bg-brand-50/70 flex flex-col">
      <div className="hidden md:block h-16 shrink-0" />
      <div className="flex-1">{children}</div>

      <footer className="bg-white/80 border-t border-brand-100 py-3 md:py-4 px-4 md:px-6 text-center mb-20 md:mb-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2 md:gap-4 text-xs md:text-sm text-slate-500">
          <span>© 2026 DogTrails</span>
          <span className="hidden sm:inline">•</span>
          <Link to={createPageUrl("Impressum")} className="hover:text-slate-700 underline">Impressum</Link>
          <span className="hidden sm:inline">•</span>
          <Link to={createPageUrl("Datenschutz")} className="hover:text-slate-700 underline">Datenschutz</Link>
          <span className="hidden sm:inline">•</span>
          <Link to={createPageUrl("AGB")} className="hover:text-slate-700 underline">AGB</Link>
          <span className="hidden sm:inline">•</span>
          <Link to={createPageUrl("Legal")} className="hover:text-slate-700 underline">Rechtliche Hinweise</Link>
          <span className="hidden sm:inline">•</span>
          <Link to={createPageUrl("Support")} className="hover:text-slate-700 underline">Hilfe & Support</Link>
        </div>
      </footer>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-brand-100/70 bg-white/78 shadow-[0_-10px_28px_rgba(192,48,96,0.12)] backdrop-blur-md md:hidden">
        <AnimatePresence>
          {moreOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-[1px]"
                onClick={() => setMoreOpen(false)}
              />

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="absolute bottom-full left-3 right-3 z-50 rounded-t-2xl border border-brand-100/70 bg-white/86 px-4 pb-3 pt-4 shadow-[0_-14px_34px_rgba(192,48,96,0.14)] backdrop-blur-md"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-[#102f4a]">Weitere Seiten</span>
                  <button onClick={() => setMoreOpen(false)} className="p-1 text-brand-700 hover:text-[#102f4a]">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {MORE_ITEMS.map(({ name, icon: Icon, label }) => {
                    const active = isActive(name);
                    return (
                      <Link
                        key={name}
                        to={createPageUrl(name)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${
                          active ? "bg-[#c03060]/13 text-[#8f2348] shadow-sm" : "text-brand-700 hover:bg-[#2777b8]/8"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-[10px] font-medium">{label}</span>
                      </Link>
                    );
                  })}
                  {isAdmin && (
                    <Link
                      to={createPageUrl("AdminDashboard")}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${
                        isActive("AdminDashboard") ? "bg-[#c03060]/13 text-[#8f2348] shadow-sm" : "text-brand-700 hover:bg-[#2777b8]/8"
                      }`}
                    >
                      <ShieldCheck className="w-5 h-5" />
                      <span className="text-[10px] font-medium">Admin</span>
                    </Link>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-6 px-1 py-2 safe-area-pb">
          {MAIN_NAV.map(({ name, icon: Icon, label }) => {
            const active = isActive(name);
            return (
              <Link
                key={name}
                to={createPageUrl(name)}
                className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-2 py-2 transition-all ${
                  active ? "bg-[#c03060]/13 text-[#8f2348] shadow-sm" : "text-brand-700 hover:bg-[#2777b8]/8 hover:text-[#102f4a]"
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 text-current ${active ? "stroke-[2.5]" : "stroke-[2]"}`} />
                <span className={`text-[10px] font-medium leading-none ${active ? "" : "opacity-80"}`}>
                  {label}
                </span>
              </Link>
            );
          })}

          <button
            onClick={() => setMoreOpen((value) => !value)}
            className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-2 py-2 transition-all ${
              moreOpen ? "bg-[#c03060]/13 text-[#8f2348] shadow-sm" : "text-brand-700 hover:bg-[#2777b8]/8 hover:text-[#102f4a]"
            }`}
          >
            <Grid className={`w-5 h-5 ${moreOpen ? "stroke-[2.5]" : "stroke-[2]"}`} />
            <span className="text-[10px] font-medium leading-none opacity-80">Mehr</span>
          </button>
        </div>
      </nav>

      <nav className="fixed left-0 right-0 top-0 z-50 hidden border-b border-brand-100/70 bg-white/78 shadow-[0_10px_28px_rgba(192,48,96,0.12)] backdrop-blur-md md:block">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <Link
              to={createPageUrl("Dashboard")}
              className="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-80"
            >
              <div className="rounded-lg bg-[#c03060] p-2 shadow-sm">
                <Mountain className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="block text-lg font-semibold leading-none text-[#7d4f3f]">DogTrails</span>
                <span className="text-xs text-[#9a6c58]">Hundefreundliche Wanderungen</span>
              </div>
            </Link>

            <div className="flex items-center gap-1 overflow-x-auto min-w-0 flex-1 justify-center">
              {DESKTOP_NAV.map(({ name, icon: Icon, label }) => {
                const active = isActive(name);
                return (
                  <Link
                    key={name}
                    to={createPageUrl(name)}
                    className={`flex min-w-[118px] items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-center transition-all whitespace-nowrap ${
                      active ? "bg-[#c03060]/13 text-[#8f2348] shadow-sm" : "text-brand-700 hover:bg-[#2777b8]/8 hover:text-[#102f4a]"
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 text-current ${active ? "stroke-[2.5]" : ""}`} />
                    <span className="text-sm font-medium">{label}</span>
                  </Link>
                );
              })}
              {isAdmin && (
                <Link
                  to={createPageUrl("AdminDashboard")}
                  className={`flex min-w-[118px] items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-center transition-all whitespace-nowrap ${
                    isActive("AdminDashboard") ? "bg-[#c03060]/13 text-[#8f2348] shadow-sm" : "text-brand-700 hover:bg-[#2777b8]/8 hover:text-[#102f4a]"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-sm font-medium">Admin</span>
                </Link>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isAuthenticated && user ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="flex items-center gap-1.5 border-brand-100/75 bg-white/68 text-brand-700 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-400"
                >
                  <LogOut className="w-4 h-4" />
                  Abmelden
                </Button>
              ) : (
                <Link to={createPageUrl("Login")}>
                  <Button size="sm" className="flex items-center gap-1.5 bg-[#c03060] text-white hover:bg-[#8f2348]">
                    <LogIn className="w-4 h-4" />
                    Anmelden
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="md:hidden h-20" />
    </div>
  );
}
