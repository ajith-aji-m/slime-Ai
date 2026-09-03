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
        "rounded-lg border border-outline-variant",
        variant === "grounded"
          ? "bg-surface-container-lowest"
          : "bg-surface-container-low",
        interactive &&
          "transition-colors duration-150 hover:border-outline hover:bg-surface-container-low",
        className,
      )}
      {...rest}
    />
  );
}
