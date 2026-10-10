import { createClient } from "@supabase/supabase-js";
import { generateText } from "ai";
import { languageModel, liveModelIds, PREFERRED_MODELS, providerOptions } from "@/lib/ai/model";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/env";

export const maxDuration = 60;

/**
 * Daily Vercel Cron job (schedule in vercel.json). Vercel signs the request
 * with CRON_SECRET, so nobody else can trigger it.
 *
 * - Database: free Supabase projects pause after about a week without
 *   traffic; one tiny query a day keeps the database awake.
 * - AI: confirms at least one preferred model is still served and answers.
 *   A failure shows up as a failed run in Vercel → Cron Jobs and in the logs.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [database, ai] = await Promise.all([pingDatabase(), checkAi()]);
  const healthy = database === "ok" && ai.status === "ok";
  return Response.json({ database, ai }, { status: healthy ? 200 : 502 });
}

async function pingDatabase(): Promise<"ok" | "error"> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
  // An anonymous caller sees zero rows (RLS), but the query still reaches Postgres.
  const { error } = await supabase.from("journeys").select("id", { head: true, count: "exact" });
  if (error) console.error("[cron] database ping failed", error);
  return error ? "error" : "ok";
}

async function checkAi(): Promise<{ status: "ok" | "error"; models: string[] }> {
  const live = await liveModelIds();
  const models = live ? PREFERRED_MODELS.filter((id) => live.has(id)) : PREFERRED_MODELS;
  if (models.length === 0) {
    console.error("[cron] Groq no longer serves any of AI_MODELS:", PREFERRED_MODELS.join(", "));
    return { status: "error", models };
  }
  try {
    const { text } = await generateText({
      model: await languageModel(),
      providerOptions,
      prompt: "Reply with the single word: ok",
      maxOutputTokens: 300,
    });
    return { status: text.trim() ? "ok" : "error", models };
  } catch (error) {
    console.error("[cron] AI check failed", error);
    return { status: "error", models };
  }
}
