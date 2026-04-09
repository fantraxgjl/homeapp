"use client";

import { useEffect } from "react";
import { isNative } from "@/lib/platform";
import { getDb } from "./db";

/**
 * Mount this once at the root of the app.
 *
 * In native mode it:
 * 1. Initialises the Capacitor SQLite database (creates tables on first launch).
 * 2. Patches window.fetch so all /api/... calls are routed to the native
 *    SQLite layer instead of a remote server — every existing component works
 *    without modification.
 *
 * In web/Pi mode this component renders nothing and does nothing.
 */
export function NativeDataProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!isNative()) return;

    let originalFetch: typeof fetch;

    // Initialise DB then install the fetch patch
    getDb()
      .then(() => {
        originalFetch = window.fetch.bind(window);

        window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
          const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

          // Only intercept relative /api/... calls
          if (typeof url === "string" && url.startsWith("/api/")) {
            const { routeNativeRequest } = await import("./api-router");
            const urlObj = new URL(url, "http://localhost");
            return routeNativeRequest(
              urlObj.pathname,
              (init?.method ?? "GET").toUpperCase(),
              init,
              urlObj.searchParams
            );
          }

          return originalFetch(input, init);
        };
      })
      .catch((e) => console.error("[NativeDataProvider] DB init failed:", e));

    return () => {
      // Restore original fetch on unmount (hot reload / dev)
      if (originalFetch) window.fetch = originalFetch;
    };
  }, []);

  return <>{children}</>;
}
