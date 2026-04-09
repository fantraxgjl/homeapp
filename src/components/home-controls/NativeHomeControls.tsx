"use client";

import { useEffect, useState } from "react";
import { useHomeKit } from "@/hooks/useHomeKit";
import type { HKAccessory } from "@/lib/native/homekit";

/**
 * HomeKit device grid for the native iOS app.
 * Rendered instead of DeviceGrid when running inside Capacitor.
 */
export function NativeHomeControls() {
  const { available, loading, error, accessories, states, requestAuth, toggle, setBrightness, setTemperature, setLock, refresh } =
    useHomeKit();
  const [authRequested, setAuthRequested] = useState(false);

  useEffect(() => {
    if (!available || authRequested) return;
    setAuthRequested(true);
    requestAuth().then((granted) => {
      if (granted) refresh();
    });
  }, [available, authRequested, requestAuth, refresh]);

  if (!available) return null;

  if (loading && accessories.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400">
        Loading HomeKit accessories…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <p className="text-4xl">⚠️</p>
        <p className="text-white font-semibold">HomeKit error</p>
        <p className="text-slate-400 text-sm max-w-sm">{error}</p>
        <button
          onClick={() => requestAuth().then((g) => { if (g) refresh(); })}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (accessories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
        <p className="text-4xl">🏠</p>
        <p className="text-white font-semibold">No HomeKit accessories found</p>
        <p className="text-slate-400 text-sm">Add accessories in the Apple Home app first.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {accessories.map((a) => (
        <HomeKitCard
          key={a.uniqueIdentifier}
          accessory={a}
          state={states[a.uniqueIdentifier]}
          onToggle={toggle}
          onBrightness={setBrightness}
          onTemperature={setTemperature}
          onLock={setLock}
        />
      ))}
    </div>
  );
}

// ─── Individual accessory card ────────────────────────────────────────────────

function HomeKitCard({
  accessory,
  state,
  onToggle,
  onBrightness,
  onTemperature,
  onLock,
}: {
  accessory: HKAccessory;
  state: ReturnType<typeof useHomeKit>["states"][string] | undefined;
  onToggle: (uid: string, on: boolean) => Promise<void>;
  onBrightness: (uid: string, b: number) => Promise<void>;
  onTemperature: (uid: string, c: number) => Promise<void>;
  onLock: (uid: string, secured: boolean) => Promise<void>;
}) {
  const isOn = state?.on ?? false;
  const { category, name, roomName, isReachable } = accessory;
  const uid = accessory.uniqueIdentifier;

  const icon =
    category === "lightbulb" ? "💡"
    : category === "switch" ? "🔌"
    : category === "thermostat" ? "🌡️"
    : category === "lock" ? "🔒"
    : "📟";

  const activeColor =
    category === "lightbulb" || category === "switch"
      ? isOn ? "bg-amber-500/20 border-amber-500/40" : "bg-slate-800 border-slate-700"
      : "bg-slate-800 border-slate-700";

  return (
    <div className={`rounded-2xl border p-4 flex flex-col gap-3 transition-colors ${activeColor} ${!isReachable ? "opacity-50" : ""}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-2xl">{icon}</div>
          <p className="text-white font-medium text-sm mt-1">{name}</p>
          {roomName && <p className="text-slate-400 text-xs">{roomName}</p>}
        </div>
        {!isReachable && (
          <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">Offline</span>
        )}
      </div>

      {/* Controls */}
      {(category === "lightbulb" || category === "switch") && (
        <button
          onClick={() => onToggle(uid, !isOn)}
          disabled={!isReachable}
          className={`w-full py-2 rounded-xl text-sm font-medium transition-colors ${
            isOn
              ? "bg-amber-500 hover:bg-amber-400 text-slate-900"
              : "bg-slate-700 hover:bg-slate-600 text-white"
          }`}
        >
          {isOn ? "On" : "Off"}
        </button>
      )}

      {category === "lightbulb" && state?.brightness !== undefined && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 w-4">☀️</span>
          <input
            type="range"
            min={0}
            max={100}
            value={state.brightness}
            onChange={(e) => onBrightness(uid, Number(e.target.value))}
            disabled={!isReachable || !isOn}
            className="flex-1 accent-amber-400"
          />
        </div>
      )}

      {category === "thermostat" && (
        <div className="flex items-center gap-3">
          <span className="text-slate-300 text-sm">
            {state?.currentTemperature !== undefined ? `${state.currentTemperature.toFixed(1)}°` : "—"}
          </span>
          <span className="text-slate-500 text-xs">now</span>
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={() => onTemperature(uid, (state?.targetTemperature ?? 20) - 0.5)}
              className="w-8 h-8 rounded-lg bg-slate-700 text-white text-lg font-bold flex items-center justify-center"
            >−</button>
            <span className="text-white text-sm tabular-nums w-10 text-center">
              {state?.targetTemperature !== undefined ? `${state.targetTemperature.toFixed(1)}°` : "—"}
            </span>
            <button
              onClick={() => onTemperature(uid, (state?.targetTemperature ?? 20) + 0.5)}
              className="w-8 h-8 rounded-lg bg-slate-700 text-white text-lg font-bold flex items-center justify-center"
            >+</button>
          </div>
        </div>
      )}

      {category === "lock" && (
        <button
          onClick={() => onLock(uid, state?.lockState !== "secured")}
          disabled={!isReachable}
          className={`w-full py-2 rounded-xl text-sm font-medium transition-colors ${
            state?.lockState === "secured"
              ? "bg-emerald-600 hover:bg-emerald-500 text-white"
              : "bg-rose-600 hover:bg-rose-500 text-white"
          }`}
        >
          {state?.lockState === "secured" ? "🔒 Locked" : state?.lockState === "jammed" ? "⚠️ Jammed" : "🔓 Unlocked"}
        </button>
      )}
    </div>
  );
}
