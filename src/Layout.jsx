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
import DogTrailsLogoMark from "@/components/brand/DogTrailsLogoMark";
import { ensureWebPushSubscription, notificationPermission, registerServiceWorker } from "@/lib/browserNotifications";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";

const MAIN_NAV = [
  { name: "Dashboard", icon: Home, label: "Home" },
  { name: "Hikes", icon: Mountain, label: "Wanderungen" },
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
  { name: "Hikes", icon: Mountain, label: "Alle Wanderungen" },
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

    const setupPush = async () => {
      const permission = notificationPermission();
      if (permission === "denied") return;
      if (permission !== "granted") return;
      ensureWebPushSubscription(user.id).catch((error) => {
        console.error("[WebPush] Subscription-Sync fehlgeschlagen:", error);
      });
    };

    setupPush();
  }, [user?.id]);

  useRealtimeNotifications(user?.id);

  const isActive = (pageName) => currentPageName === pageName;

  return (
    <div className="min-h-screen overflow-x-hidden bg-brand-50/70 flex flex-col">
      <div className="hidden h-28 shrink-0 md:block lg:h-20 xl:h-16" />
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

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#F9C030]/70 bg-[#fff7ed] shadow-[0_-14px_34px_rgba(124,48,32,0.22)] md:hidden">
        <AnimatePresence>
          {moreOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-[#7C3020]/55"
                onClick={() => setMoreOpen(false)}
              />

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="absolute bottom-full left-3 right-3 z-50 rounded-t-2xl border border-brand-300 bg-[#fff7ed] px-4 pb-3 pt-4 shadow-[0_-18px_42px_rgba(124,48,32,0.28)]"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-[#7C3020]">Weitere Seiten</span>
                  <button onClick={() => setMoreOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-xl text-[#7C3020] hover:bg-[#FFF8F0] hover:text-[#A8003C] active:bg-[#FFF8F0] active:text-[#A8003C]">
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
                        className={`flex min-h-[70px] flex-col items-center justify-center gap-1.5 rounded-xl border p-2.5 transition-all ${
                          active
                            ? "border-[#F9C030]/80 bg-[#FFF8F0] text-[#A8003C] shadow-sm"
                            : "border-brand-100 bg-white text-[#7C3020] hover:bg-[#FFF8F0] hover:text-[#A8003C] active:bg-[#FFF8F0] active:text-[#A8003C]"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-[11px] font-semibold leading-tight">{label}</span>
                      </Link>
                    );
                  })}
                  {isAdmin && (
                    <Link
                      to={createPageUrl("AdminDashboard")}
                      className={`flex min-h-[70px] flex-col items-center justify-center gap-1.5 rounded-xl border p-2.5 transition-all ${
                        isActive("AdminDashboard")
                          ? "border-[#F9C030]/80 bg-[#FFF8F0] text-[#A8003C] shadow-sm"
                          : "border-brand-100 bg-white text-[#7C3020] hover:bg-[#FFF8F0] hover:text-[#A8003C] active:bg-[#FFF8F0] active:text-[#A8003C]"
                      }`}
                    >
                      <ShieldCheck className="w-5 h-5" />
                      <span className="text-[11px] font-semibold leading-tight">Admin</span>
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
                  active ? "bg-[#FFF8F0] text-[#A8003C] shadow-sm ring-1 ring-[#F9C030]/70" : "text-[#7C3020] hover:bg-[#FFF8F0] hover:text-[#A8003C] active:bg-[#FFF8F0] active:text-[#A8003C]"
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 text-current ${active ? "stroke-[2.5]" : "stroke-[2]"}`} />
                <span className="text-[10px] font-bold leading-none">
                  {label}
                </span>
              </Link>
            );
          })}

          <button
            onClick={() => setMoreOpen((value) => !value)}
            className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-2 py-2 transition-all ${
              moreOpen ? "bg-[#FFF8F0] text-[#A8003C] shadow-sm ring-1 ring-[#F9C030]/70" : "text-[#7C3020] hover:bg-[#FFF8F0] hover:text-[#A8003C] active:bg-[#FFF8F0] active:text-[#A8003C]"
            }`}
          >
            <Grid className={`w-5 h-5 ${moreOpen ? "stroke-[2.5]" : "stroke-[2]"}`} />
            <span className="text-[10px] font-bold leading-none">Mehr</span>
          </button>
        </div>
      </nav>

      <nav className="fixed left-0 right-0 top-0 z-50 hidden border-b border-brand-100/70 bg-white/78 shadow-[0_10px_28px_rgba(168,0,60,0.12)] backdrop-blur-md md:block">
        <div className="mx-auto w-full max-w-[1600px] py-2 pl-6 pr-3 lg:pl-8 lg:pr-4 xl:pl-10 xl:pr-6 2xl:px-8 2xl:py-3">
          <div className="flex flex-wrap items-center justify-between gap-2 lg:gap-3 2xl:flex-nowrap 2xl:gap-4">
            <Link
              to={createPageUrl("Dashboard")}
              className="flex min-w-0 shrink-0 items-center gap-2.5 transition-opacity hover:opacity-80 lg:gap-3"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[14px] border border-[#E7CFB2]/90 bg-[#FFF8F0] shadow-[0_8px_18px_rgba(124,48,32,0.16)] lg:h-12 lg:w-12 lg:rounded-[15px]">
                <DogTrailsLogoMark className="h-10 w-10 shrink-0 lg:h-11 lg:w-11" />
              </span>
              <div className="min-w-0">
                <span className="block text-base font-semibold leading-none text-[#7d4f3f] lg:text-lg">DogTrails</span>
                <span className="block truncate text-[11px] text-[#9a6c58] lg:text-xs">Hundefreundliche Wanderungen</span>
              </div>
            </Link>

            <div className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-1 overflow-visible lg:gap-1.5 2xl:flex-nowrap">
              {DESKTOP_NAV.map(({ name, icon: Icon, label }) => {
                const active = isActive(name);
                return (
                  <Link
                    key={name}
                    to={createPageUrl(name)}
                    className={`flex min-w-[86px] max-w-[126px] items-center justify-center gap-1 rounded-lg px-2 py-2 text-center leading-tight transition-all lg:min-w-[96px] lg:gap-1.5 xl:min-w-[104px] xl:gap-2 xl:px-2.5 xl:py-2.5 2xl:min-w-[108px] ${
                      active ? "bg-[#FFF8F0] text-[#A8003C] shadow-sm ring-1 ring-[#F9C030]/60" : "text-[#7C3020] hover:bg-[#FFF8F0] hover:text-[#A8003C] active:bg-[#FFF8F0] active:text-[#A8003C]"
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 text-current ${active ? "stroke-[2.5]" : ""}`} />
                    <span className="whitespace-nowrap text-[12px] font-semibold lg:text-[13px] xl:text-sm">{label}</span>
                  </Link>
                );
              })}
              {isAdmin && (
                <Link
                  to={createPageUrl("AdminDashboard")}
                  className={`flex min-w-[86px] max-w-[126px] items-center justify-center gap-1 rounded-lg px-2 py-2 text-center leading-tight transition-all lg:min-w-[96px] lg:gap-1.5 xl:min-w-[104px] xl:gap-2 xl:px-2.5 xl:py-2.5 2xl:min-w-[108px] ${
                    isActive("AdminDashboard") ? "bg-[#FFF8F0] text-[#A8003C] shadow-sm ring-1 ring-[#F9C030]/60" : "text-[#7C3020] hover:bg-[#FFF8F0] hover:text-[#A8003C] active:bg-[#FFF8F0] active:text-[#A8003C]"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span className="whitespace-nowrap text-[12px] font-semibold lg:text-[13px] xl:text-sm">Admin</span>
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
                  <Button size="sm" className="flex items-center gap-1.5 bg-[#A8003C] text-white hover:bg-[#7C3020]">
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
