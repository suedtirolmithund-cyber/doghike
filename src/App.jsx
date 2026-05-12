import { Toaster } from "@/components/ui/toaster"
import CookieBanner from '@/components/CookieBanner';
import { QueryClientProvider, useQuery } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import AppLoadingScreen from '@/components/AppLoadingScreen';
import PawLoadingTrail from '@/components/PawLoadingTrail';
import { Loader2 } from 'lucide-react';
import GuestWelcomeScreen from '@/components/GuestWelcomeScreen';
import { getDogs } from '@/lib/profilesApi';
import React from 'react';
import { useEffect, useState } from 'react';
import { Suspense, lazy } from 'react';

const CHUNK_RELOAD_KEY = "doghike_chunk_reload_attempted";
const REACT130_RELOAD_KEY = "doghike_react130_reload_attempted";
const CACHE_BUST_PARAM = "__doghike_reload";
const DOG_PROFILE_REDIRECT_KEY = "dogtrails_no_dog_profile_redirected";

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
      const errorMessage = String(this.state.error);
      const isChunkLoadError =
        errorMessage.includes("Failed to fetch dynamically imported module")
        || errorMessage.includes("Importing a module script failed");
      const isInvalidElementTypeError =
        errorMessage.includes("Minified React error #130")
        || errorMessage.includes("Element type is invalid");

      if (isChunkLoadError && typeof window !== "undefined") {
        const alreadyRetried = window.sessionStorage.getItem(CHUNK_RELOAD_KEY) === "1";

        if (!alreadyRetried) {
          window.sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
          hardReloadWithCacheBust();

          return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-50/10 px-6 text-center">
              <div className="doghike-glass-card max-w-md p-6">
                <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-brand-500" />
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
                <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-brand-500" />
                <h2 className="mb-2 text-lg font-semibold text-slate-900">App wird aktualisiert</h2>
                <p className="text-sm text-slate-500">DogTrails lädt den aktuellen Stand einmal neu.</p>
                <PawLoadingTrail />
              </div>
            </div>
          );
        }
      }

      return (
        <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
          <h2>Fehler beim Laden der App</h2>
          <pre style={{ color: 'red', whiteSpace: 'pre-wrap' }}>{String(this.state.error)}</pre>
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
      <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-500" />
      <p className="mt-3 text-sm text-slate-500">Lädt...</p>
      <PawLoadingTrail />
    </div>
  </div>
);

const PageShell = ({ children, currentPageName }) => (
  <LayoutWrapper currentPageName={currentPageName}>
    <Suspense fallback={<PageFallback />}>{children}</Suspense>
  </LayoutWrapper>
);

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

  const { data: dogs = [], isFetched, isError } = useQuery({
    queryKey: ["dogs", user?.id],
    queryFn: () => getDogs(user.id),
    enabled: isAuthenticated && !!user?.id,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!isAuthenticated || !isFetched || isError || dogs.length > 0) return;
    if (location.pathname === "/Profile") return;
    if (window.sessionStorage.getItem(DOG_PROFILE_REDIRECT_KEY) === user.id) return;

    window.sessionStorage.setItem(DOG_PROFILE_REDIRECT_KEY, user.id);
    navigate("/Profile", { replace: true });
  }, [dogs.length, isAuthenticated, isError, isFetched, location.pathname, navigate, user?.id]);

  return null;
};

const AuthenticatedApp = () => {
  const { isAuthenticated, isLoadingAuth, isLoadingPublicSettings } = useAuth();
  const isBootLoading = isLoadingPublicSettings || isLoadingAuth;

  if (isBootLoading) {
    return <BootLoadingGate />;
  }

  if (!isAuthenticated) {
    return <GuestWelcomeScreen />;
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
