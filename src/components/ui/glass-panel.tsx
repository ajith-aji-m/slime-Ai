import { cn } from "@/lib/utils/cn";

export interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: "div" | "section" | "aside";
  /** add the ambient soft shadow from DESIGN.md */
  elevated?: boolean;
}

/**
 * Glassmorphic surface — DESIGN.md "Elevation & Depth".
 * Single source; the export redefined `.glass-panel` in every file.
 */
export function GlassPanel({
  as: Tag = "div",
  elevated = true,
  className,
  ...rest
}: GlassPanelProps) {
  return (
    <Tag
      className={cn(
        "glass-panel rounded-2xl",
        elevated && "shadow-ambient",
        className,
      )}
      {...rest}
    />
  );
}
