"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Icon, IconButton } from "@/components/ui";
import { ToolStrip } from "./tool-strip";
import { AttachmentChip } from "./attachment-chip";
import { useAutoResize } from "@/hooks/use-auto-resize";
import { site } from "@/config/site";
import { activeModeTool, toolsById } from "@/config/tools";
import { AttachmentTooLargeError, fileToAttachment } from "@/lib/utils/file";
import type { Attachment, ToolId } from "@/types/chat";
import { useConversationStore } from "@/stores/conversation-store";
import { useComposerStore } from "@/stores/composer-store";
import { useAiStatusStore } from "@/stores/ai-status-store";
import { useMascotStore } from "@/stores/mascot-store";
import { useNetworkStore } from "@/stores/network-store";

export interface ComposerProps {
  conversationId?: string;
  /** hero = welcome screen (floating), docked = bottom of a conversation */
  variant?: "hero" | "docked";
  autoFocus?: boolean;
  /** prefill (e.g. from a suggestion card) */
  initialValue?: string;
  /** hide the in-composer tool row (welcome screen shows Quick actions instead) */
  showToolStrip?: boolean;
}

export function Composer({
  conversationId,
  variant = "docked",
  autoFocus = false,
  initialValue = "",
  showToolStrip = true,
}: ComposerProps) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const textareaRef = useAutoResize(value);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const setTyping = useMascotStore((s) => s.setTyping);
  const notifySent = useMascotStore((s) => s.notifySent);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function noteTyping(text: string) {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (!text.trim()) {
      setTyping(false);
      return;
    }
    setTyping(true);
    // glance back up once the user pauses, so it doesn't stare down forever
    typingTimeoutRef.current = setTimeout(() => setTyping(false), 1200);
  }

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setTyping(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const conversation = useConversationStore((s) =>
    conversationId ? s.conversations[conversationId] : undefined,
  );
  const streaming = useConversationStore((s) =>
    conversationId ? s.streamingIds.has(conversationId) : false,
  );
  const routerStatus = useConversationStore((s) =>
    conversationId ? s.streamStatus[conversationId] : undefined,
  );
  const { createConversation, sendMessage, stopStreaming, toggleTool } =
    useConversationStore.getState();

  const defaultTools = useComposerStore((s) => s.defaultTools);
  const toggleDefaultTool = useComposerStore((s) => s.toggleDefaultTool);

  const activeTools = conversation?.tools ?? defaultTools;
  const imageGenReady = useAiStatusStore((s) => s.imageGeneration);
  const imageGenBlocked = activeTools.includes("image_gen") && !imageGenReady;
  const webSearchReady = useAiStatusStore((s) => s.webSearch);
  const webSearchLimited = activeTools.includes("web_search") && !webSearchReady;

  function handleToolToggle(id: ToolId) {
    if (conversationId) toggleTool(conversationId, id);
    else toggleDefaultTool(id);
  }

  async function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setAttachmentError(null);
    const files = Array.from(fileList);
    for (const file of files) {
      try {
        const attachment = await fileToAttachment(file);
        setAttachments((prev) => [...prev, attachment]);
      } catch (err) {
        setAttachmentError(
          err instanceof AttachmentTooLargeError
            ? err.message
            : `Couldn't read "${file.name}".`,
        );
      }
    }
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }

  const online = useNetworkStore((s) => s.online);

  async function submit() {
    const text = value.trim();
    if ((!text && attachments.length === 0) || streaming || !online) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setTyping(false);
    notifySent();
    setValue("");
    const sentAttachments = attachments;
    setAttachments([]);
    setAttachmentError(null);

    if (conversationId) {
      await sendMessage(conversationId, text, {
        tools: activeTools,
        attachments: sentAttachments.length ? sentAttachments : undefined,
      });
      return;
    }

    const id = createConversation({ tools: defaultTools });
    router.push(`/chat/${id}`);
    await sendMessage(id, text, {
      tools: defaultTools,
      attachments: sentAttachments.length ? sentAttachments : undefined,
    });
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  }

  // Only the internal router's transient status ("Optimizing response…") gets a
  // line here; ordinary streaming is already signalled by the Stop button and
  // the in-thread indicator, so the composer stays quiet.
  const statusLabel = routerStatus ?? null;

  const activeMode = activeModeTool(activeTools);
  const placeholder =
    (activeMode && toolsById[activeMode]?.placeholder) ||
    `Message ${site.shortName}…`;

  return (
    <div
      className={cn(
        "mx-auto w-full",
        variant === "docked" ? "max-w-thread px-4 pb-4 md:px-0" : "max-w-3xl",
      )}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="liquid-glass rounded-3xl p-1.5 transition-[border-color,box-shadow] duration-[480ms] ease-[var(--ease-emphasized)] focus-within:border-[var(--sl-mode-ring)] focus-within:shadow-[0_0_28px_-4px_var(--sl-mode-glow)]"
      >
        {attachments.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 px-3 pt-2">
            {attachments.map((attachment) => (
              <AttachmentChip
                key={attachment.id}
                attachment={attachment}
                onRemove={() => removeAttachment(attachment.id)}
              />
            ))}
          </div>
        ) : null}

        <div className="flex items-end gap-1.5 px-2 py-1.5">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="sr-only"
            onChange={(e) => {
              void handleFilesSelected(e.target.files);
              e.target.value = "";
            }}
          />
          <IconButton
            icon="attach_file"
            label="Attach file"
            className="shrink-0 -rotate-45"
            onClick={() => fileInputRef.current?.click()}
          />
          <label htmlFor="composer-input" className="sr-only">
            Message {site.shortName}
          </label>
          <textarea
            id="composer-input"
            ref={textareaRef}
            rows={1}
            autoFocus={autoFocus}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              noteTyping(e.target.value);
            }}
            onKeyDown={onKeyDown}
            onBlur={() => {
              if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
              setTyping(false);
            }}
            placeholder={placeholder}
            className="max-h-52 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-[15px] text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none"
          />
          {streaming ? (
            <button
              type="button"
              aria-label="Stop generating"
              onClick={() => conversationId && stopStreaming(conversationId)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--sl-primary)_45%,transparent)] bg-[color-mix(in_srgb,var(--sl-primary)_22%,transparent)] text-primary transition-[background-color,border-color,color,filter] duration-[480ms] ease-[var(--ease-emphasized)] hover:brightness-125 active:scale-90 active:transition-transform active:duration-100"
            >
              <Icon name="stop" size={18} filled />
            </button>
          ) : (
            <button
              type="submit"
              disabled={(!value.trim() && attachments.length === 0) || !online}
              aria-label="Send message"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--sl-primary)_45%,transparent)] bg-[color-mix(in_srgb,var(--sl-primary)_22%,transparent)] text-primary transition-[background-color,border-color,color,filter] duration-[480ms] ease-[var(--ease-emphasized)] hover:brightness-110 active:scale-90 active:transition-transform active:duration-100 disabled:border-glass-line disabled:bg-glass-fill disabled:text-on-surface-variant/50"
            >
              <Icon name="arrow_upward" size={18} />
            </button>
          )}
        </div>

        {showToolStrip ? (
          <div className="flex items-center justify-between gap-3 border-t border-glass-line px-3 py-2">
            <ToolStrip
              active={activeTools}
              onToggle={handleToolToggle}
              align="start"
            />
            <p className="hidden shrink-0 text-[11px] text-on-surface-variant/70 sm:block">
              {site.disclaimer}
            </p>
          </div>
        ) : null}
      </form>

      {attachmentError ? (
        <p
          className="mt-2 flex items-center justify-center gap-1.5 text-[11px] font-medium text-error"
          aria-live="polite"
        >
          <Icon name="close" size={13} />
          {attachmentError}
        </p>
      ) : statusLabel ? (
        <p
          className="mt-2 flex items-center justify-center gap-1.5 text-[11px] font-medium text-on-surface-variant"
          aria-live="polite"
        >
          <Icon
            name="auto_awesome"
            size={13}
            className="animate-pulse text-primary"
          />
          {statusLabel}
        </p>
      ) : imageGenBlocked ? (
        <p
          className="mt-2 flex items-center justify-center gap-1.5 text-[11px] font-medium text-on-surface-variant"
          aria-live="polite"
        >
          <Icon name="image" size={13} className="text-on-surface-variant/70" />
          No NVIDIA image-generation model is configured yet.
        </p>
      ) : webSearchLimited ? (
        <p
          className="mt-2 flex items-center justify-center gap-1.5 text-[11px] font-medium text-on-surface-variant"
          aria-live="polite"
        >
          <Icon name="search" size={13} className="text-on-surface-variant/70" />
          Live web search isn&apos;t configured yet — answers use the model&apos;s own knowledge.
        </p>
      ) : !showToolStrip ? (
        <p className="mt-2 text-center text-[11px] text-on-surface-variant/70">
          {site.disclaimer}
        </p>
      ) : null}
    </div>
  );
}
