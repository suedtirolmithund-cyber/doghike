import React, { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { clearDogNudgeSession } from "@/lib/dogNudgeSession";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings] = useState(null);

  // Ensure a profile row exists — runs on every login, never overwrites existing data
  const ensureProfile = async (user) => {
    if (!user) return;
    try {
      const { error } = await supabase.from("profiles").upsert(
        {
          user_id: user.id,
          // Fall back to email prefix so the user is always searchable
          full_name:
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            null,
          avatar_url: user.user_metadata?.avatar_url || null,
        },
        { onConflict: "user_id", ignoreDuplicates: true }
      );
      if (error) console.error("[ensureProfile] error:", error.message);
    } catch (err) {
      console.error("[ensureProfile] exception:", err);
    }
  };

  // Fetch admin role from profiles table
  const fetchRole = async (userId) => {
    if (!userId) { setIsAdmin(false); return; }
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("[fetchRole] error:", error.message);
        setIsAdmin(false);
        return;
      }

      setIsAdmin(data?.role === "admin");
    } catch (err) {
      console.error("[fetchRole] exception:", err);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session?.user);
      setIsLoadingAuth(false);
      if (session?.user) {
        ensureProfile(session.user).then(() => fetchRole(session.user.id));
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session?.user);
      if (session?.user) {
        ensureProfile(session.user).then(() => fetchRole(session.user.id));
      } else {
        setIsAdmin(false);
      }
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
    if (error) { setAuthError(error.message); return { error }; }
    return { data };
  };

  const signUpWithEmail = async (email, password) => {
    setAuthError(null);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { setAuthError(error.message); return { error }; }
    return { data };
  };

  const resetPasswordForEmail = async (email) => {
    setAuthError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/Login",
    });
    if (error) { setAuthError(error.message); return { error }; }
    return {};
  };

  const updatePassword = async (password) => {
    setAuthError(null);
    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) { setAuthError(error.message); return { error }; }
    return { data };
  };

  const loginWithGoogle = async (redirectPath = "/") => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + redirectPath },
    });
    if (error) { setAuthError(error.message); return { error }; }
  };

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated, isAdmin,
      isLoadingAuth, isLoadingPublicSettings,
      authError, appPublicSettings,
      logout, loginWithEmail, signUpWithEmail, loginWithGoogle, resetPasswordForEmail, updatePassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
