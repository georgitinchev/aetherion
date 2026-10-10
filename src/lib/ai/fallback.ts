import { APICallError, type LanguageModelV4 } from "@ai-sdk/provider";

/**
 * Errors that mean "this model can't serve the request right now", so the
 * next model should get a turn: rate limits, retired/unknown models, outages.
 * Anything else (bad prompt, invalid JSON) is the caller's to handle.
 */
export function isModelUnavailable(error: unknown): boolean {
  if (!APICallError.isInstance(error)) return false;
  const status = error.statusCode ?? 0;
  return (
    status === 429 ||
    status === 404 ||
    status >= 500 ||
    /model_not_found|model_decommissioned|does not exist/.test(error.responseBody ?? "")
  );
}

/**
 * Wraps models in priority order into one model: each call goes to the first
 * model and moves down the list only while models are unavailable.
 */
export function withFallback(models: LanguageModelV4[]): LanguageModelV4 {
  if (models.length === 0) throw new Error("withFallback needs at least one model");
  if (models.length === 1) return models[0];
  const [primary] = models;

  async function attempt<T>(call: (model: LanguageModelV4) => PromiseLike<T>): Promise<T> {
    let lastError: unknown;
    for (const model of models) {
      try {
        return await call(model);
      } catch (error) {
        if (!isModelUnavailable(error)) throw error;
        console.warn(`[ai] ${model.modelId} unavailable, falling back`);
        lastError = error;
      }
    }
    throw lastError;
  }

  return {
    specificationVersion: "v4",
    provider: primary.provider,
    modelId: primary.modelId,
    supportedUrls: primary.supportedUrls,
    doGenerate: (options) => attempt((model) => model.doGenerate(options)),
    doStream: (options) => attempt((model) => model.doStream(options)),
  };
}

/**
 * Keeps the preferred order but drops models Groq no longer serves. If the
 * live list is unknown, or none of the preferred models are live, the
 * preferred list is returned unchanged so errors surface instead of hiding.
 */
export function pickModels(preferred: readonly string[], live: ReadonlySet<string> | null): string[] {
  if (!live) return [...preferred];
  const available = preferred.filter((id) => live.has(id));
  return available.length > 0 ? available : [...preferred];
}
