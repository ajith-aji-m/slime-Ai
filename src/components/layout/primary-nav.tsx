"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Icon } from "@/components/ui";
import { navigation } from "@/config/navigation";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PrimaryNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const primary = navigation.filter((n) => n.section === "primary");
  const secondary = navigation.filter((n) => n.section === "secondary");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <nav className="flex-1 space-y-1 overflow-y-auto px-2" aria-label="Primary">
        {primary.map((item) => (
          <NavLink
            key={item.href}
            {...item}
            active={isActive(pathname, item.href)}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
      <div className="mt-auto space-y-1 border-t border-outline-variant px-2 pt-3">
        {secondary.map((item) => (
          <NavLink
            key={item.href}
            {...item}
            active={isActive(pathname, item.href)}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  );
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
  icon: React.ComponentProps<typeof Icon>["name"];
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
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
