"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UnlockPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFirstSetup, setIsFirstSetup] = useState(false);

  useEffect(() => {
    fetch("/api/pin/status")
      .then((r) => r.json())
      .then((data) => setIsFirstSetup(!data.hasPin))
      .catch(() => {});
  }, []);

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
        router.push("/");
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

  // Auto-submit at 4 digits when not first setup
  useEffect(() => {
    if (pin.length === 4 && !isFirstSetup) {
      handleSubmit();
    }
  }, [pin, isFirstSetup]);

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <div className="h-full flex flex-col items-center justify-center bg-slate-900 select-none">
      {/* Back to kids view */}
      <button
        onClick={() => router.push("/kids")}
        className="absolute top-6 left-6 flex items-center gap-2 px-4 py-3 min-h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-sm transition-all"
      >
        ← Back
      </button>

      <div className="text-5xl mb-4">🔐</div>
      <h1 className="text-2xl font-bold text-white mb-1">
        {isFirstSetup ? "Create a PIN" : "Parent Unlock"}
      </h1>
      <p className="text-slate-400 text-sm mb-6">
        {isFirstSetup
          ? "Choose a 4–8 digit PIN to secure the dashboard"
          : "Enter your PIN to access the family dashboard"}
      </p>

      {/* PIN dots */}
      <div className="flex gap-3 mb-4">
        {Array.from({ length: Math.max(4, pin.length) }).map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all duration-150 ${
              i < pin.length ? "bg-indigo-500 scale-110" : "bg-slate-700"
            }`}
          />
        ))}
      </div>

      {error && (
        <div className="mb-4 px-4 py-2 bg-red-900/50 border border-red-700 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3 w-72">
        {keys.map((digit) => (
          <button
            key={digit}
            onClick={() => handleDigit(digit)}
            disabled={loading}
            className="h-20 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 active:scale-95 text-white text-2xl font-semibold transition-all duration-100 touch-manipulation disabled:opacity-50"
          >
            {digit}
          </button>
        ))}
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
