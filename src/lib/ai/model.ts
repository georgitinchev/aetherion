import "server-only";
import { groq, type GroqLanguageModelChatOptions } from "@ai-sdk/groq";

/**
 * The only file that knows which provider powers Aetherion. To swap Groq for
 * another AI SDK provider (Gemini, OpenRouter, ...), change the imports here.
 * Groq retires models often: `curl api.groq.com/openai/v1/models` lists what's live.
 */

const DEFAULT_MODEL = "openai/gpt-oss-120b";

/** Schema-constrained JSON (journey plans, quizzes). Needs json_schema support. */
export const structuredModel = () => groq(process.env.AI_MODEL_STRUCTURED ?? DEFAULT_MODEL);

/** Streamed prose (lessons, tutor chat). */
export const proseModel = () => groq(process.env.AI_MODEL_PROSE ?? DEFAULT_MODEL);

/** gpt-oss is a reasoning model; low effort keeps latency near-instant for teaching content. */
export const providerOptions = {
  groq: { reasoningEffort: "low" } satisfies GroqLanguageModelChatOptions,
};

/** Strict mode constrains decoding to the schema instead of validating after the fact. */
export const structuredProviderOptions = {
  groq: { ...providerOptions.groq, strictJsonSchema: true } satisfies GroqLanguageModelChatOptions,
};
