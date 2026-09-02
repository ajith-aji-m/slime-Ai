import Link from "next/link";
import { Avatar } from "@/components/ui";
import { site } from "@/config/site";

export function Brand({ href = "/chat" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <Avatar name={site.name} icon="psychology" brand size={40} />
      <span className="leading-tight">
        <span className="block text-lg font-bold text-primary">{site.name}</span>
        <span className="block text-[11px] font-semibold tracking-wide text-on-surface-variant">
          {site.tagline}
        </span>
      </span>
    </Link>
  );
}
