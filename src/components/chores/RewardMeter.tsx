"use client";

import { ProgressRing } from "@/components/ui/ProgressRing";

interface RewardMeterProps {
  points: number;
  goal?: number;
  memberName: string;
  memberColor: string;
  memberEmoji: string;
  size?: "sm" | "lg";
}

export function RewardMeter({
  points,
  goal = 10,
  memberName,
  memberColor,
  memberEmoji,
  size = "lg",
}: RewardMeterProps) {
  const pct = Math.min(100, (points / goal) * 100);
  const stars = Math.floor(points / goal);
  const ringSize = size === "lg" ? 96 : 64;
  const strokeWidth = size === "lg" ? 8 : 6;

  return (
    <div className="flex flex-col items-center gap-2">
      <ProgressRing
        value={pct}
        size={ringSize}
        strokeWidth={strokeWidth}
        color={memberColor}
      >
        <span className="text-3xl">{memberEmoji}</span>
      </ProgressRing>
      <div className="text-center">
        <p
          className={`font-bold text-white ${size === "lg" ? "text-base" : "text-sm"}`}
        >
          {memberName}
        </p>
        <p className="text-slate-400 text-xs">
          {points} pts · {stars > 0 ? "⭐".repeat(Math.min(stars, 5)) : ""}
        </p>
      </div>
    </div>
  );
}
