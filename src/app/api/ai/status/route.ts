import { getAiMode } from "@/lib/ai/server/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Tells the client whether to use the offline mock provider or the routed
 * server provider. Returns no model or provider names.
 */
export async function GET(): Promise<Response> {
  return Response.json(
    { mode: getAiMode() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
