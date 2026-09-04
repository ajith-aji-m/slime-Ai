import type { Attachment } from "@/types/chat";
import { createId } from "./id";

/**
 * Local-first attachment cap. Attachments are stored as data URLs inside the
 * conversation record (see `Attachment.url`), which lives in IndexedDB
 * alongside the rest of the conversation — so this is a sanity limit on
 * IndexedDB record size, not a network upload limit (there's no server
 * upload path; nothing here is sent anywhere until a real AI provider that
 * accepts files is wired up).
 */
export const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024; // 8 MB

/**
 * Separate, tighter cap on images actually sent to a vision model (see
 * `stripAttachmentData` in the conversation store): base64-encodes to ~1.33x,
 * and the whole conversation history rides in one request body, so this
 * keeps a single image request comfortably under typical serverless request
 * body limits. Attachments above this are still stored/shown locally, just
 * not sent for analysis.
 */
export const MAX_VISION_IMAGE_BYTES = 3 * 1024 * 1024; // 3 MB

/**
 * Cap on text-like attachments actually sent for analysis (see
 * `stripAttachmentData`) — their raw content is inlined as a fenced block in
 * the prompt, so this bounds token usage per turn, not just body size.
 */
export const MAX_TEXT_ATTACHMENT_BYTES = 300 * 1024; // 300 KB

const TEXT_MIME_TYPES = new Set([
  "application/json",
  "application/csv",
  "application/xml",
  "application/x-yaml",
  "application/yaml",
]);

export class AttachmentTooLargeError extends Error {
  constructor(public fileName: string) {
    super(`"${fileName}" is larger than 8 MB`);
    this.name = "AttachmentTooLargeError";
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("File read failed"));
    reader.readAsDataURL(file);
  });
}

/** Converts a browser `File` into a storable `Attachment`, inlined as a data URL. */
export async function fileToAttachment(file: File): Promise<Attachment> {
  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new AttachmentTooLargeError(file.name);
  }
  const url = await readAsDataUrl(file);
  return {
    id: createId("att"),
    name: file.name,
    size: file.size,
    mimeType: file.type || "application/octet-stream",
    url,
  };
}

export function isImageAttachment(attachment: Attachment): boolean {
  return attachment.mimeType.startsWith("image/");
}

/** Plain text, CSV, JSON, XML, YAML, Markdown — anything worth inlining as-is for a model to read. */
export function isTextAttachment(attachment: Attachment): boolean {
  return (
    attachment.mimeType.startsWith("text/") ||
    TEXT_MIME_TYPES.has(attachment.mimeType)
  );
}
