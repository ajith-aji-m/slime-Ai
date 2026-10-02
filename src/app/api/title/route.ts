import type { Message } from "@/types/chat";
import { routeTitle } from "@/lib/ai/server/router";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  messages?: Message[];
}

/**
 * One-shot, non-streaming title generation — a short-lived background call
 * `conversation-store` makes after an assistant reply completes, never part
 * of the chat thread itself. `messages` here is the synthetic
 * system+transcript request `buildTitleRequestMessages` builds client-side,
 * not the real conversation's own messages array.
 *
 * The mock provider never calls this route — it generates a title entirely
 * in the browser (`mockGenerateTitle`), same as it never calls `/api/chat`.
 */
export async function POST(request: Request): Promise<Response> {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { messages } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "`messages` is required" }, { status: 400 });
  }

  const title = await routeTitle({ messages, signal: request.signal });
  return Response.json({ title });
}
