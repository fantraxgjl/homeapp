"use client";

import { useState, useEffect, useCallback } from "react";
import { useDashboardStore } from "@/store/dashboardStore";

const AUTO_LOCK_MINUTES = 15;

export function PinLockOverlay() {
  const { isUnlocked, setUnlocked, lastActivity } = useDashboardStore();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFirstSetup, setIsFirstSetup] = useState<boolean | null>(null);

  // Check if PIN exists on mount
  useEffect(() => {
    fetch("/api/pin/session")
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) setUnlocked(true);
      })
      .catch(() => {});

    // Check if first setup
    fetch("/api/pin/status")
      .then((r) => r.json())
      .then((data) => setIsFirstSetup(!data.hasPin))
      .catch(() => setIsFirstSetup(false));
  }, [setUnlocked]);

  // Auto-lock after inactivity
  useEffect(() => {
    if (!isUnlocked) return;
    const interval = setInterval(() => {
      const idleMs = Date.now() - lastActivity;
      if (idleMs > AUTO_LOCK_MINUTES * 60 * 1000) {
        handleLock();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [isUnlocked, lastActivity]);

  const handleLock = useCallback(async () => {
    await fetch("/api/pin/session", { method: "DELETE" });
    setUnlocked(false);
    setPin("");
    setError("");
  }, [setUnlocked]);

  // Expose lock function via event
  useEffect(() => {
    const handler = () => handleLock();
    window.addEventListener("homeapp:lock", handler);
    return () => window.removeEventListener("homeapp:lock", handler);
  }, [handleLock]);

  const handleDigit = (digit: string) => {
    if (pin.length >= 8) return;
    setPin((p) => p + digit);
    setError("");
  };

  const handleDelete = () => {
    setPin((p) => p.slice(0, -1));
    setError("");
  };

  const handleSubmit = async () => {
    if (pin.length < 4) {
      setError("PIN must be at least 4 digits");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/pin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (data.success) {
        setUnlocked(true);
        setPin("");
        setError("");
        if (data.firstSetup) setIsFirstSetup(false);
      } else {
        setError(data.error || "Incorrect PIN");
        setPin("");
      }
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  };

  // Auto-submit when PIN reaches expected length (but allow up to 8)
  useEffect(() => {
    if (pin.length === 4 && !isFirstSetup) {
      handleSubmit();
    }
  }, [pin]);

  if (isUnlocked) return null;

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 select-none">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="text-5xl mb-3">🏠</div>
        <h1 className="text-2xl font-bold text-white">Family Dashboard</h1>
        <p className="text-slate-400 mt-1 text-sm">
          {isFirstSetup
            ? "Create a PIN to secure your dashboard"
            : "Enter PIN to unlock"}
        </p>
      </div>

      {/* PIN dots */}
      <div className="flex gap-3 mb-6">
        {Array.from({ length: Math.max(4, pin.length) }).map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all duration-150 ${
              i < pin.length ? "bg-indigo-500 scale-110" : "bg-slate-700"
            }`}
          />
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-2 bg-red-900/50 border border-red-700 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3 w-72">
        {keys.slice(0, 9).map((digit) => (
          <button
            key={digit}
            onClick={() => handleDigit(digit)}
            disabled={loading}
            className="h-20 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 active:scale-95 text-white text-2xl font-semibold transition-all duration-100 touch-manipulation disabled:opacity-50"
          >
            {digit}
          </button>
        ))}
        {/* Bottom row: delete, 0, submit */}
        <button
          onClick={handleDelete}
          disabled={loading || pin.length === 0}
          className="h-20 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 active:scale-95 text-slate-300 text-xl transition-all duration-100 touch-manipulation disabled:opacity-30"
        >
          ⌫
        </button>
        <button
          onClick={() => handleDigit("0")}
          disabled={loading}
          className="h-20 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 active:scale-95 text-white text-2xl font-semibold transition-all duration-100 touch-manipulation disabled:opacity-50"
        >
          0
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || pin.length < 4}
          className="h-20 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 active:scale-95 text-white text-xl transition-all duration-100 touch-manipulation disabled:opacity-30"
        >
          {loading ? "…" : "✓"}
        </button>
      </div>
    </div>
  );
}
