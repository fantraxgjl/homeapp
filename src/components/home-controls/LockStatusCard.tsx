"use client";

import { DeviceStatusBadge } from "./DeviceStatusBadge";
import type { HaEntityState } from "@/lib/home-assistant";

interface LockStatusCardProps {
  entity: HaEntityState & { friendlyName?: string };
  onUnlock?: (entityId: string) => Promise<void>;
}

export function LockStatusCard({ entity, onUnlock }: LockStatusCardProps) {
  const isLocked = entity.state === "locked";
  const isUnlocked = entity.state === "unlocked";
  const friendlyName = entity.friendlyName ?? String(entity.attributes["friendly_name"] ?? entity.entity_id);

  return (
    <div
      className={`rounded-2xl p-4 border transition-all ${
        isLocked
          ? "bg-slate-800 border-slate-700"
          : "bg-red-500/10 border-red-500/40"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="font-semibold text-sm text-slate-300">
            {isLocked ? "🔒" : "🔓"} {friendlyName}
          </p>
          <DeviceStatusBadge state={entity.state} domain="lock" />
        </div>
        {isUnlocked && onUnlock && (
          <button
            onClick={() => onUnlock(entity.entity_id)}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
          >
            Lock
          </button>
        )}
      </div>
      {isUnlocked && (
        <p className="text-red-400 text-xs mt-2 font-medium">⚠️ Currently unlocked</p>
      )}
    </div>
  );
}
