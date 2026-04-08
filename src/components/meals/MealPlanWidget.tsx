"use client";

import useSWR from "swr";
import { format, startOfWeek } from "date-fns";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import type { MealPlanWeek, MealType } from "@/types/meals";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const MEAL_TYPES: MealType[] = ["BREAKFAST", "LUNCH", "DINNER"];

const MEAL_TYPE_EMOJI: Record<MealType, string> = {
  BREAKFAST: "🌅",
  LUNCH: "☀️",
  DINNER: "🌙",
  SNACK: "🍎",
};

export function MealPlanWidget() {
  const today = new Date();
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");

  const { data } = useSWR<MealPlanWeek>(
    `/api/meals?weekStart=${weekStart}`,
    fetcher,
    { refreshInterval: 300_000 }
  );

  const todayStr = format(today, "yyyy-MM-dd");
  const tomorrowStr = format(new Date(today.getTime() + 86400000), "yyyy-MM-dd");

  const todayDay = data?.days.find(
    (d) => format(new Date(d.date), "yyyy-MM-dd") === todayStr
  );
  const tomorrowDay = data?.days.find(
    (d) => format(new Date(d.date), "yyyy-MM-dd") === tomorrowStr
  );

  const hasMeals = todayDay?.meals.length || tomorrowDay?.meals.length;

  return (
    <Link href="/meals" className="block">
      <Card variant="elevated" className="h-full hover:border-slate-600 border border-transparent transition-colors">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold text-sm">Meals</h3>
          <span className="text-slate-500 text-xs">›</span>
        </div>

        {!hasMeals ? (
          <p className="text-slate-500 text-sm">No meals planned</p>
        ) : (
          <div className="space-y-3">
            {[
              { label: "Today", day: todayDay },
              { label: "Tomorrow", day: tomorrowDay },
            ].map(({ label, day }) => (
              <div key={label}>
                <p className="text-slate-500 text-xs font-medium mb-1">{label}</p>
                {!day || day.meals.length === 0 ? (
                  <p className="text-slate-600 text-xs italic">Nothing planned</p>
                ) : (
                  <div className="space-y-1">
                    {MEAL_TYPES.map((mt) => {
                      const meal = day.meals.find((m) => m.mealType === mt);
                      if (!meal) return null;
                      return (
                        <div key={mt} className="flex items-center gap-2">
                          <span className="text-sm">{MEAL_TYPE_EMOJI[mt]}</span>
                          <span className="text-white text-xs truncate">{meal.title}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </Link>
  );
}
