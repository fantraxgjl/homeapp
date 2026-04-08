"use client";

import { useEffect } from "react";
import { SideNav } from "./SideNav";
import { TopBar } from "./TopBar";
import { PinLockOverlay } from "./PinLockOverlay";
import { useDashboardStore } from "@/store/dashboardStore";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const updateActivity = useDashboardStore((s) => s.updateActivity);

  const handleLock = () => {
    window.dispatchEvent(new Event("homeapp:lock"));
  };

  // Track pointer/touch activity for auto-lock
  useEffect(() => {
    const events = ["pointerdown", "keydown"];
    events.forEach((e) => window.addEventListener(e, updateActivity));
    return () => events.forEach((e) => window.removeEventListener(e, updateActivity));
  }, [updateActivity]);

  return (
    <>
      <PinLockOverlay />
      <div className="flex flex-col h-full">
        <TopBar onLock={handleLock} />
        <div className="flex flex-1 overflow-hidden">
          <SideNav />
          <main className="flex-1 overflow-auto dashboard-scroll">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
