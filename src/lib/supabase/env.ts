function requireValue(name: string, value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(
      `Missing environment variable: ${name}. Set it in .env.local (see .env.example).`
    );
  }
  return trimmed;
}

/**
 * Public Supabase project URL (safe for browser).
 * Must read `process.env.NEXT_PUBLIC_*` statically so Next.js inlines it into the client bundle.
 */
export function getSupabaseUrl(): string {
  return requireValue("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
}

/** Anon key: RLS applies, safe for browser. */
export function getSupabaseAnonKey(): string {
  return requireValue(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/** Service role key: bypasses RLS, server-only. */
export function getSupabaseServiceRoleKey(): string {
  return requireValue("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);
}
