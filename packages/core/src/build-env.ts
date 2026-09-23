export function supabaseOrigin(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
}
