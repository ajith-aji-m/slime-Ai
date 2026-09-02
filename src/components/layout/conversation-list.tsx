"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Icon } from "@/components/ui";
import { Popover } from "@/components/ui/popover";
import { useConversationStore } from "@/stores/conversation-store";

export function ConversationList({ onNavigate }: { onNavigate?: () => void }) {
  const params = useParams<{ conversationId?: string }>();
  const router = useRouter();
  const summaries = useConversationStore((s) => s.summaries);
  const hydrated = useConversationStore((s) => s.hydrated);
  const { renameConversation, deleteConversation } =
    useConversationStore.getState();
  const [renamingId, setRenamingId] = useState<string | null>(null);

  if (hydrated && summaries.length === 0) {
    return (
      <p className="px-4 py-3 text-xs text-on-surface-variant">
        No conversations yet. Start a new chat to see it here.
      </p>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-2 py-1">
      <p className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant/70">
        Recents
      </p>
      <ul className="space-y-0.5">
        {summaries.map((summary) => {
          const active = summary.id === params.conversationId;
          return (
            <li key={summary.id} className="group/item relative">
              {renamingId === summary.id ? (
                <input
                  autoFocus
                  defaultValue={summary.title}
                  onBlur={(e) => {
                    renameConversation(summary.id, e.target.value);
                    setRenamingId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                    if (e.key === "Escape") setRenamingId(null);
                  }}
                  className="w-full rounded-lg border border-primary bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:outline-none"
                />
              ) : (
                <Link
                  href={`/chat/${summary.id}`}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-surface-variant font-medium text-on-surface"
                      : "text-on-surface-variant hover:bg-surface-variant/60 hover:text-on-surface",
                  )}
                >
                  {summary.pinned ? (
                    <Icon name="star" size={14} className="text-primary" />
                  ) : null}
                  <span className="truncate">{summary.title}</span>
                </Link>
              )}

              <span className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover/item:opacity-100 focus-within:opacity-100">
                <Popover
                  align="end"
                  trigger={({ toggle, open }) => (
                    <button
                      type="button"
                      onClick={toggle}
                      aria-label={`Options for ${summary.title}`}
                      aria-expanded={open}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-on-surface-variant hover:bg-surface-container-high"
                    >
                      <Icon name="more_horiz" size={18} />
                    </button>
                  )}
                >
                  {({ close }) => (
                    <div className="min-w-[160px]">
                      <MenuItem
                        icon="edit"
                        label="Rename"
                        onClick={() => {
                          setRenamingId(summary.id);
                          close();
                        }}
                      />
                      <MenuItem
                        icon="delete"
                        label="Delete"
                        destructive
                        onClick={async () => {
                          close();
                          await deleteConversation(summary.id);
                          if (active) router.push("/chat");
                        }}
                      />
                    </div>
                  )}
                </Popover>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  destructive = false,
}: {
  icon: React.ComponentProps<typeof Icon>["name"];
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-surface-variant",
        destructive ? "text-error" : "text-on-surface",
      )}
    >
      <Icon name={icon} size={16} />
      {label}
    </button>
  );
}
