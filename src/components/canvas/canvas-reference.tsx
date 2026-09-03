"use client";

import { Icon } from "@/components/ui";
import {
  CANVAS_TYPE_ICON,
  CANVAS_TYPE_LABEL,
  type CanvasArtifactRef,
} from "@/types/canvas";
import { useCanvasStore } from "@/stores/canvas-store";

/**
 * Compact in-thread stand-in for a Canvas artifact. The chat keeps the
 * assistant's prose; the heavy output (code / HTML / table / report / image)
 * lives in Canvas and is one click away.
 */
export function CanvasReference({ artifact }: { artifact: CanvasArtifactRef }) {
  const openArtifact = useCanvasStore((s) => s.openArtifact);
  const activeId = useCanvasStore((s) => s.activeId);
  const open = useCanvasStore((s) => s.open);
  const isActive = open && activeId === artifact.id;

  return (
    <div className="my-3">
      {artifact.teaser ? (
        <p className="mb-2 text-[15px] leading-relaxed text-on-surface">
          {artifact.teaser}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => openArtifact(artifact.id)}
        aria-label={`Open ${CANVAS_TYPE_LABEL[artifact.type]} in Canvas`}
        className={[
          "group flex w-full items-center gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors",
          isActive
            ? "border-primary/40 bg-primary/5"
            : "border-outline-variant bg-surface-container-low hover:border-outline hover:bg-surface-container",
        ].join(" ")}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon name={CANVAS_TYPE_ICON[artifact.type]} size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant/80">
              {CANVAS_TYPE_LABEL[artifact.type]}
            </span>
          </span>
          <span className="block truncate text-sm font-semibold text-on-surface">
            {artifact.title}
          </span>
          {artifact.subtitle ? (
            <span className="block truncate text-xs text-on-surface-variant">
              {artifact.subtitle}
            </span>
          ) : null}
        </span>
        <span className="flex shrink-0 items-center gap-1 text-[13px] font-semibold text-primary">
          {isActive ? "In Canvas" : "Open in Canvas"}
          <Icon
            name="chevron_right"
            size={16}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </span>
      </button>
    </div>
  );
}
