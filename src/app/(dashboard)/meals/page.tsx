"use client";

import { useState } from "react";
import { WeeklyMealGrid } from "@/components/meals/WeeklyMealGrid";
import { RecipeGrid } from "@/components/meals/RecipeGrid";

export default function MealsPage() {
  const [tab, setTab] = useState<"planner" | "recipes">("planner");

  return (
    <div className="h-full flex flex-col">
      {/* Tab bar */}
      <div className="flex gap-1 p-4 pb-0">
        <button
          onClick={() => setTab("planner")}
          className={`px-5 py-2.5 rounded-t-xl text-sm font-semibold transition-colors ${
            tab === "planner"
              ? "bg-slate-800 text-white"
              : "text-slate-400 hover:text-white"
          }`}
        >
          🗓️ Meal Planner
        </button>
        <button
          onClick={() => setTab("recipes")}
          className={`px-5 py-2.5 rounded-t-xl text-sm font-semibold transition-colors ${
            tab === "recipes"
              ? "bg-slate-800 text-white"
              : "text-slate-400 hover:text-white"
          }`}
        >
          📖 Recipe Book
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-slate-800 rounded-2xl mx-4 mb-4">
        {tab === "planner" ? <WeeklyMealGrid /> : <RecipeGrid />}
      </div>
    </div>
  );
}
