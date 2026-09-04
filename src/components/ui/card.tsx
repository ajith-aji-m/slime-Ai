import { cn } from "@/lib/utils/cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** grounded white block vs plain container tint */
  variant?: "grounded" | "muted";
  interactive?: boolean;
}

/** DESIGN.md: "pure white fill for grounded content blocks". */
export function Card({
  variant = "grounded",
  interactive = false,
  className,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl",
        variant === "grounded"
          ? "glass-panel"
          : "border border-white/10 bg-white/5 backdrop-blur-md",
        interactive &&
          "transition-all duration-200 hover:border-[var(--sl-mode-ring)] hover:brightness-125",
        className,
      )}
      {...rest}
    />
  );
}
