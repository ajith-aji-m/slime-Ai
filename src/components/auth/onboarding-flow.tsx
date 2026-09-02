"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassPanel, Button, Icon } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { tools } from "@/config/tools";
import { useComposerStore } from "@/stores/composer-store";
import { useSettingsStore } from "@/stores/settings-store";
import type { ToolId } from "@/types/chat";

const STEPS = ["You", "Tools"] as const;

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const { displayName, setProfile } = useSettingsStore();
  const defaultTools = useComposerStore((s) => s.defaultTools);
  const toggleDefaultTool = useComposerStore((s) => s.toggleDefaultTool);

  function next() {
    if (step < STEPS.length - 1) setStep(step + 1);
    else router.push("/chat");
  }

  return (
    <GlassPanel className="w-full max-w-lg p-8">
      <ol className="mb-6 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                i <= step
                  ? "bg-primary text-on-primary"
                  : "bg-surface-variant text-on-surface-variant",
              )}
            >
              {i < step ? <Icon name="check" size={14} /> : i + 1}
            </span>
            <span className="text-xs font-medium text-on-surface-variant">
              {label}
            </span>
            {i < STEPS.length - 1 ? (
              <span className="h-px flex-1 bg-outline-variant" />
            ) : null}
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <div>
          <h1 className="text-xl font-semibold text-on-surface">Welcome.</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            What should Slime AI call you?
          </p>
          <input
            autoFocus
            value={displayName === "You" ? "" : displayName}
            placeholder="Your name"
            onChange={(e) => setProfile({ displayName: e.target.value || "You" })}
            className="sl-field mt-4 h-11"
          />
        </div>
      ) : null}

      {step === 1 ? (
        <div>
          <h1 className="text-xl font-semibold text-on-surface">Turn on tools</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Enable the capabilities you want available by default. Slime AI
            handles everything else for you.
          </p>
          <div className="mt-4 space-y-2">
            {tools
              .filter((t) => t.inComposer)
              .map((tool) => {
                const on = defaultTools.includes(tool.id as ToolId);
                return (
                  <button
                    key={tool.id}
                    type="button"
                    role="switch"
                    aria-checked={on}
                    onClick={() => toggleDefaultTool(tool.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                      on
                        ? "border-primary bg-primary-container/10"
                        : "border-outline-variant hover:bg-surface-variant",
                    )}
                  >
                    <Icon name={tool.icon} size={18} className="text-primary" />
                    <span className="flex-1 text-sm font-medium text-on-surface">
                      {tool.label}
                    </span>
                    <Icon
                      name={on ? "check_circle" : "add_circle"}
                      size={18}
                      className={on ? "text-primary" : "text-on-surface-variant"}
                    />
                  </button>
                );
              })}
          </div>
        </div>
      ) : null}

      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => (step === 0 ? router.push("/chat") : setStep(step - 1))}
        >
          {step === 0 ? "Skip" : "Back"}
        </Button>
        <Button size="md" onClick={next} iconRight="chevron_right">
          {step === STEPS.length - 1 ? "Enter workstation" : "Continue"}
        </Button>
      </div>
    </GlassPanel>
  );
}
