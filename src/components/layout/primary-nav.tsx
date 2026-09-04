"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Icon, type IconName } from "@/components/ui";
import { navigation } from "@/config/navigation";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  label,
  href,
  icon,
  active,
  onNavigate,
}: {
  label: string;
  href: string;
  icon: IconName;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm transition-all",
        active
          ? "liquid-pill-active font-medium text-white"
          : "font-medium text-on-surface-variant hover:bg-white/10 hover:text-on-surface",
      )}
    >
      <Icon
        name={icon}
        filled={active}
        size={18}
        className={active ? "text-white" : "text-primary/80"}
      />
      {label}
    </Link>
  );
}

export function PrimaryNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-0.5 px-3" aria-label="Primary">
      {navigation
        .filter((n) => n.section === "primary")
        .map((item) => (
          <NavLink
            key={item.href}
            {...item}
            active={isActive(pathname, item.href)}
            onNavigate={onNavigate}
          />
        ))}
    </nav>
  );
}

export function SecondaryNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav
      className="space-y-0.5 border-t border-outline-variant px-3 pt-3"
      aria-label="Secondary"
    >
      {navigation
        .filter((n) => n.section === "secondary")
        .map((item) => (
          <NavLink
            key={item.href}
            {...item}
            active={isActive(pathname, item.href)}
            onNavigate={onNavigate}
          />
        ))}
    </nav>
  );
}
