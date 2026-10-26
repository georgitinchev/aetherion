import { generateText } from "ai";
import { languageModel, liveModelIds, PREFERRED_MODELS, providerOptions } from "@/lib/ai/model";
import { isCronRequest, pingDatabase } from "@/lib/cron";

export const maxDuration = 60;

/**
 * Daily Vercel Cron job (schedule in vercel.json). Vercel signs the request
 * with CRON_SECRET, so nobody else can trigger it.
 *
 * - Database: one tiny query. Free Supabase projects pause without a few
 *   database requests a day; /api/cron/keepalive sends the others.
 * - AI: confirms at least one preferred model is still served and answers.
 *   A failure shows up as a failed run in Vercel → Cron Jobs and in the logs.
 */
export async function GET(request: Request) {
  if (!isCronRequest(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [database, ai] = await Promise.all([pingDatabase(), checkAi()]);
  const healthy = database === "ok" && ai.status === "ok";
  return Response.json({ database, ai }, { status: healthy ? 200 : 502 });
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
