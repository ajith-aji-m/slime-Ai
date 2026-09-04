import "server-only";
import type { StreamChunk } from "@/types/provider";
import { REQUEST_TIMEOUT_MS, readNvidiaEnv } from "./env";

export interface ImageGenerationConfig {
  /** NVIDIA NIM upstream id of a model marked `image: true` in the registry */
  upstreamId: string;
  /** full invoke URL, when the model's registry entry sets one — see `RegistryModel.endpoint` */
  endpoint?: string;
  prompt: string;
  signal?: AbortSignal;
}

/**
 * Response shapes seen across image-generation APIs in the wild:
 *  - OpenAI-compatible: `{ data: [{ b64_json | url }] }`
 *  - Stability-dialect (common for NVIDIA-hosted SD/FLUX NIMs): `{ artifacts: [{ base64 }] }`
 *  - a bare `{ image | b64_image: "<base64>" }`
 * Parsed defensively since no model in the current registry actually uses
 * this path yet — see the audit note in `src/config/models.ts`.
 */
interface ImagesResponse {
  data?: { b64_json?: string; url?: string }[];
  artifacts?: { base64?: string }[];
  image?: string;
  b64_image?: string;
}

function extractImageUrl(json: ImagesResponse): string {
  const fromData = json.data?.[0];
  if (fromData?.url) return fromData.url;
  if (fromData?.b64_json) return `data:image/png;base64,${fromData.b64_json}`;
  const fromArtifact = json.artifacts?.[0]?.base64;
  if (fromArtifact) return `data:image/png;base64,${fromArtifact}`;
  const bare = json.image ?? json.b64_image;
  if (bare) return bare.startsWith("http") || bare.startsWith("data:") ? bare : `data:image/png;base64,${bare}`;
  return "";
}

/**
 * Calls an image-generation endpoint and normalises the result to a single
 * `image` `StreamChunk`. Only ever invoked with a model the registry marks
 * `image: true` — the router never sends an image prompt to a text model.
 *
 * Uses `config.endpoint` (the model's real NIM invoke URL) when the registry
 * entry provides one. Falling back to a guessed OpenAI-style
 * `{baseUrl}/images/generations` route is a last resort for a model that
 * hasn't been confirmed against real NVIDIA docs — see `RegistryModel.endpoint`.
 * Mirrors `streamOpenAICompatible`'s error handling so the same
 * fallback/permanent-error rules apply.
 */
export async function* streamNvidiaImage(
  config: ImageGenerationConfig,
): AsyncGenerator<StreamChunk> {
  const env = readNvidiaEnv();
  if (!env) {
    yield {
      type: "error",
      message: "NVIDIA is not configured on the server.",
      code: "not_configured",
    };
    return;
  }

  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), REQUEST_TIMEOUT_MS);
  const signal = config.signal
    ? AbortSignal.any([config.signal, timeout.signal])
    : timeout.signal;

  let response: Response;
  try {
    response = await fetch(config.endpoint || `${env.baseUrl}/images/generations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.upstreamId,
        prompt: config.prompt,
        n: 1,
        response_format: "b64_json",
      }),
      signal,
    });
  } catch (error) {
    clearTimeout(timer);
    if (error instanceof DOMException && error.name === "AbortError") return;
    yield {
      type: "error",
      message: "Could not reach the image provider.",
      code: "network",
    };
    return;
  }

  if (!response.ok) {
    clearTimeout(timer);
    let detail = "";
    try {
      detail = (await response.text()).slice(0, 500);
    } catch {
      /* ignore */
    }
    yield {
      type: "error",
      message: `Image provider error ${response.status}${detail ? `: ${detail.replace(/\s+/g, " ").trim()}` : ""}`,
      code: `http_${response.status}`,
    };
    return;
  }

  let json: ImagesResponse;
  try {
    json = (await response.json()) as ImagesResponse;
  } catch {
    clearTimeout(timer);
    yield {
      type: "error",
      message: "The image provider returned an invalid response.",
      code: "empty",
    };
    return;
  }
  clearTimeout(timer);

  const url = extractImageUrl(json);
  if (!url) {
    yield {
      type: "error",
      message: "The image provider returned no image.",
      code: "empty",
    };
    return;
  }

  yield {
    type: "part-start",
    part: { type: "image", url, alt: "Generated image", prompt: config.prompt },
  };
  yield { type: "part-end" };
  yield { type: "done" };
}
