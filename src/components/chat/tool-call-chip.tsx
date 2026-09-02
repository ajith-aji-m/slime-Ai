import { Icon } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { toolsById } from "@/config/tools";
import type { ToolId } from "@/types/chat";

export function ToolCallChip({
  tool,
  label,
  status,
  detail,
}: {
  tool: ToolId;
  label: string;
  status: "running" | "done" | "error";
  detail?: string;
}) {
  const config = toolsById[tool];
  return (
    <div className="mb-3 inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-1.5 text-xs">
      <Icon
        name={config?.icon ?? "bolt"}
        size={16}
        className={cn(
          status === "running" && "animate-pulse text-primary",
          status === "done" && "text-success",
          status === "error" && "text-error",
        )}
      />
      <span className="font-medium text-on-surface">{label}</span>
      {detail ? (
        <span className="text-on-surface-variant">· {detail}</span>
      ) : null}
    </div>
  );
}
