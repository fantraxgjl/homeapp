"use client";

import { useHaStore } from "@/store/haStore";
import { useHomeAssistant } from "@/hooks/useHomeAssistant";
import { LightControl } from "./LightControl";
import { ThermostatControl } from "./ThermostatControl";
import { LockStatusCard } from "./LockStatusCard";
import { GenericDeviceCard } from "./GenericDeviceCard";

export function DeviceGrid() {
  useHomeAssistant(); // starts polling
  const { available, states, error } = useHaStore();

  const { callService } = useHomeAssistant();

  const sortedEntities = Object.values(states).sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
  );

  if (!available) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-5xl mb-4">🏠</p>
        <p className="text-white font-semibold text-lg">Home Assistant not connected</p>
        <p className="text-slate-400 text-sm mt-2 max-w-sm">
          {error ?? "Configure your Home Assistant URL and token in Settings to control your smart home devices."}
        </p>
        <a
          href="/settings"
          className="mt-5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors"
        >
          Open Settings →
        </a>
      </div>
    );
  }

  if (sortedEntities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-5xl mb-4">🔧</p>
        <p className="text-white font-semibold">No devices configured</p>
        <p className="text-slate-400 text-sm mt-2">Add devices to display in Settings.</p>
        <a href="/settings" className="mt-5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors">
          Open Settings →
        </a>
      </div>
    );
  }

  async function handleToggle(entityId: string) {
    const domain = entityId.split(".")[0];
    await callService(domain, "toggle", entityId);
  }

  async function handleBrightness(entityId: string, pct: number) {
    await callService("light", "turn_on", entityId, { brightness_pct: pct });
  }

  async function handleSetTemp(entityId: string, temperature: number) {
    await callService("climate", "set_temperature", entityId, { temperature });
  }

  async function handleLock(entityId: string) {
    await callService("lock", "lock", entityId);
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {sortedEntities.map((entity) => {
        const domain = entity.entity_id.split(".")[0];
        if (domain === "light") {
          return <LightControl key={entity.entity_id} entity={entity} onToggle={handleToggle} onBrightness={handleBrightness} />;
        }
        if (domain === "climate") {
          return <ThermostatControl key={entity.entity_id} entity={entity} onSetTemp={handleSetTemp} />;
        }
        if (domain === "lock") {
          return <LockStatusCard key={entity.entity_id} entity={entity} onUnlock={handleLock} />;
        }
        return <GenericDeviceCard key={entity.entity_id} entity={entity} onToggle={handleToggle} />;
      })}
    </div>
  );
}
