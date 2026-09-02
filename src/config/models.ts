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
  /** NVIDIA NIM model id, e.g. "deepseek-ai/deepseek-v4-pro-0813" */
  upstreamId: string;
  contextWindow: number;
  streaming: boolean;
  /** task categories this model is preferred for */
  strengths: TaskCategory[];
  /** lower = more reliable / preferred as a generic fallback */
  order: number;
}

/**
 * Default NVIDIA model set. Verified against
 * `GET https://integrate.api.nvidia.com/v1/models`. Override the whole list with
 * `NVIDIA_MODELS` (JSON array of `{ id, upstreamId, contextWindow?, strengths?, order? }`).
 */
export const DEFAULT_NVIDIA_MODELS: RegistryModel[] = [
  {
    id: "slime-general",
    upstreamId: "nvidia/llama-3.1-nemotron-70b-instruct",
    contextWindow: 128_000,
    streaming: true,
    strengths: ["general", "coding", "structured"],
    order: 1,
  },
  {
    id: "slime-versatile",
    upstreamId: "mistralai/mistral-large-2-instruct",
    contextWindow: 128_000,
    streaming: true,
    strengths: ["general", "coding", "structured", "long_context"],
    order: 2,
  },
  {
    id: "slime-reasoning",
    upstreamId: "deepseek-ai/deepseek-v4-pro-0813",
    contextWindow: 128_000,
    streaming: true,
    strengths: ["reasoning", "research", "long_context"],
    order: 3,
  },
  {
    id: "slime-fast",
    upstreamId: "nvidia/nemotron-3.5-lightning-30b-a3b",
    contextWindow: 128_000,
    streaming: true,
    strengths: ["general"],
    order: 2,
  },
];
