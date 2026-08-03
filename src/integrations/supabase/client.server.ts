import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export const getSupabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables",
    );
  }

  // Server-only Supabase client - bypasses RLS.
  // Only import this in Route Handlers or Server Actions, never in client components.
  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};
