import "server-only";
import { groq, type GroqLanguageModelChatOptions } from "@ai-sdk/groq";
import { pickModels, withFallback } from "./fallback";

/**
 * The only file that knows which provider powers Aetherion. To swap Groq for
 * another AI SDK provider (Gemini, OpenRouter, ...), change the imports here.
 */

/** Models in priority order; override with AI_MODELS="id1,id2". */
export const PREFERRED_MODELS = (process.env.AI_MODELS ?? "openai/gpt-oss-120b,openai/gpt-oss-20b")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

const LIVE_TTL_MS = 60 * 60 * 1000;
let liveCache: { ids: Set<string>; at: number } | null = null;

/**
 * Model ids Groq serves right now, cached per server instance for an hour.
 * Groq retires models regularly; checking the live list means a retired
 * model is skipped automatically instead of failing every request.
 */
export async function liveModelIds(): Promise<Set<string> | null> {
  if (liveCache && Date.now() - liveCache.at < LIVE_TTL_MS) return liveCache.ids;
  try {
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { data } = (await res.json()) as { data: { id: string }[] };
    liveCache = { ids: new Set(data.map((m) => m.id)), at: Date.now() };
    return liveCache.ids;
  } catch (error) {
    console.warn("[ai] could not read Groq's model list, using AI_MODELS as-is", error);
    return null;
  }
}

/** One model for all AI work: the live preferred models, with automatic fallback. */
export async function languageModel() {
  const ids = pickModels(PREFERRED_MODELS, await liveModelIds());
  return withFallback(ids.map((id) => groq(id)));
}

/** gpt-oss is a reasoning model; low effort keeps latency near-instant for teaching content. */
export const providerOptions = {
  groq: { reasoningEffort: "low" } satisfies GroqLanguageModelChatOptions,
};

/** Strict mode constrains decoding to the schema instead of validating after the fact. */
export const structuredProviderOptions = {
  groq: { ...providerOptions.groq, strictJsonSchema: true } satisfies GroqLanguageModelChatOptions,
};
