"use client";

import { create } from "zustand";
import type { ModelInfo, ProviderInfo } from "@/types/provider";
import {
  models as staticModels,
  providers as staticProviders,
} from "@/config/providers";

interface CatalogueState {
  providers: ProviderInfo[];
  models: ModelInfo[];
  /** true once /api/models has answered */
  synced: boolean;
  refresh: () => Promise<void>;
  getModel: (id: string) => ModelInfo | undefined;
}

/**
 * Client-side Model Registry. Seeded synchronously from the static catalogue so
 * the UI renders immediately, then reconciled with `GET /api/models` for live
 * `available` flags + any env-defined models.
 */
export const useCatalogueStore = create<CatalogueState>((set, get) => ({
  providers: staticProviders,
  models: staticModels,
  synced: false,

  async refresh() {
    try {
      const res = await fetch("/api/models", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as {
        providers: ProviderInfo[];
        models: ModelInfo[];
      };
      set({ providers: data.providers, models: data.models, synced: true });
    } catch {
      // keep the static catalogue; real providers stay unavailable
      set({ synced: true });
    }
  },

  getModel(id) {
    return get().models.find((m) => m.id === id);
  },
}));

/** Non-hook access for stores/utilities. */
export const catalogue = {
  model: (id: string) => useCatalogueStore.getState().getModel(id),
  providerIdForModel: (id: string) =>
    useCatalogueStore.getState().getModel(id)?.providerId,
};
