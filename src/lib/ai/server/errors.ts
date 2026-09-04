import "server-only";

export type ErrorCategory = "recoverable" | "permanent";

/**
 * Error codes that must NOT be retried — the request itself is wrong or the
 * caller is not allowed. Retrying wastes API calls and can't succeed.
 */
const PERMANENT_CODES = new Set([
  "http_400", // malformed request / invalid parameters
  "http_401", // invalid / missing API key
  "http_403", // unauthorized
  "http_405", // method / operation not supported
  "http_422", // invalid parameters
  "http_501", // not implemented / unsupported
  "not_configured",
  "no_models",
  "no_image_model", // no NVIDIA model in the registry is marked image-capable
]);

/**
 * Everything else is treated as recoverable and triggers a fallback:
 * http_404 (model unavailable), http_408 (timeout), http_409, http_425,
 * http_429 (rate limit), http_5xx (temporary upstream failure),
 * "network", "stream", "empty", "timeout", or an unknown code.
 */
export function categorizeError(code?: string): ErrorCategory {
  if (!code) return "recoverable";
  if (PERMANENT_CODES.has(code)) return "permanent";
  return "recoverable";
}

/** User-facing message for a permanent failure — no model/provider details. */
export function permanentUserMessage(code?: string): string {
  switch (code) {
    case "http_401":
    case "http_403":
      return "Slime AI isn't set up correctly on the server. Please contact the administrator.";
    case "http_400":
    case "http_422":
      return "Slime AI couldn't process that request. Try rephrasing your message.";
    case "not_configured":
      return "Slime AI is not configured on the server yet.";
    case "no_models":
      return "Slime AI has no models available right now.";
    case "no_image_model":
      return "No suitable NVIDIA image-generation model is configured.";
    default:
      return "Slime AI couldn't complete that request.";
  }
}

/** User-facing message when every attempt failed with recoverable errors. */
export function exhaustedUserMessage(): string {
  return "Slime AI is having trouble right now. Please try again in a moment.";
}

/** User-facing message for a failure after partial output was already streamed. */
export function interruptedUserMessage(): string {
  return "The response was interrupted. Use retry to continue.";
}
