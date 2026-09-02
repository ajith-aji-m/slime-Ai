import type { ModelInfo, ProviderInfo } from "@/types/provider";

/**
 * Provider + model catalogue. All models are `available: false` until a real
 * integration is wired — the UI reads this list, the mock engine answers for now.
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
    status: "coming-soon",
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
    status: "available",
  },
];

export const models: ModelInfo[] = [
  {
    id: "slime-core",
    providerId: "slime",
    name: "Slime Core",
    description: "Balanced default for everyday work across the workstation.",
    badges: ["Balanced", "Vision"],
    contextWindow: 128_000,
    capabilities: ["web_search", "code", "image_gen", "research", "file_analysis"],
    available: true,
    tier: "free",
  },
  {
    id: "slime-core-lite",
    providerId: "slime",
    name: "Slime Core Lite",
    description: "Fastest responses for short tasks and quick iteration.",
    badges: ["Fast"],
    contextWindow: 32_000,
    capabilities: ["web_search", "code"],
    available: true,
    tier: "free",
  },
  {
    id: "slime-core-max",
    providerId: "slime",
    name: "Slime Core Max",
    description: "Deep reasoning for research, analysis and long context.",
    badges: ["Reasoning", "Long context"],
    contextWindow: 400_000,
    capabilities: ["web_search", "code", "research", "file_analysis"],
    available: true,
    tier: "pro",
  },
  {
    id: "nvidia/llama-3.3-70b",
    providerId: "nvidia",
    name: "Llama 3.3 70B",
    description: "Open-weight general model hosted on NVIDIA NIM.",
    badges: ["Open weights"],
    contextWindow: 128_000,
    capabilities: ["web_search", "code"],
    available: false,
    tier: "free",
  },
  {
    id: "openai/gpt-4o",
    providerId: "openai",
    name: "GPT-4o",
    description: "OpenAI multimodal model.",
    badges: ["Vision", "Fast"],
    contextWindow: 128_000,
    capabilities: ["web_search", "code", "image_gen"],
    available: false,
    tier: "pro",
  },
];

export const modelsById = Object.fromEntries(
  models.map((m) => [m.id, m]),
) as Record<string, ModelInfo>;

export const DEFAULT_MODEL_ID = "slime-core";
