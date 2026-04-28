import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Mountain,
  Home,
  Navigation,
  Dog,
  LogIn,
  LogOut,
  BookOpen,
  ShieldCheck,
  Users,
  Trophy,
  Grid,
  X,
  Map,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { registerServiceWorker } from "@/lib/browserNotifications";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";

const MAIN_NAV = [
  { name: "Dashboard", icon: Home, label: "Home" },
  { name: "Hikes", icon: Mountain, label: "Touren" },
  { name: "Journal", icon: BookOpen, label: "Tagebuch" },
  { name: "RoutePlanner", icon: Navigation, label: "Planen" },
  { name: "Profile", icon: Dog, label: "Profil" },
];

const MORE_ITEMS = [
  { name: "Friends", icon: Users, label: "Freunde" },
  { name: "TopDogs", icon: Trophy, label: "Top Dogs" },
  { name: "MapView", icon: Map, label: "Karte" },
];

const DESKTOP_NAV = [
  { name: "Dashboard", icon: Home, label: "Startseite" },
  { name: "Hikes", icon: Mountain, label: "Alle Touren" },
  { name: "Journal", icon: BookOpen, label: "Tagebuch" },
  { name: "RoutePlanner", icon: Navigation, label: "Routenplaner" },
  { name: "Friends", icon: Users, label: "Freunde" },
  { name: "TopDogs", icon: Trophy, label: "Top Dogs" },
  { name: "MapView", icon: Map, label: "Karte" },
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

  useRealtimeNotifications(user?.id);

  const isActive = (pageName) => currentPageName === pageName;

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <div className="hidden md:block h-16 shrink-0" />
      <div className="flex-1">{children}</div>

      <footer className="bg-white border-t border-stone-200 py-3 md:py-4 px-4 md:px-6 text-center mb-20 md:mb-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2 md:gap-4 text-xs md:text-sm text-stone-500">
          <span>© 2026 DogHike</span>
          <span className="hidden sm:inline">•</span>
          <Link to={createPageUrl("Impressum")} className="hover:text-stone-700 underline">Impressum</Link>
          <span className="hidden sm:inline">•</span>
          <Link to={createPageUrl("Datenschutz")} className="hover:text-stone-700 underline">Datenschutz</Link>
          <span className="hidden sm:inline">•</span>
          <Link to={createPageUrl("AGB")} className="hover:text-stone-700 underline">AGB</Link>
          <span className="hidden sm:inline">•</span>
          <Link to={createPageUrl("Legal")} className="hover:text-stone-700 underline">Rechtliche Hinweise</Link>
          <span className="hidden sm:inline">•</span>
          <Link to={createPageUrl("Support")} className="hover:text-stone-700 underline">Hilfe & Support</Link>
        </div>
      </footer>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 md:hidden z-50 shadow-lg">
        <AnimatePresence>
          {moreOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/30 z-40"
                onClick={() => setMoreOpen(false)}
              />

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="absolute bottom-full left-0 right-0 z-50 bg-white border-t border-stone-200 rounded-t-2xl shadow-xl px-4 pt-4 pb-3"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-stone-700">Weitere Seiten</span>
                  <button onClick={() => setMoreOpen(false)} className="p-1 text-stone-400 hover:text-stone-600">
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
                          active ? "bg-slate-100 text-slate-800" : "text-stone-500 hover:bg-stone-50"
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
                        isActive("AdminDashboard") ? "bg-amber-100 text-amber-800" : "text-amber-600 hover:bg-amber-50"
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

        <div className="flex items-center justify-around py-2 px-1 safe-area-pb">
          {MAIN_NAV.map(({ name, icon: Icon, label }) => {
            const active = isActive(name);
            return (
              <Link
                key={name}
                to={createPageUrl(name)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[52px] ${
                  active ? "text-slate-800 bg-slate-100" : "text-stone-500 hover:text-stone-700"
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : "stroke-[2]"}`} />
                <span className={`text-[10px] font-medium leading-none ${active ? "" : "opacity-80"}`}>
                  {label}
                </span>
              </Link>
            );
          })}

          <button
            onClick={() => setMoreOpen((value) => !value)}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[52px] ${
              moreOpen ? "text-slate-800 bg-slate-100" : "text-stone-500 hover:text-stone-700"
            }`}
          >
            <Grid className={`w-5 h-5 ${moreOpen ? "stroke-[2.5]" : "stroke-[2]"}`} />
            <span className="text-[10px] font-medium leading-none opacity-80">Mehr</span>
          </button>
        </div>
      </nav>

      <nav className="fixed top-0 left-0 right-0 bg-white border-b border-stone-200 hidden md:block z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <Link
              to={createPageUrl("Dashboard")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0"
            >
              <div className="bg-slate-800 rounded-lg p-2">
                <Mountain className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-semibold text-stone-800 block leading-none">DogHike</span>
                <span className="text-xs text-stone-500">Hundefreundliche Wanderungen</span>
              </div>
            </Link>

            <div className="flex items-center gap-1 overflow-x-auto min-w-0 flex-1 justify-center">
              {DESKTOP_NAV.map(({ name, icon: Icon, label }) => {
                const active = isActive(name);
                return (
                  <Link
                    key={name}
                    to={createPageUrl(name)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all whitespace-nowrap ${
                      active ? "bg-slate-800 text-white shadow-md" : "text-stone-600 hover:text-stone-800 hover:bg-stone-100"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? "stroke-[2.5]" : ""}`} />
                    <span className="text-sm font-medium">{label}</span>
                  </Link>
                );
              })}
              {isAdmin && (
                <Link
                  to={createPageUrl("AdminDashboard")}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all whitespace-nowrap ${
                    isActive("AdminDashboard") ? "bg-slate-800 text-white shadow-md" : "text-amber-700 hover:text-amber-900 hover:bg-amber-50"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-sm font-medium">Admin</span>
                </Link>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isAuthenticated && user ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={logout}
                    className="flex items-center gap-1.5 border-stone-200 text-stone-600 hover:text-red-600 hover:border-red-300 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                    Abmelden
                  </Button>
                </>
              ) : (
                <Link to={createPageUrl("Login")}>
                  <Button size="sm" className="flex items-center gap-1.5 bg-[#a8c686] hover:bg-[#94b872] text-white">
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
