import { cn } from "@/lib/utils/cn";
import { Icon, type IconName } from "./icon";

type ChipTone = "neutral" | "success" | "warning" | "danger" | "primary";

const TONES: Record<ChipTone, string> = {
  neutral:
    "bg-surface-container-high text-on-surface border-outline-variant",
  success:
    "bg-success-container text-on-success-container border-transparent",
  warning:
    "bg-warning-container text-on-warning-container border-transparent",
  danger: "bg-error-container text-on-error-container border-transparent",
  primary: "bg-primary-container/15 text-primary border-transparent",
};

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: ChipTone;
  icon?: IconName;
  /** render as an <a>-like interactive pill */
  interactive?: boolean;
}

/** Pill-style indicator. DESIGN.md: "highly rounded (pill-style)". */
export function Chip({
  tone = "neutral",
  icon,
  interactive = false,
  className,
  children,
  ...rest
}: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5",
        "text-xs font-medium whitespace-nowrap",
        interactive && "cursor-pointer transition-colors hover:bg-surface-variant",
        TONES[tone],
        className,
      )}
      {...rest}
    >
      {icon ? <Icon name={icon} size={14} /> : null}
      {children}
    </span>
  );
}
