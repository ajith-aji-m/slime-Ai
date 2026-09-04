import { getAiStatus } from "@/lib/ai/server/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Tells the client whether to use the offline mock provider or the routed
 * server provider, plus non-secret capability flags (e.g. image generation).
 * Returns no model or provider names.
 */
export async function GET(): Promise<Response> {
  return Response.json(getAiStatus(), {
    headers: { "Cache-Control": "no-store" },
  });
}
