"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useHaStore } from "@/store/haStore";
import { useHomeAssistant } from "@/hooks/useHomeAssistant";
import { DeviceStatusBadge } from "./DeviceStatusBadge";

export function HomeControlsWidget() {
  useHomeAssistant(); // start polling
  const { available, states } = useHaStore();

  const devices = Object.values(states)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    .slice(0, 4); // show max 4 devices in widget

  return (
    <Link href="/home-controls" className="block h-full">
      <div className="h-full flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold text-sm">Smart Home</h3>
          <span className="text-slate-500 text-xs">›</span>
        </div>

        {!available ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-2">
            <p className="text-4xl mb-2">🏠</p>
            <p className="text-slate-400 text-xs">Not configured</p>
            <p className="text-slate-500 text-xs mt-0.5">Set up in Settings</p>
          </div>
        ) : devices.length === 0 ? (
          <p className="text-slate-500 text-sm">No devices added</p>
        ) : (
          <div className="space-y-2">
            {devices.map((entity) => {
              const domain = entity.entity_id.split(".")[0];
              const ICONS: Record<string, string> = { light: "💡", switch: "🔌", climate: "🌡️", lock: "🔒", media_player: "📺" };
              const icon = ICONS[domain] ?? "📦";
              const friendlyName = entity.friendlyName ?? String(entity.attributes["friendly_name"] ?? entity.entity_id);
              return (
                <div key={entity.entity_id} className="flex items-center justify-between gap-2">
                  <span className="text-sm">{icon}</span>
                  <span className="text-white text-xs flex-1 truncate">{friendlyName}</span>
                  <DeviceStatusBadge state={entity.state} domain={domain} />
                </div>
              );
            })}
            {Object.keys(states).length > 4 && (
              <p className="text-slate-500 text-xs text-center">
                +{Object.keys(states).length - 4} more
              </p>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
