/**
 * TypeScript interface for the native HomeKit Capacitor plugin.
 *
 * The Swift implementation lives at:
 *   ios/App/App/Plugins/HomeKitPlugin.swift
 *
 * Usage (only call from client components after checking isNative()):
 *   import { HomeKit } from "@/lib/native/homekit";
 *   const accessories = await HomeKit.fetchAccessories();
 */

import { registerPlugin } from "@capacitor/core";

// ─── Types ────────────────────────────────────────────────────────────────────

export type HKCategory =
  | "lightbulb"
  | "switch"
  | "thermostat"
  | "lock"
  | "sensor"
  | "other";

export interface HKAccessory {
  /** Unique UUID assigned by HomeKit */
  uniqueIdentifier: string;
  name: string;
  category: HKCategory;
  roomName: string | null;
  isReachable: boolean;
}

export interface HKAccessoryState {
  uniqueIdentifier: string;
  /** For lights / switches */
  on?: boolean;
  /** 0–100 */
  brightness?: number;
  /** Celsius */
  currentTemperature?: number;
  /** Celsius */
  targetTemperature?: number;
  /** "secured" | "unsecured" | "jammed" | "unknown" */
  lockState?: string;
}

export interface HKServiceCall {
  uniqueIdentifier: string;
  /** Set power state */
  on?: boolean;
  /** Set brightness 0–100 */
  brightness?: number;
  /** Set target temperature (Celsius) */
  targetTemperature?: number;
  /** "secured" | "unsecured" */
  lockState?: "secured" | "unsecured";
}

// ─── Plugin interface ─────────────────────────────────────────────────────────

export interface HomeKitPlugin {
  /**
   * Request HomeKit authorisation. Must be called before any other method.
   * Resolves with `{ granted: true }` or `{ granted: false, reason: string }`.
   */
  requestAuthorization(): Promise<{ granted: boolean; reason?: string }>;

  /**
   * Return all accessories across all homes visible to this app.
   */
  fetchAccessories(): Promise<{ accessories: HKAccessory[] }>;

  /**
   * Read the current state of a single accessory.
   */
  getAccessoryState(options: {
    uniqueIdentifier: string;
  }): Promise<HKAccessoryState>;

  /**
   * Write one or more characteristics to an accessory.
   */
  callService(options: HKServiceCall): Promise<{ success: boolean }>;

  /**
   * Subscribe to real-time characteristic updates.
   * The listener is called whenever any accessory value changes.
   */
  addListener(
    eventName: "accessoryStateChange",
    listener: (state: HKAccessoryState) => void
  ): Promise<{ remove: () => void }>;
}

// Register the plugin — the Swift class name must match ("HomeKitPlugin").
export const HomeKit = registerPlugin<HomeKitPlugin>("HomeKitPlugin");
