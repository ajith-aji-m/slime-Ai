import type { Message, MessagePart, ToolId } from "./chat";

/** A single model exposed by a provider. */
export interface ModelInfo {
  id: string;
  /** provider id that owns this model */
  providerId: string;
  name: string;
  description: string;
  /** short badge, e.g. "Fast", "Reasoning", "Vision" */
  badges: string[];
  contextWindow: number;
  capabilities: ToolId[];
  /** false until a real API key / integration is wired */
  available: boolean;
  tier: "free" | "pro";
}

export interface ProviderInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  /** e.g. "OpenAI-compatible", "NVIDIA NIM" */
  kind: string;
  status: "connected" | "available" | "coming-soon";
}

/** Streaming chunk emitted by a provider while producing a response. */
export type StreamChunk =
  | { type: "part-start"; part: MessagePart }
  | { type: "text-delta"; text: string }
  | { type: "part-end" }
  | { type: "error"; message: string }
  | { type: "done" };

export interface ChatRequest {
  messages: Message[];
  modelId: string;
  tools: ToolId[];
  signal?: AbortSignal;
}

/**
 * The one interface every backend implements. `MockChatProvider` fulfils it today;
 * an `NvidiaProvider`, `OpenAiCompatibleProvider`, etc. drop in later unchanged.
 */
export interface ChatProvider {
  readonly info: ProviderInfo;
  readonly models: ModelInfo[];
  streamChat(request: ChatRequest): AsyncIterable<StreamChunk>;
}
