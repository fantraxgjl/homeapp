"use client";

import { useCallback, useEffect, useRef } from "react";
import { useHaStore } from "@/store/haStore";

const POLL_INTERVAL = 30_000; // 30 seconds

export function useHomeAssistant() {
  const { setStates, setUnavailable, updateState } = useHaStore();
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchStates = useCallback(async () => {
    try {
      const res = await fetch("/api/home-assistant/states");
      const data = await res.json();
      if (data.available) {
        setStates(data.states ?? []);
      } else {
        setUnavailable(data.error);
      }
    } catch (err) {
      setUnavailable(err instanceof Error ? err.message : "Network error");
    }
  }, [setStates, setUnavailable]);

  useEffect(() => {
    fetchStates();

    function schedule() {
      pollRef.current = setTimeout(async () => {
        await fetchStates();
        schedule();
      }, POLL_INTERVAL);
    }
    schedule();

    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [fetchStates]);

  const callService = useCallback(
    async (domain: string, service: string, entityId: string, serviceData?: Record<string, unknown>) => {
      // Optimistic update
      if (domain === "light" || domain === "switch" || domain === "input_boolean") {
        updateState(entityId, {
          state: service === "turn_on" ? "on" : service === "turn_off" ? "off" : service === "toggle" ? "toggle" : service,
        });
      }

      const res = await fetch("/api/home-assistant/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, service, entityId, serviceData }),
      });

      if (!res.ok) {
        // Revert on failure by re-fetching
        await fetchStates();
        throw new Error("Service call failed");
      }

      // Refresh state after a short delay to pick up HA's actual new state
      setTimeout(fetchStates, 1500);
    },
    [updateState, fetchStates]
  );

  return { callService, refresh: fetchStates };
}
