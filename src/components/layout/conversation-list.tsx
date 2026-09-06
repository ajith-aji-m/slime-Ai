"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Icon } from "@/components/ui";
import type { ConversationSummary } from "@/types/chat";
import {
  useConversationStore,
  type ConversationSearchResult,
} from "@/stores/conversation-store";

const COLLAPSED_COUNT = 8;
const SEARCH_DEBOUNCE_MS = 200;

/** Row slides this far to expose the Delete action. */
const REVEAL = 72;
/** Drag past this (px) and releasing deletes outright. */
const COMMIT = 132;

export function ConversationList({ onNavigate }: { onNavigate?: () => void }) {
  const params = useParams<{ conversationId?: string }>();
  const summaries = useConversationStore((s) => s.summaries);
  const hydrated = useConversationStore((s) => s.hydrated);
  const { renameConversation } = useConversationStore.getState();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ConversationSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Collapse an open swipe row whenever the route changes (React's
  // "adjust state during render" pattern — no effect needed).
  const [lastRoute, setLastRoute] = useState(params.conversationId);
  if (lastRoute !== params.conversationId) {
    setLastRoute(params.conversationId);
    if (openId !== null) setOpenId(null);
  }

  const searchActive = query.trim().length > 0;

  function handleQueryChange(next: string) {
    setQuery(next);
    // both branches are synchronous with the keystroke that caused them,
    // not derived inside the debounce effect below
    if (!next.trim()) {
      setResults([]);
      setSearching(false);
    } else {
      setSearching(true);
    }
  }

  // Debounced full-text search (title + message content) across every
  // stored conversation — client-only, matching the local-first storage.
  // Marking "searching" true and clearing stale results both happen in
  // `handleQueryChange` above; this effect only resolves the query.
  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      void useConversationStore
        .getState()
        .searchConversations(q)
        .then((r) => {
          if (!cancelled) {
            setResults(r);
            setSearching(false);
          }
        });
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const visible =
    expanded || summaries.length <= COLLAPSED_COUNT
      ? summaries
      : summaries.slice(0, COLLAPSED_COUNT);
  const hasMore = summaries.length > COLLAPSED_COUNT;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative px-3 pb-1 pt-1">
        <Icon
          name="search"
          size={16}
          className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 text-on-surface-variant/60"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Search conversations…"
          aria-label="Search conversations"
          className="sl-field w-full py-1.5 pl-8 text-[13px]"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-1">
        {searchActive ? (
          <SearchResults
            results={results}
            loading={searching}
            active={params.conversationId}
            onNavigate={onNavigate}
          />
        ) : hydrated && summaries.length === 0 ? (
          <p className="px-1 py-3 text-xs text-on-surface-variant">
            No conversations yet. Start a new chat to see it here.
          </p>
        ) : (
          <>
            <p className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant/70">
              Recents
            </p>
            <ul className="space-y-0.5">
              {visible.map((summary) => (
                <ConversationRow
                  key={summary.id}
                  summary={summary}
                  active={summary.id === params.conversationId}
                  renaming={renamingId === summary.id}
                  open={openId === summary.id}
                  onNavigate={onNavigate}
                  onOpenChange={(next) => setOpenId(next ? summary.id : null)}
                  onStartRename={() => {
                    setOpenId(null);
                    setRenamingId(summary.id);
                  }}
                  onRename={(title) => {
                    renameConversation(summary.id, title);
                    setRenamingId(null);
                  }}
                  onCancelRename={() => setRenamingId(null)}
                />
              ))}
            </ul>

            {hasMore ? (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="mt-1 flex w-full items-center gap-1 rounded-lg px-3 py-1.5 text-[13px] font-medium text-on-surface-variant transition-colors hover:bg-surface-variant/60 hover:text-on-surface"
              >
                {expanded ? "Show less" : "View all conversations"}
                <Icon
                  name={expanded ? "expand_more" : "chevron_right"}
                  size={16}
                  className={cn(expanded && "rotate-180")}
                />
              </button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function SearchResults({
  results,
  loading,
  active,
  onNavigate,
}: {
  results: ConversationSearchResult[];
  loading: boolean;
  active?: string;
  onNavigate?: () => void;
}) {
  if (loading && results.length === 0) {
    return (
      <p className="px-1 py-3 text-xs text-on-surface-variant">Searching…</p>
    );
  }
  if (results.length === 0) {
    return (
      <p className="px-1 py-3 text-xs text-on-surface-variant">
        No conversations match.
      </p>
    );
  }
  return (
    <ul className="space-y-0.5">
      {results.map((r) => (
        <li key={r.id}>
          <Link
            href={`/chat/${r.id}`}
            onClick={onNavigate}
            aria-current={r.id === active ? "page" : undefined}
            className={cn(
              "flex min-w-0 flex-col gap-0.5 rounded-2xl border px-3.5 py-2 text-[13px] transition-colors",
              r.id === active
                ? "liquid-pill-active border-transparent text-white"
                : "border-glass-line bg-surface text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
            )}
          >
            <span className="truncate font-medium">{r.title}</span>
            {r.snippet !== r.title ? (
              <span className="truncate text-[11px] opacity-75">
                {r.snippet}
              </span>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}

interface RowProps {
  summary: ConversationSummary;
  active: boolean;
  renaming: boolean;
  open: boolean;
  onNavigate?: () => void;
  onOpenChange: (open: boolean) => void;
  onStartRename: () => void;
  onRename: (title: string) => void;
  onCancelRename: () => void;
}

function ConversationRow({
  summary,
  active,
  renaming,
  open,
  onNavigate,
  onOpenChange,
  onStartRename,
  onRename,
  onCancelRename,
}: RowProps) {
  const router = useRouter();
  const [dragX, setDragX] = useState<number | null>(null);
  const drag = useRef({ startX: 0, startY: 0, mode: "idle" as "idle" | "maybe" | "drag" });
  const suppressClick = useRef(false);

  const shown = dragX ?? (open ? -REVEAL : 0);

  async function remove() {
    onOpenChange(false);
    await useConversationStore.getState().deleteConversation(summary.id);
    if (active) router.push("/chat");
  }

  function onPointerDown(e: React.PointerEvent) {
    if (renaming) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    // Clear any stale suppression from a previous gesture whose synthetic click
    // landed on the wrapper rather than the link.
    suppressClick.current = false;
    drag.current = { startX: e.clientX, startY: e.clientY, mode: "maybe" };
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (d.mode === "idle") return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (d.mode === "maybe") {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      // A mostly-vertical move is a scroll — let the list have it.
      if (Math.abs(dy) >= Math.abs(dx)) {
        d.mode = "idle";
        return;
      }
      d.mode = "drag";
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    const base = open ? -REVEAL : 0;
    setDragX(Math.max(-(COMMIT + 40), Math.min(0, base + dx)));
  }

  function onPointerUp(e: React.PointerEvent) {
    const d = drag.current;
    const wasDrag = d.mode === "drag";
    d.mode = "idle";
    if (!wasDrag) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* pointer already released */
    }
    suppressClick.current = true;
    const x = dragX ?? 0;
    setDragX(null);
    if (x <= -COMMIT) {
      void remove();
      return;
    }
    onOpenChange(x <= -REVEAL / 2);
  }

  if (renaming) {
    return (
      <li>
        <input
          autoFocus
          defaultValue={summary.title}
          onBlur={(e) => onRename(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") onCancelRename();
          }}
          className="sl-field border-primary"
        />
      </li>
    );
  }

  return (
    <li className="group/item relative">
      {shown < -1 ? (
        <button
          type="button"
          onClick={() => void remove()}
          aria-label={`Delete ${summary.title}`}
          tabIndex={open ? 0 : -1}
          className="absolute inset-y-0 right-0 flex w-[72px] flex-col items-center justify-center gap-0.5 rounded-2xl bg-error text-[10px] font-semibold text-on-error"
        >
          <Icon name="delete" size={16} />
          Delete
        </button>
      ) : null}

      <div
        className={cn(
          "relative touch-pan-y",
          dragX === null && "transition-transform duration-200 ease-out",
        )}
        style={{ transform: `translateX(${shown}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <Link
          href={`/chat/${summary.id}`}
          aria-current={active ? "page" : undefined}
          onClick={(e) => {
            if (suppressClick.current) {
              suppressClick.current = false;
              e.preventDefault();
              return;
            }
            if (open) {
              e.preventDefault();
              onOpenChange(false);
              return;
            }
            onNavigate?.();
          }}
          className={cn(
            "flex min-w-0 items-center gap-2 rounded-2xl border py-2 pl-3.5 pr-16 text-[13px] font-medium transition-colors",
            active
              ? "liquid-pill-active border-transparent text-white"
              : "border-glass-line bg-surface text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
          )}
        >
          {summary.pinned ? (
            <Icon
              name="star"
              size={14}
              className={active ? "text-white" : "text-primary"}
            />
          ) : null}
          <span className="truncate">{summary.title}</span>
        </Link>

        {shown === 0 ? (
          <span className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5 opacity-0 transition-opacity group-hover/item:opacity-100 group-focus-within/item:opacity-100">
            <RowIcon
              icon="edit"
              label={`Rename ${summary.title}`}
              active={active}
              onClick={onStartRename}
            />
            <RowIcon
              icon="delete"
              label={`Delete ${summary.title}`}
              active={active}
              destructive
              onClick={() => void remove()}
            />
          </span>
        ) : null}
      </div>
    </li>
  );
}

function RowIcon({
  icon,
  label,
  active,
  destructive = false,
  onClick,
}: {
  icon: React.ComponentProps<typeof Icon>["name"];
  label: string;
  active: boolean;
  destructive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
        active
          ? "text-white/80 hover:bg-white/20 hover:text-white"
          : destructive
            ? "text-on-surface-variant hover:bg-error/10 hover:text-error"
            : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface",
      )}
    >
      <Icon name={icon} size={16} />
    </button>
  );
}
