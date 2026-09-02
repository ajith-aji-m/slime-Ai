import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";
import { Icon, type IconName } from "./icon";

type IconButtonSize = "sm" | "md" | "lg";

const SIZES: Record<IconButtonSize, { box: string; glyph: number }> = {
  sm: { box: "h-8 w-8", glyph: 18 },
  md: { box: "h-9 w-9", glyph: 20 },
  lg: { box: "h-10 w-10", glyph: 22 },
};

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  /** required — icon-only controls must be labelled */
  label: string;
  size?: IconButtonSize;
  filled?: boolean;
  active?: boolean;
  variant?: "ghost" | "surface";
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    {
      icon,
      label,
      size = "md",
      filled = false,
      active = false,
      variant = "ghost",
      className,
      type = "button",
      ...rest
    },
    ref,
  ) {
    const s = SIZES[size];
    return (
      <button
        ref={ref}
        type={type}
        aria-label={label}
        title={label}
        aria-pressed={rest.onClick && active ? active : undefined}
        className={cn(
          "inline-flex items-center justify-center rounded-full transition-colors duration-200",
          "hover:bg-surface-variant hover:text-primary disabled:pointer-events-none disabled:opacity-50",
          variant === "surface" && "bg-surface-container-high",
          active ? "text-primary" : "text-on-surface-variant",
          s.box,
          className,
        )}
        {...rest}
      >
        <Icon name={icon} filled={filled} size={s.glyph} />
      </button>
    );
  },
);
