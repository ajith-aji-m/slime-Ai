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

  // Only the internal router's transient status ("Optimizing response…") gets a
  // line here; ordinary streaming is already signalled by the Stop button and
  // the in-thread indicator, so the composer stays quiet.
  const statusLabel = routerStatus ?? null;

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
        className="rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-sm transition-[border-color,box-shadow] duration-150 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/10"
      >
        <div className="flex items-end gap-1 p-2">
          <IconButton icon="attach_file" label="Attach file" className="shrink-0" />
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
            className="max-h-52 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-[15px] text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none"
          />
          {streaming ? (
            <button
              type="button"
              aria-label="Stop generating"
              onClick={() => conversationId && stopStreaming(conversationId)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary transition-colors hover:bg-primary/90"
            >
              <Icon name="stop" size={18} filled />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!value.trim()}
              aria-label="Send message"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary transition-colors hover:bg-primary/90 disabled:bg-surface-container-high disabled:text-on-surface-variant/60"
            >
              <Icon name="arrow_upward" size={18} />
            </button>
          )}
        </div>

        {showToolStrip ? (
          <div className="flex items-center justify-between gap-3 border-t border-outline-variant px-3 py-2">
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

      {statusLabel ? (
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
      ) : !showToolStrip ? (
        <p className="mt-2 text-center text-[11px] text-on-surface-variant/70">
          {site.disclaimer}
        </p>
      ) : null}
    </div>
  );
}
