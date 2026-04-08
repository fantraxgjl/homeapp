"use client";

import { useEffect } from "react";

export function KioskShell({ children }: { children: React.ReactNode }) {
  // Prevent back-swipe / browser back navigation
  useEffect(() => {
    const push = () =>
      window.history.pushState(null, "", window.location.href);
    push();
    const handler = () => push();
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  return (
    <div className="h-full flex flex-col overflow-hidden select-none kiosk-no-select">
      {children}
    </div>
  );
}
