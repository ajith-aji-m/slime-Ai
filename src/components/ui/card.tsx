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
        "rounded-xl border border-outline-variant",
        variant === "grounded"
          ? "bg-surface-container-lowest"
          : "bg-surface-container-low",
        interactive &&
          "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-ambient",
        className,
      )}
      {...rest}
    />
  );
}
