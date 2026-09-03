import Link from "next/link";
import { Avatar, Icon } from "@/components/ui";
import { site } from "@/config/site";

export function Brand({
  href = "/chat",
  showChevron = false,
}: {
  href?: string;
  /** workspace-switcher affordance shown in the sidebar header */
  showChevron?: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <Avatar name={site.name} icon="cloud" brand size={36} />
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block truncate text-[15px] font-bold text-on-surface">
          {site.name}
        </span>
        <span className="block truncate text-[11px] font-medium text-on-surface-variant">
          {site.tagline}
        </span>
      </span>
      {showChevron ? (
        <Icon
          name="expand_more"
          size={18}
          className="shrink-0 text-on-surface-variant"
        />
      ) : null}
    </Link>
  );
}
