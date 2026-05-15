import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const missingConfigError = new Error(
  "Supabase ist in der Native-App noch nicht konfiguriert."
);

function createMissingConfigClient() {
  const authResult = {
    data: { session: null, user: null, subscription: { unsubscribe: () => {} } },
    error: null,
  };
  const failingResult = { data: null, error: missingConfigError };

  return {
    auth: {
      getSession: async () => authResult,
      onAuthStateChange: () => authResult,
      signOut: async () => ({ error: null }),
      signInWithPassword: async () => failingResult,
      signUp: async () => failingResult,
    },
    from: () => ({
      select: async () => failingResult,
      insert: async () => failingResult,
    }),
  };
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : createMissingConfigClient();
