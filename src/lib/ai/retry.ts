import "server-only";
import { APICallError, NoObjectGeneratedError } from "ai";

/**
 * gpt-oss on Groq occasionally emits malformed JSON (e.g. a dropped quote),
 * which Groq rejects with `json_validate_failed` and the SDK does not retry.
 * The failure is random per sample, so simply asking again almost always works.
 */
function isInvalidJson(error: unknown) {
  return (
    NoObjectGeneratedError.isInstance(error) ||
    (APICallError.isInstance(error) && (error.responseBody ?? "").includes("json_validate_failed"))
  );
}

export async function retryOnInvalidJson<T>(run: () => Promise<T>, attempts = 3): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await run();
    } catch (error) {
      if (attempt >= attempts || !isInvalidJson(error)) throw error;
      console.warn(`[ai] invalid JSON from model, retrying (${attempt}/${attempts - 1})`);
    }
  }
}
