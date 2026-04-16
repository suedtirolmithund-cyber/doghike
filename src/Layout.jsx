import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Mountain, Home, Trophy, Navigation, Dog, LogIn, LogOut, User, BookOpen, ShieldCheck, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  // Display name: Google full_name → email prefix → "Profil"
  const displayName = user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || (user?.email ? user.email.split("@")[0] : null);

  const navItems = [
    { name: "Dashboard", icon: Home, label: "Startseite" },
    { name: "Hikes", icon: Mountain, label: "Alle Touren" },
    { name: "Journal", icon: BookOpen, label: "Tagebuch" },
    { name: "Friends", icon: Users, label: "Freunde" },
    { name: "RoutePlanner", icon: Navigation, label: "Routenplaner" },
    { name: "TopDogs", icon: Trophy, label: "Top Dogs" },
    { name: "Profile", icon: Dog, label: "Mein Profil" },
  ];

  const isActive = (pageName) => currentPageName === pageName;

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <div className="flex-1">
        {children}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 py-3 md:py-4 px-4 md:px-6 text-center mb-20 md:mb-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2 md:gap-4 text-xs md:text-sm text-stone-500">
          <span>© 2026 Südtirol mit Hund</span>
          <span className="hidden sm:inline">•</span>
          <Link to={createPageUrl("Impressum")} className="hover:text-stone-700 underline">Impressum</Link>
          <span className="hidden sm:inline">•</span>
          <Link to={createPageUrl("Datenschutz")} className="hover:text-stone-700 underline">Datenschutz</Link>
          <span className="hidden sm:inline">•</span>
          <Link to={createPageUrl("Legal")} className="hover:text-stone-700 underline">Rechtliche Hinweise</Link>
          <span className="hidden sm:inline">•</span>
          <Link to={createPageUrl("Support")} className="hover:text-stone-700 underline">Hilfe & Support</Link>
        </div>
      </footer>

      {/* Bottom Navigation - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 md:hidden z-50 shadow-lg">
        <div className="flex items-center justify-around py-3 px-2 safe-area-pb">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.name);
            return (
              <Link
                key={item.name}
                to={createPageUrl(item.name)}
                className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl transition-all relative ${
                  active
                    ? "text-slate-800 bg-slate-100"
                    : "text-stone-500 hover:text-stone-700 hover:bg-stone-50"
                }`}
              >
                <Icon className={`w-6 h-6 ${active ? "stroke-[2.5]" : "stroke-[2]"}`} />
                <span className={`text-[10px] font-medium ${active ? "" : "opacity-80"}`}>
                  {item.label.split(" ")[item.label.split(" ").length - 1]}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Top Navigation - Desktop */}
      <nav className="fixed top-0 left-0 right-0 bg-white border-b border-stone-200 hidden md:block z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              to={createPageUrl("Dashboard")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0"
            >
              <div className="bg-slate-800 rounded-lg p-2">
                <Mountain className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-semibold text-stone-800 block leading-none">Südtirol mit Hund</span>
                <span className="text-xs text-stone-500">Hundefreundliche Wanderungen</span>
              </div>
            </Link>

            {/* Nav links */}
            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.name);
                return (
                  <Link
                    key={item.name}
                    to={createPageUrl(item.name)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all ${
                      active
                        ? "bg-slate-800 text-white shadow-md"
                        : "text-stone-600 hover:text-stone-800 hover:bg-stone-100"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? "stroke-[2.5]" : ""}`} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
              {isAdmin && (
                <Link
                  to={createPageUrl("AdminDashboard")}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all ${
                    isActive("AdminDashboard")
                      ? "bg-slate-800 text-white shadow-md"
                      : "text-amber-700 hover:text-amber-900 hover:bg-amber-50"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-sm font-medium">Admin</span>
                </Link>
              )}
            </div>

            {/* Auth section */}
            <div className="flex items-center gap-2 shrink-0 ml-2">
              {isAuthenticated && user ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-stone-100 rounded-lg">
                    <User className="w-4 h-4 text-stone-500 shrink-0" />
                    <span className="text-sm text-stone-700 font-medium max-w-[140px] truncate">
                      {displayName}
                    </span>
                  </div>
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
                  <Button
                    size="sm"
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <LogIn className="w-4 h-4" />
                    Anmelden
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer for fixed navs */}
      <div className="hidden md:block h-16" />
      <div className="md:hidden h-20" />
    </div>
  );
}
