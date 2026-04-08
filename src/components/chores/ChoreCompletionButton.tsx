"use client";

import { useState } from "react";
import { ChoreIcon } from "./ChoreIcon";

interface ChoreCompletionButtonProps {
  choreId: string;
  choreTitle: string;
  iconName: string;
  memberId: string;
  memberEmoji: string;
  memberColor: string;
  isCompleted: boolean;
  points: number;
  onComplete?: (pointsEarned: number, weeklyTotal: number) => void;
}

export function ChoreCompletionButton({
  choreId,
  choreTitle,
  iconName,
  memberId,
  memberEmoji,
  memberColor,
  isCompleted: initialCompleted,
  points,
  onComplete,
}: ChoreCompletionButtonProps) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [loading, setLoading] = useState(false);
  const [justDone, setJustDone] = useState(false);

  const handleTap = async () => {
    if (completed || loading) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/chores/${choreId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });
      const data = await res.json();

      if (data.success || data.alreadyCompleted) {
        setCompleted(true);
        setJustDone(true);

        // Trigger confetti
        if (!data.alreadyCompleted) {
          const confetti = (await import("canvas-confetti")).default;
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: [memberColor, "#fbbf24", "#34d399", "#f472b6"],
          });
          onComplete?.(data.pointsEarned, data.weeklyTotal);
        }

        // Reset "just done" glow after 3s
        setTimeout(() => setJustDone(false), 3000);
      }
    } catch {
      // silent fail — optimistic state already set
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleTap}
      disabled={completed || loading}
      className={`
        relative w-full rounded-2xl p-5 flex items-center gap-4
        transition-all duration-300 touch-manipulation select-none
        ${
          completed
            ? "bg-emerald-900/40 border-2 border-emerald-600/60 cursor-default"
            : "bg-slate-800 border-2 border-slate-700 hover:border-slate-500 active:scale-95"
        }
        ${justDone ? "shadow-lg shadow-emerald-500/30" : ""}
      `}
      aria-label={`${completed ? "Completed" : "Complete"}: ${choreTitle}`}
    >
      {/* Icon */}
      <div
        className={`
          flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center
          transition-all duration-300
          ${completed ? "bg-emerald-800/40" : "bg-slate-700"}
        `}
      >
        {completed ? (
          <span className="text-3xl">✅</span>
        ) : (
          <ChoreIcon name={iconName} size={36} />
        )}
      </div>

      {/* Text */}
      <div className="flex-1 text-left">
        <p
          className={`text-lg font-semibold ${
            completed ? "text-emerald-400 line-through" : "text-white"
          }`}
        >
          {choreTitle}
        </p>
        <p className="text-sm text-slate-400 mt-0.5">
          {completed ? "Done! Great job! 🎉" : `+${points} star${points !== 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Member indicator */}
      <div
        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl"
        style={{ backgroundColor: memberColor + "33", border: `2px solid ${memberColor}` }}
      >
        {memberEmoji}
      </div>

      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800/50 rounded-2xl">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </button>
  );
}
