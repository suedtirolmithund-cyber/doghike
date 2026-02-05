import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Mountain, Map, PawPrint, Home } from "lucide-react";
import { motion } from "framer-motion";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  const navItems = [
    { name: "Dashboard", icon: Home, label: "Home" },
    { name: "Hikes", icon: Mountain, label: "Touren" },
    { name: "MapView", icon: Map, label: "Karte" },
    { name: "Dogs", icon: PawPrint, label: "Meine Hunde" },
  ];

  const isActive = (pageName) => currentPageName === pageName;

  return (
    <div className="min-h-screen bg-stone-50">
      {children}

      {/* Bottom Navigation - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-stone-200 md:hidden z-50">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.name);
            return (
              <Link
                key={item.name}
                to={createPageUrl(item.name)}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
                  active ? "text-slate-800" : "text-stone-400 hover:text-stone-600"
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : ""}`} />
                <span className="text-xs font-medium">{item.label}</span>
                {active && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 w-1 h-1 bg-slate-800 rounded-full"
                  />
                )}
              </Link>
            );
          })}

        </div>
      </nav>

      {/* Top Navigation - Desktop */}
      <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-b border-stone-200 hidden md:block z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2">
              <Mountain className="w-6 h-6 text-slate-800" />
              <span className="text-lg font-medium text-stone-800">Südtirol mit Hund</span>
            </Link>
            
            <div className="flex items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.name);
                return (
                  <Link
                    key={item.name}
                    to={createPageUrl(item.name)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                      active
                        ? "bg-slate-100 text-slate-800"
                        : "text-stone-500 hover:text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
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