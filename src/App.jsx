import { Toaster } from "@/components/ui/sonner"
import CookieBanner from '@/components/CookieBanner';
import { QueryClientProvider, useQuery } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import AppLoadingScreen from '@/components/AppLoadingScreen';
import PawLoadingTrail from '@/components/PawLoadingTrail';
import GuestWelcomeScreen from '@/components/GuestWelcomeScreen';
import ConsentDialog from '@/components/ConsentDialog';
import { getDogs } from '@/lib/profilesApi';
import { hasSeenDogNudgeThisSession, markDogNudgeSeenThisSession } from '@/lib/dogNudgeSession';
import { createPageUrl } from '@/utils';
import React from 'react';
import { useEffect, useState } from 'react';
import { Suspense, lazy } from 'react';

const CHUNK_RELOAD_KEY = "doghike_chunk_reload_attempted";
const REACT130_RELOAD_KEY = "doghike_react130_reload_attempted";
const GENERIC_LOAD_RELOAD_KEY = "doghike_generic_load_reload_attempted";
const CACHE_BUST_PARAM = "__doghike_reload";
function hardReloadWithCacheBust() {
  const url = new URL(window.location.href);
  url.searchParams.set(CACHE_BUST_PARAM, String(Date.now()));
  window.location.replace(url.toString());
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      const rawError = this.state.error;
      const errorMessage = String(rawError);
      const errorName = rawError?.name ? String(rawError.name) : "";
      const errorStack = rawError?.stack ? String(rawError.stack) : "";
      const errorCause = rawError?.cause
        ? (() => {
            try {
              return typeof rawError.cause === "string"
                ? rawError.cause
                : JSON.stringify(rawError.cause, null, 2);
            } catch {
              return String(rawError.cause);
            }
          })()
        : "";
      const serializedError = (() => {
        try {
          return JSON.stringify(rawError, Object.getOwnPropertyNames(rawError ?? {}), 2);
        } catch {
          return "";
        }
      })();
      const diagnosticText = [
        errorName && errorName !== "Error" ? `Name: ${errorName}` : "",
        errorMessage ? `Message: ${errorMessage}` : "",
        errorCause ? `Cause: ${errorCause}` : "",
        errorStack ? `Stack:\n${errorStack}` : "",
        serializedError && serializedError !== "{}" ? `Details:\n${serializedError}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");
      const isChunkLoadError =
        errorMessage.includes("Failed to fetch dynamically imported module")
        || errorMessage.includes("Importing a module script failed");
      const isInvalidElementTypeError =
        errorMessage.includes("Minified React error #130")
        || errorMessage.includes("Element type is invalid");
      const isGenericLoadError = errorMessage.trim() === "Error";

      if (isChunkLoadError && typeof window !== "undefined") {
        const alreadyRetried = window.sessionStorage.getItem(CHUNK_RELOAD_KEY) === "1";

        if (!alreadyRetried) {
          window.sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
          hardReloadWithCacheBust();

          return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-50/10 px-6 text-center">
              <div className="doghike-glass-card max-w-md p-6">
                <h2 className="mb-2 text-lg font-semibold text-slate-900">App wird aktualisiert</h2>
                <p className="text-sm text-slate-500">Ein neuer Stand wurde erkannt. DogTrails lädt einmal neu.</p>
                <PawLoadingTrail />
              </div>
            </div>
          );
        }
      }

      if (isInvalidElementTypeError && typeof window !== "undefined") {
        const alreadyRetried = window.sessionStorage.getItem(REACT130_RELOAD_KEY) === "1";

        if (!alreadyRetried) {
          window.sessionStorage.setItem(REACT130_RELOAD_KEY, "1");
          hardReloadWithCacheBust();

          return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-50/10 px-6 text-center">
              <div className="doghike-glass-card max-w-md p-6">
                <h2 className="mb-2 text-lg font-semibold text-slate-900">App wird aktualisiert</h2>
                <p className="text-sm text-slate-500">DogTrails lädt den aktuellen Stand einmal neu.</p>
                <PawLoadingTrail />
              </div>
            </div>
          );
        }
      }

      if (isGenericLoadError && typeof window !== "undefined") {
        const alreadyRetried = window.sessionStorage.getItem(GENERIC_LOAD_RELOAD_KEY) === "1";

        if (!alreadyRetried) {
          window.sessionStorage.setItem(GENERIC_LOAD_RELOAD_KEY, "1");
          hardReloadWithCacheBust();

          return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-50/10 px-6 text-center">
              <div className="doghike-glass-card max-w-md p-6">
                <h2 className="mb-2 text-lg font-semibold text-slate-900">App wird aktualisiert</h2>
                <p className="text-sm text-slate-500">DogTrails lädt die aktuelle Version noch einmal neu.</p>
                <PawLoadingTrail />
              </div>
            </div>
          );
        }
      }

      return (
        <div className="min-h-screen bg-brand-50 p-8 text-[#7C3020]">
          <h2 className="doghike-section-title mb-3">Fehler beim Laden der App</h2>
          <pre style={{ color: 'red', whiteSpace: 'pre-wrap', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>
            {diagnosticText || errorMessage}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const PremiumPage = lazy(() => import("./pages/Premium"));
const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const PageFallback = () => (
  <div className="flex min-h-[40vh] items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-50/10">
    <div className="text-center">
      <PawLoadingTrail className="mt-0" />
      <p className="mt-3 text-sm text-slate-500">Lädt...</p>
    </div>
  </div>
);

const PageShell = ({ children, currentPageName }) => (
  <LayoutWrapper currentPageName={currentPageName}>
    <Suspense fallback={<PageFallback />}>{children}</Suspense>
  </LayoutWrapper>
);

const PUBLIC_PAGE_DEFINITIONS = [
  { name: "AGB", paths: [createPageUrl("AGB"), "/agb", "/nutzungsbedingungen", "/terms"] },
  { name: "Datenschutz", paths: [createPageUrl("Datenschutz"), "/datenschutz", "/privacy"] },
  { name: "Impressum", paths: [createPageUrl("Impressum"), "/impressum"] },
  { name: "Legal", paths: [createPageUrl("Legal"), "/legal", "/rechtliches", "/rechtliche-hinweise"] },
  { name: "Support", paths: [createPageUrl("Support"), "/support", "/hilfe"] },
];

function normalizeAppPath(pathname) {
  const withoutTrailingSlash = pathname.replace(/\/+$/, "");
  return (withoutTrailingSlash || "/").toLowerCase();
}

function getPublicPageName(pathname) {
  const normalizedPath = normalizeAppPath(pathname);
  return PUBLIC_PAGE_DEFINITIONS.find(({ paths }) =>
    paths.some((path) => normalizeAppPath(path) === normalizedPath)
  )?.name ?? null;
}

function renderPublicPageRoutes() {
  return PUBLIC_PAGE_DEFINITIONS.flatMap(({ name, paths }) => {
    const Page = Pages[name];
    if (!Page) return null;

    return [...new Set(paths.map(normalizeAppPath))].map((path) => (
      <Route
        key={path}
        path={path}
        element={
          <PageShell currentPageName={name}>
            <Page />
          </PageShell>
        }
      />
    ));
  });
}

const ScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname, location.search]);

  return null;
};

const BootLoadingGate = () => {
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowLoading(true), 900);
    return () => window.clearTimeout(timer);
  }, []);

  if (!showLoading) {
    return <div className="fixed inset-0 z-[100] bg-black" />;
  }

  return <AppLoadingScreen extended />;
};

const DogProfileRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const allowedWithoutDogPaths = React.useMemo(
    () => new Set([createPageUrl("Dogs"), createPageUrl("TopDogs")]),
    []
  );

  const { data: dogs = [], isFetched, isError } = useQuery({
    queryKey: ["dogs", user?.id],
    queryFn: () => getDogs(user?.id),
    enabled: isAuthenticated && !!user?.id,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!isAuthenticated || !isFetched || isError || dogs.length > 0) return;
    if (allowedWithoutDogPaths.has(location.pathname)) return;
    if (hasSeenDogNudgeThisSession(user.id)) return;

    markDogNudgeSeenThisSession(user.id);
    navigate(createPageUrl("Dogs"), { replace: true });
  }, [allowedWithoutDogPaths, dogs.length, isAuthenticated, isError, isFetched, location.pathname, navigate, user?.id]);

  return null;
};

const AuthenticatedApp = () => {
  const location = useLocation();
  const {
    isAuthenticated,
    isLoadingAuth,
    isRegistrationConsentCurrent,
    acceptCurrentRegistrationConsent,
    authError,
  } = useAuth();
  const [isAcceptingRegistrationConsent, setIsAcceptingRegistrationConsent] = useState(false);
  const isBootLoading = isLoadingAuth;
  const publicPageName = getPublicPageName(location.pathname);

  if (isBootLoading) {
    return <BootLoadingGate />;
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<GuestWelcomeScreen />} />
        <Route path={createPageUrl("Login")} element={<GuestWelcomeScreen />} />
        {renderPublicPageRoutes()}
        <Route path="*" element={<GuestWelcomeScreen />} />
      </Routes>
    );
  }

  if (publicPageName) {
    const PublicPage = Pages[publicPageName];

    return (
      <PageShell currentPageName={publicPageName}>
        <PublicPage />
      </PageShell>
    );
  }

  if (isRegistrationConsentCurrent === null) {
    return <BootLoadingGate />;
  }

  if (!isRegistrationConsentCurrent) {
    return (
      <ConsentDialog
        type="registration_update"
        open
        isSubmitting={isAcceptingRegistrationConsent}
        errorMessage={authError}
        onAccept={async () => {
          setIsAcceptingRegistrationConsent(true);
          const result = await acceptCurrentRegistrationConsent("post_login_update");
          if (result?.error) {
            setIsAcceptingRegistrationConsent(false);
          }
        }}
      />
    );
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <PageShell currentPageName={mainPageKey}>
          <DogProfileRedirect />
          <MainPage />
        </PageShell>
      } />
      <Route path="/trails" element={<Navigate to={createPageUrl("Hikes")} replace />} />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <PageShell currentPageName={path}>
              <DogProfileRedirect />
              <Page />
            </PageShell>
          }
        />
      ))}
      <Route path="/Premium" element={<PageShell currentPageName="Premium"><DogProfileRedirect /><PremiumPage /></PageShell>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      window.sessionStorage.removeItem(REACT130_RELOAD_KEY);
    }
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <NavigationTracker />
            <AuthenticatedApp />
            <Toaster />
            <CookieBanner />
          </Router>
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
