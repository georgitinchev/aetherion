import { createClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/env";

/** Vercel signs cron requests with CRON_SECRET, so nobody else can trigger them. */
export function isCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  return !!secret && request.headers.get("authorization") === `Bearer ${secret}`;
}

/**
 * Free Supabase projects pause without a few database requests each day,
 * so the cron jobs send one tiny query each.
 */
export async function pingDatabase(): Promise<"ok" | "error"> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
  // An anonymous caller sees zero rows (RLS), but the query still reaches Postgres.
  const { error } = await supabase.from("journeys").select("id", { head: true, count: "exact" });
  if (error) console.error("[cron] database ping failed", error);
  return error ? "error" : "ok";
}
