import { isCronRequest, pingDatabase } from "@/lib/cron";

/**
 * Extra Vercel Cron runs (schedule in vercel.json) that only ping the database.
 * Together with the daily job they send a few requests a day, which keeps the
 * free Supabase project from pausing.
 */
export async function GET(request: Request) {
  if (!isCronRequest(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const database = await pingDatabase();
  return Response.json({ database }, { status: database === "ok" ? 200 : 502 });
}
