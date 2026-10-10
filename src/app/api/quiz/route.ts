import { generateText, Output } from "ai";
import { aiFailure, authorizedBody } from "@/lib/ai/http";
import { structuredModel, structuredProviderOptions } from "@/lib/ai/model";
import { quizInstructions, quizPrompt } from "@/lib/ai/prompts";
import { retryOnInvalidJson } from "@/lib/ai/retry";
import { QuizRequestSchema, QuizSchema } from "@/lib/schemas";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { data, error } = await authorizedBody(req, QuizRequestSchema);
  if (error) return error;

  try {
    const { output } = await retryOnInvalidJson(() =>
      generateText({
        model: structuredModel(),
        providerOptions: structuredProviderOptions,
        output: Output.object({ schema: QuizSchema }),
        instructions: quizInstructions,
        prompt: quizPrompt(data, data.lesson),
        maxOutputTokens: 4000,
      }),
    );
    return Response.json(output);
  } catch (err) {
    return aiFailure("api/quiz", err);
  }
}
