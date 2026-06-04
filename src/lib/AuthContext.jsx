import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { clearDogNudgeSession } from "@/lib/dogNudgeSession";
import { supabase } from "@/lib/supabaseClient";
import { createPageUrl } from "@/utils";

const AuthContext = createContext();
const REGISTRATION_CONSENT_KEY = "doghike_pending_registration_consent";
const CONSENT_VERSION = "2026-06";

function getPendingRegistrationConsent() {
  try {
    const raw = window.localStorage.getItem(REGISTRATION_CONSENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setPendingRegistrationConsent(source) {
  const consent = {
    privacyVersion: CONSENT_VERSION,
    termsVersion: CONSENT_VERSION,
    acceptedAt: new Date().toISOString(),
    source,
  };

  try {
    window.localStorage.setItem(REGISTRATION_CONSENT_KEY, JSON.stringify(consent));
  } catch {
    // Keep registration usable if localStorage is unavailable.
  }

  return consent;
}

function clearPendingRegistrationConsent() {
  try {
    window.localStorage.removeItem(REGISTRATION_CONSENT_KEY);
  } catch {
    // Ignore localStorage cleanup issues.
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const hydrationRunRef = useRef(0);

  const applySessionState = (session) => {
    setUser(session?.user ?? null);
    setIsAuthenticated(!!session?.user);
  };

  // Ensure a profile row exists. This should never overwrite an existing profile.
  const ensureProfile = async (nextUser) => {
    if (!nextUser) return;

    try {
      const { error } = await supabase.from("profiles").upsert(
        {
          user_id: nextUser.id,
          full_name:
            nextUser.user_metadata?.full_name ||
            nextUser.user_metadata?.name ||
            nextUser.email?.split("@")[0] ||
            null,
          avatar_url: nextUser.user_metadata?.avatar_url || null,
        },
        { onConflict: "user_id", ignoreDuplicates: true },
      );

      if (error) {
        console.error("[ensureProfile] error:", error.message);
      }

      const metadataConsent = nextUser.user_metadata?.registration_consent ?? null;
      const pendingConsent = getPendingRegistrationConsent();
      const consent = metadataConsent || pendingConsent;

      if (consent?.acceptedAt || consent?.accepted_at) {
        const { error: consentError } = await supabase.from("registration_consents").upsert(
          {
            user_id: nextUser.id,
            privacy_version: consent.privacyVersion || consent.privacy_version || CONSENT_VERSION,
            terms_version: consent.termsVersion || consent.terms_version || CONSENT_VERSION,
            accepted_at: consent.acceptedAt || consent.accepted_at,
            accepted_source: consent.source || consent.accepted_source || "registration",
          },
          { onConflict: "user_id", ignoreDuplicates: true },
        );

        if (consentError) {
          console.error("[ensureProfile] registration consent error:", consentError.message);
        } else {
          clearPendingRegistrationConsent();
        }
      }
    } catch (error) {
      console.error("[ensureProfile] exception:", error);
    }
  };

  const fetchRole = async (userId) => {
    if (!userId) {
      return false;
    }

    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc("is_admin");
      if (rpcError) {
        console.error("[fetchRole] is_admin fallback error:", rpcError.message);
        return false;
      }

      return Boolean(rpcData);
    } catch (error) {
      console.error("[fetchRole] exception:", error);
      return false;
    }
  };

  useEffect(() => {
    const hydrateSessionData = async (session, runId) => {
      if (session?.user) {
        await ensureProfile(session.user);
        const nextIsAdmin = await fetchRole(session.user.id);

        if (hydrationRunRef.current !== runId) return;
        setIsAdmin(nextIsAdmin);
      } else {
        if (hydrationRunRef.current !== runId) return;
        setIsAdmin(false);
      }

      if (hydrationRunRef.current !== runId) return;
      setIsLoadingAuth(false);
    };

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const runId = ++hydrationRunRef.current;
      setIsLoadingAuth(true);
      applySessionState(session);
      await hydrateSessionData(session, runId);
    }).catch((error) => {
      const runId = ++hydrationRunRef.current;
      console.error("[AuthContext] getSession failed:", error);
      setAuthError(error?.message || "Die Anmeldung konnte nicht geladen werden.");
      applySessionState(null);
      setIsAdmin(false);
      if (hydrationRunRef.current !== runId) return;
      setIsLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const runId = ++hydrationRunRef.current;
      setIsLoadingAuth(true);
      applySessionState(session);
      void hydrateSessionData(session, runId);
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    if (user?.id) {
      clearDogNudgeSession(user.id);
    }
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
    setIsAdmin(false);
  };

  const loginWithEmail = async (email, password) => {
    setAuthError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError(error.message);
      return { error };
    }
    return { data };
  };

  const signUpWithEmail = async (email, password, consentSource = "email_registration") => {
    setAuthError(null);
    const consent = setPendingRegistrationConsent(consentSource);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          registration_consent: consent,
        },
      },
    });
    if (error) {
      clearPendingRegistrationConsent();
      setAuthError(error.message);
      return { error };
    }
    return { data };
  };

  const resetPasswordForEmail = async (email) => {
    setAuthError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}${createPageUrl("Login")}`,
    });
    if (error) {
      setAuthError(error.message);
      return { error };
    }
    return {};
  };

  const updatePassword = async (password) => {
    setAuthError(null);
    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) {
      setAuthError(error.message);
      return { error };
    }
    return { data };
  };

  const resendConfirmationEmail = async (email) => {
    setAuthError(null);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) {
      setAuthError(error.message);
      return { error };
    }
    return {};
  };

  const loginWithGoogle = async (redirectPath = "/", consentSource = null) => {
    setAuthError(null);
    if (consentSource) {
      setPendingRegistrationConsent(consentSource);
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + redirectPath },
    });
    if (error) {
      setAuthError(error.message);
      return { error };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        isLoadingAuth,
        authError,
        logout,
        loginWithEmail,
        signUpWithEmail,
        loginWithGoogle,
        resetPasswordForEmail,
        updatePassword,
        resendConfirmationEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
