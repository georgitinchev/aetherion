import "server-only";
import type { z } from "zod";
import { getUserId } from "@/lib/supabase/server";

type Parsed<T> = { data: T; error?: never } | { data?: never; error: Response };

/**
 * Gate for every AI route: rejects signed-out callers (so only members spend
 * the Groq quota), then validates the JSON body against `schema`.
 */
export async function authorizedBody<S extends z.ZodType>(
  req: Request,
  schema: S,
): Promise<Parsed<z.infer<S>>> {
  if (!(await getUserId())) {
    return { error: Response.json({ error: "Sign in to continue." }, { status: 401 }) };
  }
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return { error: Response.json({ error: "Body must be JSON" }, { status: 400 }) };
  }
  const result = schema.safeParse(json);
  if (!result.success) {
    return { error: Response.json({ error: "Invalid request" }, { status: 400 }) };
  }
  return { data: result.data };
}

/** Logs the real cause server-side; the client only ever sees a generic message. */
export function aiFailure(route: string, error: unknown) {
  console.error(`[${route}]`, error);
  return Response.json(
    { error: "The holocron is silent. Try again in a moment." },
    { status: 502 },
  );
}
