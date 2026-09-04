"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Icon, IconButton, type IconName } from "@/components/ui";
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
  trailing,
}: {
  label: string;
  href: string;
  icon: IconName;
  active: boolean;
  onNavigate?: () => void;
  /** optional action rendered at the row's trailing edge (outside the link) */
  trailing?: React.ReactNode;
}) {
  return (
    <div className="relative flex items-center">
      <Link
        href={href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex flex-1 items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm transition-[background-color,border-color,color,box-shadow] duration-[480ms] ease-[var(--ease-emphasized)]",
          trailing && "pr-11",
          active
            ? "liquid-pill-active font-medium text-white"
            : "font-medium text-on-surface-variant hover:bg-glass-hover hover:text-on-surface",
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
      {trailing ? (
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
          {trailing}
        </div>
      ) : null}
    </div>
  );
}

export function PrimaryNavLinks({
  onNavigate,
  onNewChat,
}: {
  onNavigate?: () => void;
  /** when set, the Chats row shows a trailing "+" that starts a new chat */
  onNewChat?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav className="space-y-0.5 px-3" aria-label="Primary">
      {navigation
        .filter((n) => n.section === "primary" && n.enabled !== false)
        .map((item) => (
          <NavLink
            key={item.href}
            {...item}
            active={isActive(pathname, item.href)}
            onNavigate={onNavigate}
            trailing={
              item.href === "/chat" && onNewChat ? (
                <IconButton
                  icon="add"
                  label="New chat"
                  size="sm"
                  onClick={onNewChat}
                />
              ) : undefined
            }
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
        .filter((n) => n.section === "secondary" && n.enabled !== false)
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
