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
        "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary-container text-on-primary-container"
          : "text-on-surface-variant hover:bg-surface-variant hover:text-on-surface",
      )}
    >
      <Icon name={icon} filled={active} size={20} />
      {label}
    </Link>
  );
}

export function PrimaryNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-0.5 px-2" aria-label="Primary">
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
      className="space-y-0.5 border-t border-outline-variant px-2 pt-3"
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
