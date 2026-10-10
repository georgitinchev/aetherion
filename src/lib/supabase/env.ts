/**
 * Public Supabase settings. The Vercel ↔ Supabase integration provides
 * NEXT_PUBLIC_SUPABASE_ANON_KEY; newer projects call it the publishable key.
 * Both are safe to ship to the browser: Row Level Security protects the data.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
