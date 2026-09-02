"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Icon, IconButton } from "@/components/ui";
import { ToolStrip } from "./tool-strip";
import { useAutoResize } from "@/hooks/use-auto-resize";
import { site } from "@/config/site";
import type { ToolId } from "@/types/chat";
import { useConversationStore } from "@/stores/conversation-store";
import { useComposerStore } from "@/stores/composer-store";

export interface ComposerProps {
  conversationId?: string;
  /** hero = welcome screen (floating), docked = bottom of a conversation */
  variant?: "hero" | "docked";
  autoFocus?: boolean;
  /** prefill (e.g. from a suggestion card) */
  initialValue?: string;
}

export function Composer({
  conversationId,
  variant = "docked",
  autoFocus = false,
  initialValue = "",
}: ComposerProps) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const textareaRef = useAutoResize(value);

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

  function handleToolToggle(id: ToolId) {
    if (conversationId) toggleTool(conversationId, id);
    else toggleDefaultTool(id);
  }

  async function submit() {
    const text = value.trim();
    if (!text || streaming) return;
    setValue("");

    if (conversationId) {
      await sendMessage(conversationId, text, { tools: activeTools });
      return;
    }

    const id = createConversation({ tools: defaultTools });
    router.push(`/chat/${id}`);
    await sendMessage(id, text, { tools: defaultTools });
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  }

  const statusLabel = routerStatus ?? (streaming ? "Slime AI is working…" : "Slime AI");

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-thread",
        variant === "docked" && "px-4 pb-4 md:px-0",
      )}
    >
      <div className="mb-3">
        <ToolStrip active={activeTools} onToggle={handleToolToggle} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="glass-panel flex items-end gap-1 rounded-2xl bg-surface-container-lowest/90 p-2 shadow-ambient focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25"
      >
        <IconButton icon="attach_file" label="Attach file" />
        <IconButton
          icon="mic"
          label="Voice input — coming soon"
          className="sm:hidden"
          disabled
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
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={`Message ${site.shortName}…`}
          className="min-h-[44px] flex-1 resize-none bg-transparent px-2 py-2.5 text-base text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none"
        />
        {streaming ? (
          <IconButton
            icon="stop"
            label="Stop generating"
            filled
            className="bg-primary text-on-primary hover:bg-primary/90 hover:text-on-primary"
            onClick={() => conversationId && stopStreaming(conversationId)}
          />
        ) : (
          <button
            type="submit"
            disabled={!value.trim()}
            aria-label="Send message"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-40"
          >
            <Icon name="arrow_upward" size={20} />
          </button>
        )}
      </form>

      <div className="mt-2 flex flex-col gap-1 px-1 sm:flex-row sm:items-center sm:justify-between">
        <span
          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-on-surface-variant"
          aria-live="polite"
        >
          <Icon
            name="auto_awesome"
            size={13}
            className={streaming ? "animate-pulse text-primary" : "text-primary"}
          />
          {statusLabel}
        </span>
        <p className="text-[11px] text-on-surface-variant/70">{site.disclaimer}</p>
      </div>
    </div>
  );
}
