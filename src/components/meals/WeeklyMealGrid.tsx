"use client";

import useSWR from "swr";
import { format, startOfWeek, addDays, addWeeks, subWeeks } from "date-fns";
import { useState } from "react";
import { MealCell } from "./MealCell";
import type { MealPlanWeek, MealType } from "@/types/meals";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const MEAL_TYPES: MealType[] = ["BREAKFAST", "LUNCH", "DINNER"];

const MEAL_LABELS: Record<MealType, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
  SNACK: "Snack",
};

function toWeekStartStr(date: Date) {
  return format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");
}

export function WeeklyMealGrid() {
  const [weekOffset, setWeekOffset] = useState(0);
  const baseWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekStart = addWeeks(baseWeek, weekOffset);
  const weekStartStr = toWeekStartStr(weekStart);

  const { data, mutate } = useSWR<MealPlanWeek>(
    `/api/meals?weekStart=${weekStartStr}`,
    fetcher,
    { refreshInterval: 60_000 }
  );

  const days = data?.days ?? Array.from({ length: 7 }, (_, i) => ({
    id: null,
    planId: null,
    date: addDays(weekStart, i).toISOString(),
    dayOfWeek: i,
    meals: [],
  }));

  return (
    <div className="space-y-4">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setWeekOffset((o) => o - 1)}
          className="min-h-10 min-w-10 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
        >
          ‹
        </button>
        <div className="text-center">
          <p className="text-white font-semibold">
            {format(weekStart, "d MMM")} – {format(addDays(weekStart, 6), "d MMM yyyy")}
          </p>
          {weekOffset === 0 && <p className="text-slate-400 text-xs">This week</p>}
          {weekOffset === 1 && <p className="text-slate-400 text-xs">Next week</p>}
          {weekOffset === -1 && <p className="text-slate-400 text-xs">Last week</p>}
        </div>
        <button
          onClick={() => setWeekOffset((o) => o + 1)}
          className="min-h-10 min-w-10 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
        >
          ›
        </button>
      </div>

      {/* Grid: rows = meal types, cols = days */}
      <div className="overflow-x-auto">
        <table className="w-full border-separate" style={{ borderSpacing: "4px" }}>
          <thead>
            <tr>
              <th className="w-20 text-slate-500 text-xs font-medium text-right pr-2"></th>
              {days.map((day) => {
                const date = new Date(day.date);
                const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                return (
                  <th key={day.date} className="text-center min-w-[100px]">
                    <div className={`rounded-lg py-1 px-2 ${isToday ? "bg-indigo-600" : ""}`}>
                      <p className={`text-xs font-semibold ${isToday ? "text-white" : "text-slate-300"}`}>
                        {format(date, "EEE")}
                      </p>
                      <p className={`text-sm font-bold ${isToday ? "text-white" : "text-slate-400"}`}>
                        {format(date, "d")}
                      </p>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {MEAL_TYPES.map((mealType) => (
              <tr key={mealType}>
                <td className="text-right pr-2">
                  <span className="text-slate-500 text-xs font-medium">{MEAL_LABELS[mealType]}</span>
                </td>
                {days.map((day) => {
                  const meal = day.meals.find((m) => m.mealType === mealType) ?? null;
                  return (
                    <td key={`${day.date}-${mealType}`} className="align-top">
                      <MealCell
                        date={format(new Date(day.date), "yyyy-MM-dd")}
                        mealType={mealType}
                        weekStart={weekStartStr}
                        meal={meal}
                        onChanged={() => mutate()}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
