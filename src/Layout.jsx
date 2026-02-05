import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Mountain, Map, PawPrint, Home, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  const navItems = [
    { name: "Dashboard", icon: Home, label: "Startseite" },
    { name: "Hikes", icon: Mountain, label: "Alle Touren" },
    { name: "MapView", icon: Map, label: "Kartenansicht" },
    { name: "Shop", icon: ShoppingBag, label: "Shop" },
    { name: "Profile", icon: PawPrint, label: "Mein Profil" },
  ];

  const isActive = (pageName) => currentPageName === pageName;

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <div className="flex-1">
        {children}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 py-4 px-6 text-center mb-20 md:mb-0">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-4 text-sm text-stone-500">
          <span>© 2026 Südtirol mit Hund</span>
          <span className="hidden sm:inline">•</span>
          <Link to={createPageUrl("Legal")} className="hover:text-stone-700 underline">
            Rechtliche Hinweise & Haftungsausschluss
          </Link>
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
                className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl transition-all ${
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
            <Link 
              to={createPageUrl("Dashboard")} 
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="bg-slate-800 rounded-lg p-2">
                <Mountain className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-semibold text-stone-800 block leading-none">Südtirol mit Hund</span>
                <span className="text-xs text-stone-500">Hundefreundliche Wanderungen</span>
              </div>
            </Link>
            
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