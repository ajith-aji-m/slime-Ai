"use client";

import { cn } from "@/lib/utils/cn";
import { Card, Chip, Icon } from "@/components/ui";
import { models, providers } from "@/config/providers";
import { useModelStore } from "@/stores/model-store";

export function ModelCatalogue() {
  const defaultModelId = useModelStore((s) => s.defaultModelId);
  const setDefaultModel = useModelStore((s) => s.setDefaultModel);

  return (
    <div className="space-y-8">
      {providers.map((provider) => {
        const providerModels = models.filter((m) => m.providerId === provider.id);
        if (providerModels.length === 0) return null;
        return (
          <section key={provider.id}>
            <div className="mb-3 flex items-center gap-2">
              <Icon name={provider.icon as never} size={18} className="text-primary" />
              <h3 className="text-sm font-semibold text-on-surface">
                {provider.name}
              </h3>
              <Chip
                tone={provider.status === "connected" ? "success" : "neutral"}
              >
                {provider.status.replace("-", " ")}
              </Chip>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {providerModels.map((model) => {
                const selected = model.id === defaultModelId;
                return (
                  <Card
                    key={model.id}
                    className={cn(
                      "p-4 transition-colors",
                      selected && "border-primary ring-1 ring-primary",
                      !model.available && "opacity-60",
                    )}
                  >
                    <button
                      type="button"
                      disabled={!model.available}
                      onClick={() => setDefaultModel(model.id)}
                      className="w-full text-left disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-on-surface">
                          {model.name}
                        </span>
                        {selected ? (
                          <Icon name="check" size={16} className="text-primary" />
                        ) : null}
                        {model.tier === "pro" ? (
                          <Chip tone="primary">Pro</Chip>
                        ) : null}
                        {!model.available ? <Chip>Coming soon</Chip> : null}
                      </div>
                      <p className="mt-1 text-xs text-on-surface-variant">
                        {model.description}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {model.badges.map((badge) => (
                          <Chip key={badge}>{badge}</Chip>
                        ))}
                        <Chip>
                          {(model.contextWindow / 1000).toLocaleString()}K context
                        </Chip>
                      </div>
                    </button>
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
