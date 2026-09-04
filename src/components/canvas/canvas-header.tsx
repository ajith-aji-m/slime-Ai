"use client";

import { useState } from "react";
import { Icon, IconButton } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { downloadText, safeFilename } from "@/lib/canvas/download";
import { parseMarkdownTable, tableToCsv } from "@/lib/canvas/table";
import {
  CANVAS_TYPE_ICON,
  CANVAS_TYPE_LABEL,
  type CanvasArtifact,
} from "@/types/canvas";
import { useCanvasStore } from "@/stores/canvas-store";

const EXT: Record<string, string> = {
  javascript: "js",
  typescript: "ts",
  tsx: "tsx",
  jsx: "jsx",
  python: "py",
  json: "json",
  bash: "sh",
  shell: "sh",
  css: "css",
  html: "html",
};

function copyPayload(artifact: CanvasArtifact): string {
  switch (artifact.type) {
    case "code":
      return artifact.code ?? "";
    case "html":
      return artifact.html ?? artifact.code ?? "";
    case "table":
    case "report":
    case "humanizer":
      return artifact.markdown ?? "";
    case "image":
      return artifact.imagePrompt ?? "";
    default:
      return "";
  }
}

function exportArtifact(artifact: CanvasArtifact) {
  const base = safeFilename(artifact.title, artifact.type);
  switch (artifact.type) {
    case "code": {
      const ext = EXT[(artifact.language ?? "").toLowerCase()] ?? "txt";
      downloadText(`${base}.${ext}`, artifact.code ?? "");
      return;
    }
    case "html":
      downloadText(`${base}.html`, artifact.html ?? artifact.code ?? "", "text/html");
      return;
    case "table": {
      const parsed = parseMarkdownTable(artifact.markdown ?? "");
      downloadText(
        `${base}.csv`,
        parsed ? tableToCsv(parsed) : (artifact.markdown ?? ""),
        "text/csv",
      );
      return;
    }
    case "report":
    case "humanizer":
      downloadText(`${base}.md`, artifact.markdown ?? "", "text/markdown");
      return;
    default:
      return;
  }
}

export function CanvasHeader({
  artifact,
  onClose,
}: {
  artifact: CanvasArtifact;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const order = useCanvasStore((s) => s.order);
  const artifacts = useCanvasStore((s) => s.artifacts);
  const activeId = useCanvasStore((s) => s.activeId);
  const openArtifact = useCanvasStore((s) => s.openArtifact);

  const siblings = order
    .map((id) => artifacts[id])
    .filter((a): a is CanvasArtifact => Boolean(a) && a.conversationId === artifact.conversationId);

  const canCopy = Boolean(copyPayload(artifact));
  const canExport = artifact.type !== "image";

  async function copy() {
    try {
      await navigator.clipboard.writeText(copyPayload(artifact));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="shrink-0 border-b border-glass-line bg-glass-fill">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon name={CANVAS_TYPE_ICON[artifact.type]} size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-on-surface">
            {artifact.title}
          </p>
          <p className="text-[11px] font-medium uppercase tracking-wide text-on-surface-variant/80">
            {CANVAS_TYPE_LABEL[artifact.type]}
          </p>
        </div>
        {canCopy ? (
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-variant hover:text-primary"
          >
            <Icon name={copied ? "check" : "content_copy"} size={14} />
            {copied ? "Copied" : "Copy"}
          </button>
        ) : null}
        {canExport ? (
          <IconButton
            icon="download"
            label="Export"
            size="sm"
            onClick={() => exportArtifact(artifact)}
          />
        ) : null}
        <IconButton icon="close" label="Close Canvas" size="sm" onClick={onClose} />
      </div>

      {siblings.length > 1 ? (
        <div className="flex gap-1 overflow-x-auto border-t border-outline-variant px-2 py-1.5">
          {siblings.map((sib) => (
            <button
              key={sib.id}
              type="button"
              onClick={() => openArtifact(sib.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                sib.id === activeId
                  ? "bg-primary/10 text-primary"
                  : "text-on-surface-variant hover:bg-surface-variant hover:text-on-surface",
              )}
            >
              <Icon name={CANVAS_TYPE_ICON[sib.type]} size={13} />
              <span className="max-w-[8rem] truncate">{sib.title}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
