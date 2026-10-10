import { createTextStreamResponse, streamText, toTextStream } from "ai";
import { authorizedBody } from "@/lib/ai/http";
import { languageModel, providerOptions } from "@/lib/ai/model";
import { lessonInstructions, lessonPrompt } from "@/lib/ai/prompts";
import { LessonRequestSchema } from "@/lib/schemas";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { data, error } = await authorizedBody(req, LessonRequestSchema);
  if (error) return error;

  const result = streamText({
    model: await languageModel(),
    providerOptions,
    instructions: lessonInstructions,
    prompt: lessonPrompt(data),
    maxOutputTokens: 3000,
    onError: ({ error }) => console.error("[api/lesson]", error),
  });

  return createTextStreamResponse({ stream: toTextStream({ stream: result.stream }) });
}
