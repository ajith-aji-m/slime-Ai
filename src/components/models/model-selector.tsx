"use client";

import { cn } from "@/lib/utils/cn";
import { Chip, Icon } from "@/components/ui";
import { Popover } from "@/components/ui/popover";
import { useCatalogueStore } from "@/stores/catalogue-store";

export interface ModelSelectorProps {
  value: string;
  onChange: (modelId: string) => void;
  /** compact chip trigger (composer) vs full-width row */
  variant?: "chip" | "row";
}

export function ModelSelector({
  value,
  onChange,
  variant = "chip",
}: ModelSelectorProps) {
  const models = useCatalogueStore((s) => s.models);
  const active = models.find((m) => m.id === value) ?? models[0];

  return (
    <Popover
      side="top"
      align="start"
      trigger={({ toggle, open, id, triggerId }) => (
        <button
          id={triggerId}
          type="button"
          onClick={toggle}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? id : undefined}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-outline-variant px-3 py-1 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-variant",
            variant === "row" && "w-full justify-between px-4 py-2 text-sm",
          )}
        >
          <span className="inline-flex items-center gap-1.5">
            <Icon name="auto_awesome" size={14} />
            {active.name}
          </span>
          <Icon name="expand_more" size={16} />
        </button>
      )}
    >
      {({ close }) => (
        <ul role="listbox" aria-label="Select model" className="max-h-[320px] overflow-y-auto">
          {models.map((model) => {
            const selected = model.id === value;
            return (
              <li key={model.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  disabled={!model.available}
                  onClick={() => {
                    onChange(model.id);
                    close();
                  }}
                  className={cn(
                    "flex w-full flex-col gap-0.5 rounded-lg px-3 py-2 text-left transition-colors",
                    "hover:bg-surface-variant disabled:cursor-not-allowed disabled:opacity-45",
                    selected && "bg-surface-variant",
                  )}
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-on-surface">
                    {model.name}
                    {selected ? (
                      <Icon name="check" size={16} className="text-primary" />
                    ) : null}
                    {model.tier === "pro" ? (
                      <Chip tone="primary">Pro</Chip>
                    ) : null}
                    {!model.available ? <Chip>Soon</Chip> : null}
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    {model.description}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Popover>
  );
}
