"use client";

import { DeviceStatusBadge } from "./DeviceStatusBadge";
import type { HaEntityState } from "@/lib/home-assistant";

interface GenericDeviceCardProps {
  entity: HaEntityState & { friendlyName?: string };
  onToggle?: (entityId: string) => Promise<void>;
}

const DOMAIN_ICONS: Record<string, string> = {
  switch: "🔌",
  media_player: "📺",
  input_boolean: "🔘",
  fan: "🌀",
  cover: "🪟",
  sensor: "📊",
  binary_sensor: "📡",
  other: "📦",
};

export function GenericDeviceCard({ entity, onToggle }: GenericDeviceCardProps) {
  const domain = entity.entity_id.split(".")[0];
  const icon = DOMAIN_ICONS[domain] ?? "📦";
  const isOn = entity.state === "on" || entity.state === "playing" || entity.state === "open";
  const canToggle = ["switch", "fan", "input_boolean", "media_player"].includes(domain);
  const friendlyName = entity.friendlyName ?? String(entity.attributes["friendly_name"] ?? entity.entity_id);

  return (
    <div
      className={`rounded-2xl p-4 border transition-all ${
        isOn ? "bg-indigo-500/10 border-indigo-500/30" : "bg-slate-800 border-slate-700"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1 min-w-0">
          <p className="font-semibold text-sm text-slate-300 truncate">
            {icon} {friendlyName}
          </p>
          <DeviceStatusBadge state={entity.state} domain={domain} />
        </div>
        {canToggle && onToggle && (
          <button
            onClick={() => onToggle(entity.entity_id)}
            className={`min-w-12 h-7 rounded-full border-2 transition-all relative ml-2 shrink-0 ${
              isOn ? "bg-indigo-500 border-indigo-500" : "bg-slate-700 border-slate-600"
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                isOn ? "left-6" : "left-0.5"
              }`}
            />
          </button>
        )}
      </div>
    </div>
  );
}
