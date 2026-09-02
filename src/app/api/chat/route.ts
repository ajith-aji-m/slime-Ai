import type { StreamChunk } from "@/types/provider";
import type { Message, ToolId } from "@/types/chat";
import type { TaskCategory } from "@/config/ai-router";
import { routeChat } from "@/lib/ai/server/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  messages?: Message[];
  tools?: ToolId[];
  taskHint?: TaskCategory;
}

/**
 * Streaming chat endpoint. The browser posts the conversation here; the internal
 * AI Router picks an NVIDIA model, injects the API key, streams, and falls back
 * across models on recoverable errors. Responses are NDJSON `StreamChunk` lines.
 *
 * The mock provider does NOT use this route — it runs entirely in the browser.
 */
export async function POST(request: Request): Promise<Response> {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { messages, tools = [], taskHint } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "`messages` is required" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const write = (chunk: StreamChunk) =>
    encoder.encode(`${JSON.stringify(chunk)}\n`);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of routeChat({
          messages,
          tools,
          taskHint,
          signal: request.signal,
        })) {
          controller.enqueue(write(chunk));
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          controller.enqueue(
            write({
              type: "error",
              message: "Slime AI hit an unexpected error.",
              code: "server",
              recoverable: true,
            }),
          );
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
    },
  });
}
