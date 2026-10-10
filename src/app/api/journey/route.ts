import { generateText, Output } from "ai";
import { aiFailure, authorizedBody } from "@/lib/ai/http";
import { structuredModel, structuredProviderOptions } from "@/lib/ai/model";
import { journeyInstructions, journeyPrompt } from "@/lib/ai/prompts";
import { retryOnInvalidJson } from "@/lib/ai/retry";
import { JourneyPlanSchema, JourneyRequestSchema } from "@/lib/schemas";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { data, error } = await authorizedBody(req, JourneyRequestSchema);
  if (error) return error;

  try {
    const { output } = await retryOnInvalidJson(() =>
      generateText({
        model: structuredModel(),
        providerOptions: structuredProviderOptions,
        output: Output.object({ schema: JourneyPlanSchema }),
        instructions: journeyInstructions,
        prompt: journeyPrompt(data.topic),
        maxOutputTokens: 3000,
      }),
    );
    return Response.json(output);
  } catch (err) {
    return aiFailure("api/journey", err);
  }
}
