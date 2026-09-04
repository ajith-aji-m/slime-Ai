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
}

/**
 * Default NVIDIA free-endpoint model set (base_url https://integrate.api.nvidia.com/v1).
 * All ids verified against `GET /v1/models`. These are the real models Slime AI
 * chats with when `NVIDIA_API_KEY` is set; the built-in mock only runs when it
 * is not. Override the whole list with `NVIDIA_MODELS` (JSON array of
 * `{ id, upstreamId, contextWindow?, strengths?, order? }`).
 */
export const DEFAULT_NVIDIA_MODELS: RegistryModel[] = [
  {
    // NVIDIA's own flagship MoE — strong, efficient default for everyday work.
    id: "slime-general",
    upstreamId: "nvidia/nemotron-3-super-120b-a12b",
    contextWindow: 128_000,
    streaming: true,
    strengths: ["general", "coding", "structured", "long_context"],
    order: 1,
  },
  {
    // Open GPT model — well-rounded generalist, second choice everywhere.
    id: "slime-versatile",
    upstreamId: "openai/gpt-oss-120b",
    contextWindow: 128_000,
    streaming: true,
    strengths: ["general", "coding", "structured", "research"],
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
    strengths: ["general", "coding"],
    order: 2,
  },
];
