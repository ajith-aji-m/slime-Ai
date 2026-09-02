import "server-only";
import type { ChatRequest, StreamChunk } from "@/types/provider";
import type { RegistryModel } from "@/config/models";
import {
  CATEGORY_ROUTING,
  CHARS_PER_TOKEN,
  maxAttempts,
  type TaskCategory,
} from "@/config/ai-router";
import { classifyTask, estimateInputChars } from "./classify";
import {
  categorizeError,
  exhaustedUserMessage,
  interruptedUserMessage,
  permanentUserMessage,
} from "./errors";
import { routerLog } from "./logger";
import { isNvidiaConfigured, nvidiaRegistry, streamNvidiaModel } from "./nvidia";

/**
 * Build the ordered list of models to try for a task, given the input size.
 * Preferred roles first, then any other configured model as a last resort.
 */
function planModels(
  category: TaskCategory,
  inputChars: number,
): RegistryModel[] {
  const registry = nvidiaRegistry();
  const byId = new Map(registry.map((m) => [m.id, m]));

  const preferredIds = CATEGORY_ROUTING[category] ?? [];
  const ordered: RegistryModel[] = [];
  for (const id of preferredIds) {
    const model = byId.get(id);
    if (model && !ordered.includes(model)) ordered.push(model);
  }
  for (const model of [...registry].sort((a, b) => a.order - b.order)) {
    if (!ordered.includes(model)) ordered.push(model);
  }

  // Prefer models whose context window fits the input; keep the rest as backups.
  const needTokens = Math.ceil(inputChars / CHARS_PER_TOKEN) + 1500;
  const fitting = ordered.filter((m) => m.contextWindow >= needTokens);
  const plan = fitting.length > 0 ? fitting : ordered;

  return plan.slice(0, Math.max(maxAttempts(), 1));
}

/**
 * Internal AI Router. Classifies the task, picks an NVIDIA model, streams it,
 * and on a *recoverable* pre-content failure transparently falls back to the
 * next suitable model — capped at `maxAttempts()`. Permanent errors and
 * mid-stream failures stop immediately with a user-friendly message.
 *
 * Emits the same normalised `StreamChunk` protocol as the mock provider, plus
 * transient `{ type: "status" }` chunks the UI shows as "Optimizing response…".
 */
export async function* routeChat(
  request: ChatRequest,
): AsyncGenerator<StreamChunk> {
  if (!isNvidiaConfigured()) {
    yield {
      type: "error",
      message: permanentUserMessage("not_configured"),
      code: "not_configured",
    };
    return;
  }

  const category = request.taskHint ?? classifyTask(request.messages, request.tools);
  const inputChars = estimateInputChars(request.messages);
  const plan = planModels(category, inputChars);

  if (plan.length === 0) {
    yield {
      type: "error",
      message: permanentUserMessage("no_models"),
      code: "no_models",
    };
    return;
  }

  routerLog({
    event: "request",
    category,
    attempts: plan.length,
  });

  const startedAt = Date.now();
  let textOpen = false;
  let pendingUsage: Extract<StreamChunk, { type: "usage" }>["usage"] | undefined;
  let attempt = 0;
  let previousRole: string | undefined;
  let previousReason: string | undefined;

  for (const model of plan) {
    attempt += 1;
    const attemptStart = Date.now();

    if (attempt > 1) {
      yield { type: "status", label: "Optimizing response…" };
      routerLog({
        event: "fallback",
        category,
        fromRole: previousRole,
        toRole: model.id,
        reason: previousReason,
        errorCategory: "recoverable",
        attempt,
      });
    } else {
      routerLog({ event: "attempt", category, role: model.id, attempt });
    }

    let modelError: Extract<StreamChunk, { type: "error" }> | undefined;
    let modelContent = false;
    pendingUsage = undefined;

    try {
      for await (const chunk of streamNvidiaModel({
        upstreamId: model.upstreamId,
        messages: request.messages,
        signal: request.signal,
      })) {
        if (chunk.type === "text-delta") {
          if (!textOpen) {
            textOpen = true;
            yield { type: "part-start", part: { type: "text", text: "" } };
          }
          modelContent = true;
          yield chunk;
        } else if (chunk.type === "usage") {
          pendingUsage = chunk.usage;
        } else if (chunk.type === "error") {
          modelError = chunk;
          break;
        }
        // part-start / part-end / done / status from the sub-stream are dropped;
        // the router emits its own.
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        if (textOpen) yield { type: "part-end" };
        return;
      }
      modelError = {
        type: "error",
        message: "stream error",
        code: "stream",
      };
    }

    if (!modelError) {
      if (textOpen) yield { type: "part-end" };
      if (pendingUsage) yield { type: "usage", usage: pendingUsage };
      routerLog({
        event: "success",
        category,
        role: model.id,
        attempt,
        attempts: attempt,
        durationMs: Date.now() - startedAt,
      });
      yield {
        type: "done",
        meta: { finalRole: model.id, category, attempts: attempt },
      };
      return;
    }

    const errorCategory = categorizeError(modelError.code);

    if (errorCategory === "permanent") {
      routerLog({
        event: "permanent_error",
        category,
        role: model.id,
        reason: modelError.code,
        errorCategory,
        durationMs: Date.now() - attemptStart,
      });
      if (textOpen) yield { type: "part-end" };
      yield {
        type: "error",
        message: permanentUserMessage(modelError.code),
        code: modelError.code,
        recoverable: false,
      };
      return;
    }

    // recoverable
    if (modelContent) {
      // Already streamed part of a response from this model — switching now would
      // risk an incoherent / duplicated message. Preserve the partial output and
      // surface a retry state instead.
      routerLog({
        event: "midstream_fail",
        category,
        role: model.id,
        reason: modelError.code,
        errorCategory,
        durationMs: Date.now() - attemptStart,
      });
      if (textOpen) yield { type: "part-end" };
      yield {
        type: "error",
        message: interruptedUserMessage(),
        code: "interrupted",
        recoverable: true,
      };
      return;
    }

    // recoverable, nothing streamed yet → try the next model
    previousRole = model.id;
    previousReason = modelError.code;
  }

  routerLog({
    event: "exhausted",
    category,
    attempts: attempt,
    durationMs: Date.now() - startedAt,
  });
  if (textOpen) yield { type: "part-end" };
  yield {
    type: "error",
    message: exhaustedUserMessage(),
    code: "exhausted",
    recoverable: true,
  };
}
