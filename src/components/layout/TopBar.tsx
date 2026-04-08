"use client";

import { useEffect, useState } from "react";
import { useDashboardStore } from "@/store/dashboardStore";
import { format } from "date-fns";
import { WeatherWidget } from "@/components/weather/WeatherWidget";

interface TopBarProps {
  onLock: () => void;
}

export function TopBar({ onLock }: TopBarProps) {
  const [now, setNow] = useState(new Date());
  const updateActivity = useDashboardStore((s) => s.updateActivity);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleInteraction = () => updateActivity();

  return (
    <div
      className="flex items-center justify-between px-6 py-3 bg-slate-900/80 backdrop-blur border-b border-slate-800 select-none"
      onClick={handleInteraction}
    >
      {/* Date */}
      <div className="flex flex-col">
        <span className="text-2xl font-semibold text-white">
          {format(now, "EEEE")}
        </span>
        <span className="text-sm text-slate-400">
          {format(now, "d MMMM yyyy")}
        </span>
      </div>

      {/* Weather */}
      <WeatherWidget />

      {/* Clock */}
      <div className="text-4xl font-bold text-white tabular-nums tracking-tight">
        {format(now, "HH:mm")}
        <span className="text-slate-500 text-2xl">
          :{format(now, "ss")}
        </span>
      </div>

      {/* Lock button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onLock();
        }}
        className="flex items-center gap-2 px-4 py-2 min-h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-white transition-all text-sm font-medium"
        aria-label="Lock dashboard"
      >
        <span>🔒</span>
        <span>Lock</span>
      </button>
    </div>
  );
}
