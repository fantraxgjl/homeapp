"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { isNative } from "@/lib/platform";
import type { HKAccessory, HKAccessoryState } from "@/lib/native/homekit";

interface UseHomeKitResult {
  /** Whether the HomeKit plugin is available (native iOS only) */
  available: boolean;
  /** True while fetching accessories or waiting for authorisation */
  loading: boolean;
  error: string | null;
  accessories: HKAccessory[];
  states: Record<string, HKAccessoryState>;
  /** Request HomeKit authorisation (call once on mount) */
  requestAuth: () => Promise<boolean>;
  /** Toggle a light/switch on or off */
  toggle: (uid: string, on: boolean) => Promise<void>;
  /** Set brightness 0–100 */
  setBrightness: (uid: string, brightness: number) => Promise<void>;
  /** Set thermostat target temp (Celsius) */
  setTemperature: (uid: string, celsius: number) => Promise<void>;
  /** Lock or unlock a door */
  setLock: (uid: string, secured: boolean) => Promise<void>;
  /** Refresh accessory list */
  refresh: () => Promise<void>;
}

export function useHomeKit(): UseHomeKitResult {
  const available = isNative();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessories, setAccessories] = useState<HKAccessory[]>([]);
  const [states, setStates] = useState<Record<string, HKAccessoryState>>({});
  const listenerRef = useRef<{ remove: () => void } | null>(null);

  const getPlugin = useCallback(async () => {
    if (!available) return null;
    const { HomeKit } = await import("@/lib/native/homekit");
    return HomeKit;
  }, [available]);

  const requestAuth = useCallback(async (): Promise<boolean> => {
    const plugin = await getPlugin();
    if (!plugin) return false;
    try {
      const { granted, reason } = await plugin.requestAuthorization();
      if (!granted) setError(reason ?? "HomeKit access denied");
      return granted;
    } catch (e) {
      setError(String(e));
      return false;
    }
  }, [getPlugin]);

  const refresh = useCallback(async () => {
    const plugin = await getPlugin();
    if (!plugin) return;
    setLoading(true);
    setError(null);
    try {
      const { accessories: list } = await plugin.fetchAccessories();
      setAccessories(list);
      // Fetch initial state for each accessory
      const stateMap: Record<string, HKAccessoryState> = {};
      await Promise.all(
        list.map(async (a) => {
          try {
            stateMap[a.uniqueIdentifier] = await plugin.getAccessoryState({
              uniqueIdentifier: a.uniqueIdentifier,
            });
          } catch {
            // ignore individual failures
          }
        })
      );
      setStates(stateMap);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [getPlugin]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!available) return;
    let cancelled = false;
    (async () => {
      const plugin = await getPlugin();
      if (!plugin || cancelled) return;
      const handle = await plugin.addListener("accessoryStateChange", (state) => {
        setStates((prev) => ({ ...prev, [state.uniqueIdentifier]: state }));
      });
      listenerRef.current = handle;
    })();
    return () => {
      cancelled = true;
      listenerRef.current?.remove();
    };
  }, [available, getPlugin]);

  const callService = useCallback(
    async (options: import("@/lib/native/homekit").HKServiceCall) => {
      const plugin = await getPlugin();
      if (!plugin) return;
      // Optimistic update
      setStates((prev) => ({
        ...prev,
        [options.uniqueIdentifier]: { ...prev[options.uniqueIdentifier], ...options },
      }));
      try {
        await plugin.callService(options);
      } catch (e) {
        setError(String(e));
        // Revert: re-fetch state for this accessory
        try {
          const fresh = await plugin.getAccessoryState({ uniqueIdentifier: options.uniqueIdentifier });
          setStates((prev) => ({ ...prev, [options.uniqueIdentifier]: fresh }));
        } catch {
          // ignore
        }
      }
    },
    [getPlugin]
  );

  const toggle = useCallback(
    (uid: string, on: boolean) => callService({ uniqueIdentifier: uid, on }),
    [callService]
  );
  const setBrightness = useCallback(
    (uid: string, brightness: number) => callService({ uniqueIdentifier: uid, brightness }),
    [callService]
  );
  const setTemperature = useCallback(
    (uid: string, celsius: number) => callService({ uniqueIdentifier: uid, targetTemperature: celsius }),
    [callService]
  );
  const setLock = useCallback(
    (uid: string, secured: boolean) =>
      callService({ uniqueIdentifier: uid, lockState: secured ? "secured" : "unsecured" }),
    [callService]
  );

  return { available, loading, error, accessories, states, requestAuth, toggle, setBrightness, setTemperature, setLock, refresh };
}
