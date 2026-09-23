import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@word-lock/core/db";
import { AppState } from "react-native";

function createSupabaseClient() {
  const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    const missing = [
      ...(!SUPABASE_URL ? ["EXPO_PUBLIC_SUPABASE_URL"] : []),
      ...(!SUPABASE_ANON_KEY ? ["EXPO_PUBLIC_SUPABASE_ANON_KEY"] : []),
    ];
    throw new Error(`Missing Supabase environment variable(s): ${missing.join(", ")}`);
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: "pkce",
    },
  });
}

export const supabase = createSupabaseClient();

AppState.addEventListener("change", (state) => {
  if (state === "active") {
    void supabase.auth.startAutoRefresh();
  } else {
    void supabase.auth.stopAutoRefresh();
  }
});
