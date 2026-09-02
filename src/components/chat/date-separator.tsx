export function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-4">
      <span className="h-px flex-1 bg-outline-variant" />
      <span className="px-2 text-xs font-semibold tracking-wide text-on-surface-variant">
        {label}
      </span>
      <span className="h-px flex-1 bg-outline-variant" />
    </div>
  );
}
