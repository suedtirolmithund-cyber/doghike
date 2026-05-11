import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

export default function PageNotFound() {
  const location = useLocation();
  const navigate = useNavigate();
  const pageName = location.pathname.substring(1);
  const { isAdmin } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-50/20 p-6">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-brand-400/30 bg-gradient-to-br from-brand-700 via-brand-600 to-[#2777b8] p-8 text-center text-white shadow-[0_18px_42px_rgba(192,48,96,0.2)]">
        <div className="space-y-2">
          <h1 className="text-7xl font-light text-white/70">404</h1>
          <div className="mx-auto h-0.5 w-16 bg-white/35" />
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-medium text-white">Seite nicht gefunden</h2>
          <p className="leading-relaxed text-brand-50">
            Die Seite <span className="font-medium text-white">"{pageName}"</span> existiert nicht.
          </p>
        </div>

        {isAdmin && (
          <div className="mt-4 rounded-lg border border-white/20 bg-white/12 p-4 text-left">
            <p className="mb-1 text-sm font-medium text-white">Admin-Hinweis</p>
            <p className="text-sm text-brand-50">
              Diese Route ist nicht registriert oder die Seite ist noch nicht implementiert.
            </p>
          </div>
        )}

        <div className="pt-4">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center rounded-lg border border-white bg-white px-4 py-2 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50"
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Zur Startseite
          </button>
        </div>
      </div>
    </div>
  );
}
