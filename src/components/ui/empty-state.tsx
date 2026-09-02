import { cn } from "@/lib/utils/cn";
import { Icon, type IconName } from "./icon";

export interface EmptyStateProps {
  icon: IconName;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "gap-2 p-4" : "gap-3 p-8",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-surface-variant text-on-surface-variant",
          compact ? "h-10 w-10" : "h-12 w-12",
        )}
      >
        <Icon name={icon} size={compact ? 20 : 24} />
      </div>
      <p className="text-sm font-medium text-on-surface">{title}</p>
      {description ? (
        <p className="max-w-[220px] text-xs leading-relaxed text-on-surface-variant">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
