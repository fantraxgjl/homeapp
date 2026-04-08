"use client";

import { DeviceStatusBadge } from "./DeviceStatusBadge";
import type { HaEntityState } from "@/lib/home-assistant";

interface ThermostatControlProps {
  entity: HaEntityState & { friendlyName?: string };
  onSetTemp: (entityId: string, temperature: number) => Promise<void>;
}

export function ThermostatControl({ entity, onSetTemp }: ThermostatControlProps) {
  const currentTemp = entity.attributes["current_temperature"] as number | null ?? null;
  const targetTemp = entity.attributes["temperature"] as number | null ?? null;
  const hvacMode = entity.state; // heating, cooling, off, idle, etc.
  const friendlyName = entity.friendlyName ?? String(entity.attributes["friendly_name"] ?? entity.entity_id);

  async function adjust(delta: number) {
    if (targetTemp === null) return;
    await onSetTemp(entity.entity_id, Math.round((targetTemp + delta) * 2) / 2);
  }

  return (
    <div className="rounded-2xl p-4 border bg-slate-800 border-slate-700">
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-1">
          <p className="font-semibold text-sm text-slate-300">🌡️ {friendlyName}</p>
          <DeviceStatusBadge state={hvacMode} domain="climate" />
        </div>
        {currentTemp !== null && (
          <span className="text-2xl font-bold text-white">{currentTemp}°</span>
        )}
      </div>

      {targetTemp !== null && (
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-xs">Set point</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => adjust(-0.5)}
              className="min-w-10 min-h-10 flex items-center justify-center rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-lg font-bold transition-colors"
            >
              −
            </button>
            <span className="text-white font-bold text-lg w-14 text-center">{targetTemp}°</span>
            <button
              onClick={() => adjust(0.5)}
              className="min-w-10 min-h-10 flex items-center justify-center rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-lg font-bold transition-colors"
            >
              +
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
