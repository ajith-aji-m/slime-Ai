import { cn } from "@/lib/utils/cn";

/** Scroll container + width constraint for non-chat workspace screens. */
export function WorkspacePage({
  title,
  description,
  actions,
  children,
  width = "default",
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  width?: "default" | "wide" | "narrow";
}) {
  return (
    <div className="h-full overflow-y-auto">
      <div
        className={cn(
          "mx-auto px-4 py-8 md:px-10",
          width === "wide" && "max-w-6xl",
          width === "default" && "max-w-4xl",
          width === "narrow" && "max-w-2xl",
        )}
      >
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-on-surface">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm text-on-surface-variant">
                {description}
              </p>
            ) : null}
          </div>
          {actions}
        </header>
        {children}
      </div>
    </div>
  );
}
