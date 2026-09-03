"use client";

import { Icon } from "@/components/ui";
import { useConversationStore } from "@/stores/conversation-store";
import { useAiStatusStore } from "@/stores/ai-status-store";
import type { CanvasArtifact } from "@/types/canvas";

/**
 * Generated-image workspace. When the backend actually supports image
 * generation and returns a URL, the image is shown full-bleed with its details.
 * Otherwise the prompt and status are surfaced honestly — the feature is kept
 * extensible, never faked.
 */
export function ImageCanvas({ artifact }: { artifact: CanvasArtifact }) {
  const supported = useAiStatusStore((s) => s.imageGeneration);
  const regenerate = useConversationStore((s) => s.regenerate);
  const streaming = useConversationStore((s) =>
    s.streamingIds.has(artifact.conversationId),
  );
  const hasImage = Boolean(artifact.imageUrl);

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface-container-lowest">
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-6">
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={artifact.imageUrl}
            alt={artifact.imagePrompt ?? "Generated image"}
            className="max-h-full max-w-full rounded-lg border border-outline-variant object-contain"
          />
        ) : (
          <div className="flex max-w-sm flex-col items-center gap-3 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon name="image" size={26} />
            </span>
            <p className="text-sm font-semibold text-on-surface">
              {supported ? "No image yet" : "Image generation isn’t connected"}
            </p>
            <p className="text-[13px] leading-relaxed text-on-surface-variant">
              {supported
                ? "Run the request again to generate an image for this prompt."
                : "The current Slime AI models don’t generate images. This workspace is ready for an image-capable model when one is added."}
            </p>
          </div>
        )}
      </div>

      <div className="shrink-0 space-y-3 border-t border-outline-variant p-4">
        {artifact.imagePrompt ? (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant/80">
              Prompt
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-on-surface">
              {artifact.imagePrompt}
            </p>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={streaming || !artifact.conversationId}
            onClick={() => regenerate(artifact.conversationId)}
            className="inline-flex items-center gap-1.5 rounded-md border border-outline-variant px-3 py-1.5 text-[13px] font-medium text-on-surface transition-colors hover:bg-surface-variant disabled:opacity-50"
          >
            <Icon name="refresh" size={15} />
            Regenerate
          </button>
        </div>
      </div>
    </div>
  );
}
