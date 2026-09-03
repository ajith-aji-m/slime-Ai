import { cn } from "@/lib/utils/cn";
import { Icon, type IconName } from "./icon";

export interface AvatarProps {
  /** initials or short label used for the fallback + alt text */
  name: string;
  src?: string;
  icon?: IconName;
  size?: number;
  /** violet gradient treatment used by the brand mark + assistant avatar */
  brand?: boolean;
  className?: string;
}

export function Avatar({
  name,
  src,
  icon,
  size = 40,
  brand = false,
  className,
}: AvatarProps) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border",
        brand
          ? "border-transparent bg-primary text-on-primary"
          : "border-outline-variant bg-surface-container-high text-on-surface-variant",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- user/remote avatars, no known dimensions
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : icon ? (
        <Icon name={icon} filled={brand} size={Math.round(size * 0.5)} />
      ) : (
        <span
          className="font-semibold"
          style={{ fontSize: Math.round(size * 0.36) }}
        >
          {initials}
        </span>
      )}
    </span>
  );
}
