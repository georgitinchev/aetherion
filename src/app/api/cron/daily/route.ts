import { createClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/env";

/**
 * Daily Vercel Cron job (schedule in vercel.json). Vercel signs the request
 * with CRON_SECRET, so nobody else can trigger it.
 *
 * Free Supabase projects pause after about a week without traffic; one tiny
 * query a day keeps the database awake.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const database = await pingDatabase();
  return Response.json({ database }, { status: database === "ok" ? 200 : 502 });
}

async function pingDatabase(): Promise<"ok" | "error"> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
  // An anonymous caller sees zero rows (RLS), but the query still reaches Postgres.
  const { error } = await supabase.from("journeys").select("id", { head: true, count: "exact" });
  if (error) console.error("[cron] database ping failed", error);
  return error ? "error" : "ok";
}
