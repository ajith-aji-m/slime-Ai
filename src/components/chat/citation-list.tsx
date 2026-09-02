import { Icon } from "@/components/ui";
import type { Citation } from "@/types/chat";
import type { IconName } from "@/components/ui/icon";

export function CitationList({ citations }: { citations: Citation[] }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-outline-variant pt-3">
      <span className="mr-1 text-xs font-semibold tracking-wide text-on-surface-variant">
        Citations
      </span>
      {citations.map((c) => {
        const className =
          "inline-flex items-center gap-1 rounded-full border border-outline-variant bg-surface-container-high px-3 py-1 text-xs font-medium text-on-surface transition-colors hover:bg-surface-variant";
        const inner = (
          <>
            <Icon name={(c.icon as IconName) ?? "description"} size={14} />[{c.id}
            ] {c.label}
          </>
        );
        return c.href ? (
          <a
            key={c.id}
            href={c.href}
            target="_blank"
            rel="noreferrer"
            className={className}
          >
            {inner}
          </a>
        ) : (
          <button key={c.id} type="button" className={className}>
            {inner}
          </button>
        );
      })}
    </div>
  );
}
