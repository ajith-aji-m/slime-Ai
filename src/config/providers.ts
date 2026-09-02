import type { ModelInfo, ProviderInfo } from "@/types/provider";

/**
 * Static provider + model catalogue (Provider Registry + Model Registry).
 *
 * This is safe to import on the client — it contains no secrets. Whether a
 * provider is actually usable (API key present) is resolved at runtime by
 * `GET /api/models`; see `src/stores/catalogue-store.ts`.
 */
export const providers: ProviderInfo[] = [
  {
    id: "slime",
    name: "Slime Core",
    description: "Slime AI's built-in model. Runs on mock responses in this build.",
    icon: "psychology",
    kind: "Built-in",
    status: "connected",
  },
  {
    id: "nvidia",
    name: "NVIDIA NIM",
    description: "Open models hosted on NVIDIA inference microservices.",
    icon: "memory",
    kind: "OpenAI-compatible",
    status: "available",
  },
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT models via the OpenAI API.",
    icon: "hub",
    kind: "OpenAI-compatible",
    status: "coming-soon",
  },
  {
    id: "openai-compatible",
    name: "Custom endpoint",
    description: "Any OpenAI-compatible base URL (Groq, Together, local, …).",
    icon: "api",
    kind: "OpenAI-compatible",
    status: "coming-soon",
  },
];

const slimeModel = (
  partial: Omit<ModelInfo, "providerId" | "streaming" | "toolCalling">,
): ModelInfo => ({
  providerId: "slime",
  streaming: true,
  toolCalling: false,
  ...partial,
});

export const models: ModelInfo[] = [
  slimeModel({
    id: "slime-core",
    name: "Slime Core",
    description: "Balanced default for everyday work across the workstation.",
    badges: ["Balanced", "Vision"],
    contextWindow: 128_000,
    capabilities: ["web_search", "code", "image_gen", "research", "file_analysis"],
    available: true,
    tier: "free",
  }),
  slimeModel({
    id: "slime-core-lite",
    name: "Slime Core Lite",
    description: "Fastest responses for short tasks and quick iteration.",
    badges: ["Fast"],
    contextWindow: 32_000,
    capabilities: ["web_search", "code"],
    available: true,
    tier: "free",
  }),
  slimeModel({
    id: "slime-core-max",
    name: "Slime Core Max",
    description: "Deep reasoning for research, analysis and long context.",
    badges: ["Reasoning", "Long context"],
    contextWindow: 400_000,
    capabilities: ["web_search", "code", "research", "file_analysis"],
    available: true,
    tier: "pro",
  }),

  // --- NVIDIA NIM (OpenAI-compatible). `available` is confirmed at runtime. ---
  {
    id: "nvidia/nvidia/llama-3.1-nemotron-70b-instruct",
    upstreamId: "nvidia/llama-3.1-nemotron-70b-instruct",
    providerId: "nvidia",
    name: "Nemotron 70B",
    description: "NVIDIA's RLHF-tuned Llama 3.1 for helpful, aligned responses.",
    badges: ["Aligned", "128K"],
    contextWindow: 128_000,
    capabilities: ["code"],
    streaming: true,
    toolCalling: true,
    available: false,
    tier: "free",
  },
  {
    id: "nvidia/nvidia/nemotron-3.5-lightning-30b-a3b",
    upstreamId: "nvidia/nemotron-3.5-lightning-30b-a3b",
    providerId: "nvidia",
    name: "Nemotron 3.5 Lightning",
    description: "Fast mixture-of-experts model for quick iteration.",
    badges: ["Fast", "MoE"],
    contextWindow: 128_000,
    capabilities: ["code"],
    streaming: true,
    toolCalling: false,
    available: false,
    tier: "free",
  },
  {
    id: "nvidia/deepseek-ai/deepseek-v4-pro-0813",
    upstreamId: "deepseek-ai/deepseek-v4-pro-0813",
    providerId: "nvidia",
    name: "DeepSeek V4 Pro",
    description: "Strong reasoning model for research and analysis.",
    badges: ["Reasoning"],
    contextWindow: 128_000,
    capabilities: ["code", "research"],
    streaming: true,
    toolCalling: false,
    available: false,
    tier: "pro",
  },
  {
    id: "nvidia/mistralai/mistral-large-2-instruct",
    upstreamId: "mistralai/mistral-large-2-instruct",
    providerId: "nvidia",
    name: "Mistral Large 2",
    description: "General-purpose model with strong multilingual support.",
    badges: ["Multilingual", "128K"],
    contextWindow: 128_000,
    capabilities: ["code"],
    streaming: true,
    toolCalling: true,
    available: false,
    tier: "free",
  },
];

export const modelsById = Object.fromEntries(
  models.map((m) => [m.id, m]),
) as Record<string, ModelInfo>;

export const providersById = Object.fromEntries(
  providers.map((p) => [p.id, p]),
) as Record<string, ProviderInfo>;

export const DEFAULT_MODEL_ID = "slime-core";
