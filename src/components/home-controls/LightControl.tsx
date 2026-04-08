"use client";

import { useState } from "react";
import { DeviceStatusBadge } from "./DeviceStatusBadge";
import type { HaEntityState } from "@/lib/home-assistant";

interface LightControlProps {
  entity: HaEntityState & { friendlyName?: string };
  onToggle: (entityId: string) => Promise<void>;
  onBrightness: (entityId: string, brightness: number) => Promise<void>;
}

export function LightControl({ entity, onToggle, onBrightness }: LightControlProps) {
  const [dragging, setDragging] = useState(false);
  const isOn = entity.state === "on";
  const brightness = typeof entity.attributes["brightness"] === "number"
    ? Math.round((entity.attributes["brightness"] as number) / 2.55)
    : null;

  const friendlyName = entity.friendlyName ?? String(entity.attributes["friendly_name"] ?? entity.entity_id);

  return (
    <div
      className={`rounded-2xl p-4 border transition-all ${
        isOn
          ? "bg-amber-500/10 border-amber-500/30"
          : "bg-slate-800 border-slate-700"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="space-y-1">
          <p className={`font-semibold text-sm ${isOn ? "text-amber-200" : "text-slate-300"}`}>
            💡 {friendlyName}
          </p>
          <DeviceStatusBadge state={entity.state} domain="light" />
        </div>
        <button
          onClick={() => onToggle(entity.entity_id)}
          className={`min-w-12 h-7 rounded-full border-2 transition-all relative ${
            isOn
              ? "bg-amber-400 border-amber-400"
              : "bg-slate-700 border-slate-600"
          }`}
          aria-label={isOn ? "Turn off" : "Turn on"}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
              isOn ? "left-6" : "left-0.5"
            }`}
          />
        </button>
      </div>

      {/* Brightness slider — only when on and supports brightness */}
      {isOn && brightness !== null && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Brightness</span>
            <span>{brightness}%</span>
          </div>
          <input
            type="range"
            min={1}
            max={100}
            value={brightness}
            onChange={(e) => {
              setDragging(true);
              onBrightness(entity.entity_id, Number(e.target.value));
            }}
            onMouseUp={() => setDragging(false)}
            onTouchEnd={() => setDragging(false)}
            className="w-full h-2 rounded-full accent-amber-400 cursor-pointer"
          />
        </div>
      )}
    </div>
  );
}
