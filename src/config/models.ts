import type { TaskCategory } from "./ai-router";

/**
 * Internal model registry (NOT user-facing).
 *
 * `id` is an internal role name that may appear in local debug data — it never
 * reveals the upstream vendor. `upstreamId` is the NVIDIA NIM model id and is the
 * ONLY place these strings are written (plus the `NVIDIA_MODELS` env override).
 */
export interface RegistryModel {
  /** internal role id, e.g. "slime-reasoning" */
  id: string;
  /** NVIDIA NIM model id, e.g. "openai/gpt-oss-120b" */
  upstreamId: string;
  contextWindow: number;
  streaming: boolean;
  /** task categories this model is preferred for */
  strengths: TaskCategory[];
  /** lower = more reliable / preferred as a generic fallback */
  order: number;
  /** set only for models that can produce images (none of the defaults can) */
  image?: boolean;
  /**
   * Full invoke URL for an image-capable model, only used when `image` is
   * true. NVIDIA hosts most image-generation NIMs (Stability, FLUX, etc.) at
   * their own per-model function URL — e.g.
   * `https://ai.api.nvidia.com/v1/genai/<org>/<model>` — NOT the shared
   * `{baseUrl}/chat/completions` route the text models use. Omit only if the
   * model genuinely speaks the OpenAI `POST {baseUrl}/images/generations`
   * dialect; `streamNvidiaImage` (`src/lib/ai/server/image.ts`) falls back to
   * that guess, but it is unverified and should be treated as a last resort.
   */
  endpoint?: string;
  /**
   * Set only for models that can read an *attached* image and answer
   * questions about it (image-in, text-out) — distinct from `image`
   * (text-in, image-out generation). Vision models are never selected by
   * ordinary text-category routing (see `planModels`'s filter); `routeChat`
   * forks to one explicitly when the newest user message carries an image
   * attachment.
   */
  vision?: boolean;
}

/**
 * Default NVIDIA free-endpoint model set (base_url https://integrate.api.nvidia.com/v1).
 * All ids verified against `GET /v1/models`. These are the real models Slime AI
 * chats with when `NVIDIA_API_KEY` is set; the built-in mock only runs when it
 * is not. Override the whole list with `NVIDIA_MODELS` (JSON array of
 * `{ id, upstreamId, contextWindow?, strengths?, order?, image?, endpoint? }`).
 *
 * --- Image generation audit (see nvidia_free_model_ids.txt) ---------------
 * The free-endpoint roster (39 models, all categories) was checked model by
 * model for a genuine text-to-image generator. It has none:
 *   - general-purpose chat/reasoning (deepseek-v4-*, nemotron-3-*, gpt-oss-*,
 *     gemma-4-31b-it, kimi-k3, minimax-m3, laguna-xs-2.1, mistral-nemotron) —
 *     text in, text out.
 *   - "vision/multimodal" entries (llama-3.2-*-vision-instruct, paligemma,
 *     ising-calibration-*, cosmos3-nano-reasoner) — image *understanding*
 *     (image in, text out), not generation.
 *   - translation/speech/TTS, embeddings, and safety/guardrail entries — none
 *     produce images.
 *   - "video/physical AI" entries (cosmos3-nano, cosmos-transfer*,
 *     synthetic-video-detector, active-speaker-detection, streampetr,
 *     sparsedrive, bevformer, bnr, diffusiongemma-26b-a4b-it) are world-model
 *     / perception / synthetic-data nets for structured video pipelines, not
 *     a prompt-in/image-out endpoint accessible the way chat models are.
 * So no entry below sets `image: true`, and none should be added on this
 * list's say-so — that would be inventing a capability. When a real NVIDIA
 * image-generation NIM (e.g. an SDXL/FLUX free endpoint) becomes available,
 * add it here with `image: true` and its real `endpoint` from NVIDIA's docs;
 * nothing else in the app needs to change (see `routeChat`'s image branch).
 */
export const DEFAULT_NVIDIA_MODELS: RegistryModel[] = [
  {
    // NVIDIA's own flagship MoE — strong, efficient default for everyday work.
    id: "slime-general",
    upstreamId: "nvidia/nemotron-3-super-120b-a12b",
    contextWindow: 128_000,
    streaming: true,
    strengths: ["general", "search", "coding", "structured", "long_context"],
    order: 1,
  },
  {
    // Open GPT model — well-rounded generalist, second choice everywhere.
    id: "slime-versatile",
    upstreamId: "openai/gpt-oss-120b",
    contextWindow: 128_000,
    streaming: true,
    strengths: ["general", "search", "coding", "structured", "research"],
    order: 2,
  },
  {
    // Dedicated reasoning model for analysis, research and long context.
    id: "slime-reasoning",
    upstreamId: "deepseek-ai/deepseek-v4-pro-0813",
    contextWindow: 128_000,
    streaming: true,
    strengths: ["reasoning", "research", "long_context"],
    order: 3,
  },
  {
    // Lightning MoE — fastest responses for short tasks and quick iteration.
    id: "slime-fast",
    upstreamId: "nvidia/nemotron-3.5-lightning-30b-a3b",
    contextWindow: 128_000,
    streaming: true,
    strengths: ["general", "search", "coding"],
    order: 2,
  },
  {
    // Image *understanding* (image-in, text-out) — answers questions about an
    // attached image. Never picked by ordinary text routing (empty
    // strengths + excluded in planModels); routeChat forks to it explicitly
    // when the newest user message has an image attachment.
    id: "slime-vision",
    upstreamId: "meta/llama-3.2-11b-vision-instruct",
    contextWindow: 8_000,
    streaming: true,
    strengths: [],
    order: 99,
    vision: true,
  },
];
