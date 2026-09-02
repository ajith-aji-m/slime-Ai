import { getLiveCatalogue } from "@/lib/ai/server/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Live Model Registry: static model metadata + runtime `available` flags
 * (true only when the provider's credentials are present on the server) +
 * any models defined via `NVIDIA_MODELS`. No secrets are returned.
 */
export async function GET(): Promise<Response> {
  return Response.json(getLiveCatalogue(), {
    headers: { "Cache-Control": "no-store" },
  });
}
