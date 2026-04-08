"use client";

import { useEffect, useState } from "react";
import { ChoreIcon } from "./ChoreIcon";
import Link from "next/link";

interface ChoreItem {
  choreId: string;
  title: string;
  iconName: string;
  memberName: string;
  memberEmoji: string;
  memberColor: string;
  isCompleted: boolean;
}

export function ChoreSummaryWidget() {
  const [chores, setChores] = useState<ChoreItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/chores?forToday=1")
      .then((r) => r.json())
      .then((data) => setChores(Array.isArray(data) ? data : []))
      .catch(() => setChores([]))
      .finally(() => setLoading(false));
  }, []);

  const total = chores.length;
  const done = chores.filter((c) => c.isCompleted).length;

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Chores Today
        </h2>
        {total > 0 && (
          <span className="text-xs text-slate-500">
            {done}/{total}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : total === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-600 text-sm text-center">No chores today</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-1.5 overflow-hidden">
          {/* Progress bar */}
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${(done / total) * 100}%` }}
            />
          </div>

          {/* Chore list (first 5) */}
          <div className="flex flex-col gap-1 mt-1 overflow-hidden">
            {chores.slice(0, 5).map((chore) => (
              <div
                key={`${chore.choreId}-${chore.memberName}`}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all ${
                  chore.isCompleted ? "opacity-50" : ""
                }`}
              >
                <ChoreIcon name={chore.iconName} size={20} />
                <span
                  className={`text-sm flex-1 truncate ${
                    chore.isCompleted
                      ? "line-through text-slate-500"
                      : "text-slate-200"
                  }`}
                >
                  {chore.title}
                </span>
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: chore.memberColor + "33",
                    color: chore.memberColor,
                  }}
                >
                  {chore.memberEmoji}
                </span>
              </div>
            ))}
            {total > 5 && (
              <p className="text-xs text-slate-600 pl-2">+{total - 5} more</p>
            )}
          </div>
        </div>
      )}

      <Link
        href="/chores"
        className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors mt-auto"
      >
        Manage chores →
      </Link>
    </div>
  );
}
