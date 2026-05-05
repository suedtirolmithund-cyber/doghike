import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const missingConfigError = new Error(
  "Supabase ist lokal nicht konfiguriert. Bitte VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY setzen."
);

function createMissingConfigClient() {
  const authResult = { data: { session: null, user: null, subscription: { unsubscribe: () => {} } }, error: null };
  const failingResult = { data: null, error: missingConfigError };

  return {
    auth: {
      getSession: async () => authResult,
      onAuthStateChange: () => authResult,
      signOut: async () => ({ error: null }),
      signInWithPassword: async () => failingResult,
      signUp: async () => failingResult,
      resetPasswordForEmail: async () => ({ error: missingConfigError }),
      updateUser: async () => failingResult,
      signInWithOAuth: async () => ({ error: missingConfigError }),
    },
    from: () => {
      const builder = {
        select: () => builder,
        insert: () => builder,
        update: () => builder,
        upsert: () => builder,
        delete: () => builder,
        eq: () => builder,
        neq: () => builder,
        in: () => builder,
        order: () => builder,
        limit: () => builder,
        maybeSingle: async () => failingResult,
        single: async () => failingResult,
        then: (resolve) => Promise.resolve(failingResult).then(resolve),
      };

      return builder;
    },
    storage: {
      from: () => ({
        upload: async () => failingResult,
        remove: async () => ({ data: null, error: missingConfigError }),
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
      }),
    },
    functions: {
      invoke: async () => failingResult,
    },
  };
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMissingConfigClient();
