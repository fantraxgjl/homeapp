"use client";

import { create } from "zustand";

interface DashboardStore {
  isUnlocked: boolean;
  setUnlocked: (value: boolean) => void;
  lastActivity: number;
  updateActivity: () => void;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  isUnlocked: false,
  setUnlocked: (value) => set({ isUnlocked: value, lastActivity: Date.now() }),
  lastActivity: Date.now(),
  updateActivity: () => set({ lastActivity: Date.now() }),
}));
