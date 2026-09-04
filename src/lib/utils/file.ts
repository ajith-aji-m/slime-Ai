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
