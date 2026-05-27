import React, { createContext, useContext, useEffect, useState } from "react";
import { clearDogNudgeSession } from "@/lib/dogNudgeSession";
import { supabase } from "@/lib/supabaseClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings] = useState(null);

  const applySessionState = (session) => {
    setUser(session?.user ?? null);
    setIsAuthenticated(!!session?.user);
    setIsLoadingAuth(false);
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
    } catch (error) {
      console.error("[ensureProfile] exception:", error);
    }
  };

  const fetchRole = async (userId) => {
    if (!userId) {
      setIsAdmin(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      const normalizedRole = typeof data?.role === "string" ? data.role.trim().toLowerCase() : "";
      if (!error && normalizedRole) {
        setIsAdmin(normalizedRole === "admin");
        return;
      }

      if (error) {
        console.error("[fetchRole] error:", error.message);
      }

      const { data: rpcData, error: rpcError } = await supabase.rpc("is_admin");
      if (rpcError) {
        console.error("[fetchRole] is_admin fallback error:", rpcError.message);
        setIsAdmin(false);
        return;
      }

      setIsAdmin(Boolean(rpcData));
    } catch (error) {
      console.error("[fetchRole] exception:", error);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    const hydrateSessionData = async (session) => {
      if (session?.user) {
        await ensureProfile(session.user);
        await fetchRole(session.user.id);
      } else {
        setIsAdmin(false);
      }
    };

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      applySessionState(session);
      await hydrateSessionData(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      applySessionState(session);

      // Keep the auth event itself light so login/logout can complete immediately.
      window.setTimeout(() => {
        void hydrateSessionData(session);
      }, 0);
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

  const signUpWithEmail = async (email, password) => {
    setAuthError(null);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setAuthError(error.message);
      return { error };
    }
    return { data };
  };

  const resetPasswordForEmail = async (email) => {
    setAuthError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/Login",
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

  const loginWithGoogle = async (redirectPath = "/") => {
    setAuthError(null);
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
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
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
