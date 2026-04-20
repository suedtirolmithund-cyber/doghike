import React, { createContext, useState, useContext, useEffect } from "react";
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

  // Ensure a profile row exists for the user (important for Google OAuth users)
  const ensureProfile = async (user) => {
    if (!user) return;
    // Insert only if no profile exists yet — ignoreDuplicates prevents overwriting
    await supabase.from("profiles").insert(
      {
        user_id: user.id,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
        avatar_url: user.user_metadata?.avatar_url || null,
      },
      { onConflict: "user_id", ignoreDuplicates: true }
    );
  };

  // Fetch admin role from profiles table
  const fetchRole = async (userId) => {
    if (!userId) { setIsAdmin(false); return; }
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", userId)
      .single();
    setIsAdmin(data?.role === "admin");
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session?.user);
      setIsLoadingAuth(false);
      if (session?.user) {
        ensureProfile(session.user);
        fetchRole(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session?.user);
      if (session?.user) {
        ensureProfile(session.user);
        fetchRole(session.user.id);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
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

  const loginWithGoogle = async () => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/" },
    });
    if (error) { setAuthError(error.message); return { error }; }
  };

  const navigateToLogin = () => { window.location.href = "/login"; };
  const checkAppState = () => {};

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated, isAdmin,
      isLoadingAuth, isLoadingPublicSettings,
      authError, appPublicSettings,
      logout, loginWithEmail, signUpWithEmail, loginWithGoogle, resetPasswordForEmail,
      navigateToLogin, checkAppState,
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
