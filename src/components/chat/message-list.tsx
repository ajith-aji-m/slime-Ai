"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { Conversation } from "@/types/chat";
import { formatDayLabel } from "@/lib/utils/format";
import { useConversationStore } from "@/stores/conversation-store";
import { buildThreadItems, MessageRow } from "./message-row";

/** Above this many messages the thread switches to windowed rendering. */
const VIRTUALIZE_THRESHOLD = 40;

export function MessageList({
  conversation,
  scrollRef,
}: {
  conversation: Conversation;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { regenerate, editUserMessage } = useConversationStore.getState();

  const items = useMemo(() => {
    const dayLabels = conversation.messages.map((m) =>
      formatDayLabel(m.createdAt),
    );
    return buildThreadItems(conversation.messages, dayLabels);
  }, [conversation.messages]);

  const onRegenerate = () => regenerate(conversation.id);
  const onEdit = (messageId: string, text: string) =>
    editUserMessage(conversation.id, messageId, text);

  const streaming = useConversationStore((s) =>
    s.streamingIds.has(conversation.id),
  );
  const statusLabel = useConversationStore(
    (s) => s.streamStatus[conversation.id],
  );
  const lastPartsLength =
    conversation.messages[conversation.messages.length - 1]?.parts.length ?? 0;

  const shared = {
    items,
    scrollRef,
    streaming,
    statusLabel,
    signature: `${items.length}:${lastPartsLength}`,
    onRegenerate,
    onEdit,
  };

  if (items.length <= VIRTUALIZE_THRESHOLD) {
    return <PlainThread {...shared} />;
  }
  return <VirtualThread {...shared} />;
}

interface ThreadProps {
  items: ReturnType<typeof buildThreadItems>;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  streaming: boolean;
  statusLabel?: string;
  signature: string;
  onRegenerate: () => void;
  onEdit: (messageId: string, text: string) => void;
}

function useStickToBottom(
  scrollRef: React.RefObject<HTMLDivElement | null>,
  signature: string,
  scrollToEnd: () => void,
) {
  const pinnedRef = useRef(true);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      pinnedRef.current =
        el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [scrollRef]);

  useEffect(() => {
    if (!pinnedRef.current) return;
    // Defer: TanStack Virtual's scrollToIndex uses flushSync, which throws if
    // called synchronously during commit.
    const raf = requestAnimationFrame(() => scrollToEnd());
    return () => cancelAnimationFrame(raf);
  }, [signature, scrollToEnd]);
}

function PlainThread({
  items,
  scrollRef,
  streaming,
  statusLabel,
  signature,
  onRegenerate,
  onEdit,
}: ThreadProps) {
  const scrollToEnd = useCallback(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [scrollRef]);
  useStickToBottom(scrollRef, signature, scrollToEnd);

  return (
    <div
      className="py-8"
      role="log"
      aria-label="Conversation"
      aria-live={streaming ? "polite" : "off"}
    >
      {items.map((item) => (
        <MessageRow
          key={item.id}
          item={item}
          onRegenerate={onRegenerate}
          onEdit={onEdit}
          statusLabel={statusLabel}
        />
      ))}
    </div>
  );
}

function VirtualThread({
  items,
  scrollRef,
  streaming,
  statusLabel,
  signature,
  onRegenerate,
  onEdit,
}: ThreadProps) {
  // React Compiler can't memoize around useVirtualizer (returns fresh functions
  // each render by design). This component opts out of compilation; that's fine
  // — it re-renders on scroll anyway.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 180,
    overscan: 8,
    getItemKey: (index) => items[index].id,
    // Avoids react-dom flushSync-during-render warnings; a 1-frame scroll lag
    // in a long thread is imperceptible.
    useFlushSync: false,
  });

  const count = items.length;
  const scrollToEnd = useCallback(() => {
    virtualizer.scrollToIndex(count - 1, { align: "end" });
  }, [virtualizer, count]);
  useStickToBottom(scrollRef, signature, scrollToEnd);

  return (
    <div
      className="relative py-8"
      style={{ height: virtualizer.getTotalSize() }}
      role="log"
      aria-label="Conversation"
      aria-live={streaming ? "polite" : "off"}
    >
      {virtualizer.getVirtualItems().map((row) => (
        <div
          key={row.key}
          data-index={row.index}
          ref={virtualizer.measureElement}
          className="absolute left-0 top-0 w-full"
          style={{ transform: `translateY(${row.start}px)` }}
        >
          <MessageRow
            item={items[row.index]}
            onRegenerate={onRegenerate}
            onEdit={onEdit}
            statusLabel={statusLabel}
          />
        </div>
      ))}
    </div>
  );
}
