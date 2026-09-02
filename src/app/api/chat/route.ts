import type { ChatRequest, StreamChunk } from "@/types/provider";
import type { Message, ToolId } from "@/types/chat";
import { getServerStreamFn } from "@/lib/ai/server/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  modelId?: string;
  messages?: Message[];
  tools?: ToolId[];
}

/**
 * Streaming chat endpoint. The browser posts the conversation + model id here;
 * this route resolves the server-side provider, injects the API key, and streams
 * `StreamChunk` objects back as NDJSON (one JSON object per line).
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

  const { modelId, messages, tools = [] } = body;
  if (!modelId || !Array.isArray(messages)) {
    return Response.json(
      { error: "`modelId` and `messages` are required" },
      { status: 400 },
    );
  }

  const streamFn = getServerStreamFn(modelId);
  if (!streamFn) {
    return Response.json(
      { error: `No server provider is registered for model "${modelId}"` },
      { status: 404 },
    );
  }

  const chatRequest: ChatRequest = {
    modelId,
    messages,
    tools,
    signal: request.signal,
  };

  const encoder = new TextEncoder();
  const write = (chunk: StreamChunk) =>
    encoder.encode(`${JSON.stringify(chunk)}\n`);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of streamFn(chatRequest)) {
          controller.enqueue(write(chunk));
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          controller.enqueue(
            write({
              type: "error",
              message:
                error instanceof Error ? error.message : "Unexpected server error",
              code: "server",
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
