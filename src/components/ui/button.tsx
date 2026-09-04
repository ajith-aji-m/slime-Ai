import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";
import { Icon, type IconName } from "./icon";

type ButtonVariant = "primary" | "ghost" | "outline" | "subtle" | "glass";
type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  // primary = accent fill (cyan in the ocean theme), dark text
  primary:
    "bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container shadow-sm",
  // ghost-style, low emphasis
  ghost:
    "text-on-surface-variant hover:bg-surface-variant hover:text-on-surface",
  outline:
    "border border-outline-variant text-on-surface hover:bg-surface-variant",
  subtle: "bg-surface-container-high text-on-surface hover:bg-surface-variant",
  // frosted liquid-glass pill
  glass: "liquid-inner text-on-surface hover:brightness-125 active:scale-[0.98]",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-[13px] gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-12 px-6 text-sm gap-2", // DESIGN.md: 48px height for a premium feel
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** pill radius instead of the default 12px */
  pill?: boolean;
  fullWidth?: boolean;
  iconLeft?: IconName;
  iconRight?: IconName;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    pill = false,
    fullWidth = false,
    iconLeft,
    iconRight,
    className,
    children,
    type = "button",
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center font-medium tracking-[0.01em]",
        "transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50",
        pill ? "rounded-full" : "rounded-md",
        fullWidth && "w-full",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {iconLeft ? <Icon name={iconLeft} size={size === "sm" ? 18 : 20} /> : null}
      {children}
      {iconRight ? (
        <Icon name={iconRight} size={size === "sm" ? 18 : 20} />
      ) : null}
    </button>
  );
});
