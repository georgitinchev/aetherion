import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  safeValidateUIMessages,
  streamText,
  toUIMessageStream,
} from "ai";
import { authorizedBody } from "@/lib/ai/http";
import { languageModel, providerOptions } from "@/lib/ai/model";
import { chatInstructions } from "@/lib/ai/prompts";
import { ChatRequestSchema } from "@/lib/schemas";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { data, error } = await authorizedBody(req, ChatRequestSchema);
  if (error) return error;

  const validated = await safeValidateUIMessages({ messages: data.messages });
  if (!validated.success) {
    return Response.json({ error: "Invalid messages" }, { status: 400 });
  }

  const result = streamText({
    model: await languageModel(),
    providerOptions,
    instructions: chatInstructions(data.context, data.context.lesson),
    messages: await convertToModelMessages(validated.data),
    maxOutputTokens: 2000,
    onError: ({ error }) => console.error("[api/chat]", error),
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream, sendReasoning: false }),
  });
}
