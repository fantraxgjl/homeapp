"use client";

import { create } from "zustand";
import type { HaEntityState } from "@/lib/home-assistant";

interface HaStore {
  available: boolean;
  states: Record<string, HaEntityState & { friendlyName?: string; iconOverride?: string | null; displayOrder?: number; deviceId?: string }>;
  lastFetch: number | null;
  error: string | null;
  setStates: (states: Array<HaEntityState & { friendlyName?: string; iconOverride?: string | null; displayOrder?: number; deviceId?: string }>) => void;
  setUnavailable: (error?: string) => void;
  updateState: (entityId: string, patch: Partial<HaEntityState>) => void;
}

export const useHaStore = create<HaStore>((set) => ({
  available: false,
  states: {},
  lastFetch: null,
  error: null,

  setStates: (states) =>
    set({
      available: true,
      error: null,
      lastFetch: Date.now(),
      states: Object.fromEntries(states.map((s) => [s.entity_id, s])),
    }),

  setUnavailable: (error) =>
    set({ available: false, error: error ?? null }),

  updateState: (entityId, patch) =>
    set((prev) => ({
      states: {
        ...prev.states,
        [entityId]: { ...prev.states[entityId], ...patch },
      },
    })),
}));
