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
import { streamNvidiaImage } from "./image";
import { routerLog } from "./logger";
import {
  isNvidiaConfigured,
  nvidiaRegistry,
  streamNvidiaModel,
  streamNvidiaVision,
} from "./nvidia";

/**
 * Build the ordered list of models to try for a task, given the input size.
 * Preferred roles first, then any other configured model as a last resort.
 */
function planModels(
  category: TaskCategory,
  inputChars: number,
): RegistryModel[] {
  // Vision/image-generation models are special-purpose forks (see
  // routeVision/routeImageGeneration below) — never eligible as a generic
  // text-category fallback.
  const registry = nvidiaRegistry().filter((m) => !m.vision && !m.image);
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

function lastUserText(messages: ChatRequest["messages"]): string {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  return (
    lastUser?.parts.map((p) => (p.type === "text" ? p.text : "")).join(" ").trim() ?? ""
  );
}

/** Whether the newest user message carries an image the client kept the data for. */
function hasImageAttachment(messages: ChatRequest["messages"]): boolean {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  return (lastUser?.attachments ?? []).some(
    (a) => !!a.url && a.mimeType.startsWith("image/"),
  );
}

/**
 * Image understanding is a hard fork, same shape as `routeImageGeneration`:
 * when the newest user message has an image attached, only a model the
 * registry marks `vision: true` may answer — never silently falls back to a
 * text model (which would just hallucinate about a photo it can't see).
 */
async function* routeVision(request: ChatRequest): AsyncGenerator<StreamChunk> {
  const visionModels = nvidiaRegistry()
    .filter((m) => m.vision === true)
    .sort((a, b) => a.order - b.order);

  if (visionModels.length === 0) {
    routerLog({ event: "permanent_error", category: "vision", reason: "no_vision_model", errorCategory: "permanent" });
    yield {
      type: "error",
      message: permanentUserMessage("no_vision_model"),
      code: "no_vision_model",
      recoverable: false,
    };
    return;
  }

  const plan = visionModels.slice(0, Math.max(maxAttempts(), 1));
  const startedAt = Date.now();
  let attempt = 0;

  for (const model of plan) {
    attempt += 1;
    if (attempt > 1) {
      yield { type: "status", label: "Optimizing response…" };
      routerLog({ event: "fallback", category: "vision", toRole: model.id, attempt });
    } else {
      routerLog({ event: "attempt", category: "vision", role: model.id, attempt });
    }

    let modelError: Extract<StreamChunk, { type: "error" }> | undefined;
    let modelContent = false;
    let textOpen = false;

    try {
      for await (const chunk of streamNvidiaVision({
        upstreamId: model.upstreamId,
        messages: request.messages,
        signal: request.signal,
      })) {
        if (chunk.type === "text-delta") modelContent = true;
        if (chunk.type === "part-start") textOpen = true;
        if (chunk.type === "part-end") textOpen = false;
        if (chunk.type === "error") {
          modelError = chunk;
          break;
        }
        if (chunk.type === "done") continue;
        yield chunk;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      modelError = { type: "error", message: "stream error", code: "stream" };
    }

    if (!modelError) {
      routerLog({ event: "success", category: "vision", role: model.id, attempt, attempts: attempt, durationMs: Date.now() - startedAt });
      yield { type: "done", meta: { finalRole: model.id, attempts: attempt } };
      return;
    }

    if (modelContent || textOpen) {
      // Partial output already streamed — don't silently retry with another
      // model, that would duplicate/garble what the user already sees.
      yield {
        type: "error",
        message: interruptedUserMessage(),
        code: modelError.code,
        recoverable: false,
      };
      return;
    }

    if (categorizeError(modelError.code) === "permanent") {
      yield {
        type: "error",
        message: permanentUserMessage(modelError.code),
        code: modelError.code,
        recoverable: false,
      };
      return;
    }
    // recoverable — try the next vision-capable model, if any
  }

  routerLog({ event: "exhausted", category: "vision", attempts: attempt, durationMs: Date.now() - startedAt });
  yield { type: "error", message: exhaustedUserMessage(), code: "exhausted", recoverable: true };
}

/**
 * Image Generation is routed separately from every text category: it is only
 * ever allowed to reach a model the registry explicitly marks `image: true`.
 * If none is configured, this reports that plainly instead of silently
 * falling back to a text model. Falls back across image-capable models only.
 */
async function* routeImageGeneration(
  request: ChatRequest,
): AsyncGenerator<StreamChunk> {
  const imageModels = nvidiaRegistry()
    .filter((m) => m.image === true)
    .sort((a, b) => a.order - b.order);

  if (imageModels.length === 0) {
    routerLog({ event: "permanent_error", category: "image", reason: "no_image_model", errorCategory: "permanent" });
    yield {
      type: "error",
      message: permanentUserMessage("no_image_model"),
      code: "no_image_model",
      recoverable: false,
    };
    return;
  }

  const prompt = lastUserText(request.messages);
  const plan = imageModels.slice(0, Math.max(maxAttempts(), 1));
  const startedAt = Date.now();
  let attempt = 0;

  for (const model of plan) {
    attempt += 1;
    if (attempt > 1) {
      yield { type: "status", label: "Optimizing response…" };
      routerLog({ event: "fallback", category: "image", toRole: model.id, attempt });
    } else {
      routerLog({ event: "attempt", category: "image", role: model.id, attempt });
    }

    let modelError: Extract<StreamChunk, { type: "error" }> | undefined;
    try {
      for await (const chunk of streamNvidiaImage({
        upstreamId: model.upstreamId,
        endpoint: model.endpoint,
        prompt,
        signal: request.signal,
      })) {
        if (chunk.type === "error") {
          modelError = chunk;
          break;
        }
        yield chunk;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      modelError = { type: "error", message: "stream error", code: "stream" };
    }

    if (!modelError) {
      routerLog({ event: "success", category: "image", role: model.id, attempt, attempts: attempt, durationMs: Date.now() - startedAt });
      yield { type: "done", meta: { finalRole: model.id, attempts: attempt } };
      return;
    }

    if (categorizeError(modelError.code) === "permanent") {
      yield {
        type: "error",
        message: permanentUserMessage(modelError.code),
        code: modelError.code,
        recoverable: false,
      };
      return;
    }
    // recoverable — try the next image-capable model, if any
  }

  routerLog({ event: "exhausted", category: "image", attempts: attempt, durationMs: Date.now() - startedAt });
  yield { type: "error", message: exhaustedUserMessage(), code: "exhausted", recoverable: true };
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

  // Image Generation is a hard fork: it never shares a code path with the
  // text categories below, so it can never fall back to a text model.
  if (request.tools.includes("image_gen")) {
    yield* routeImageGeneration(request);
    return;
  }

  // Same for image understanding: if the newest message has an image
  // attached, only a vision model may answer — never a text model that would
  // just hallucinate about a photo it can't see.
  if (hasImageAttachment(request.messages)) {
    yield* routeVision(request);
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
