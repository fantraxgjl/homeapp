"use client";

import { useState } from "react";
import { MealModal } from "./MealModal";
import type { Meal, MealType } from "@/types/meals";

interface MealCellProps {
  date: string;
  mealType: MealType;
  weekStart: string;
  meal?: Meal | null;
  readonly?: boolean;
  onChanged: () => void;
}

const MEAL_COLORS: Record<MealType, string> = {
  BREAKFAST: "bg-amber-500/15 border-amber-500/30 hover:border-amber-500/60",
  LUNCH:     "bg-sky-500/15 border-sky-500/30 hover:border-sky-500/60",
  DINNER:    "bg-violet-500/15 border-violet-500/30 hover:border-violet-500/60",
  SNACK:     "bg-emerald-500/15 border-emerald-500/30 hover:border-emerald-500/60",
};

export function MealCell({ date, mealType, weekStart, meal, readonly = false, onChanged }: MealCellProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const colorClass = MEAL_COLORS[mealType];

  return (
    <>
      <button
        onClick={() => !readonly && setModalOpen(true)}
        className={`w-full min-h-[56px] rounded-xl border text-left px-3 py-2 transition-all ${colorClass} ${
          readonly ? "cursor-default" : "cursor-pointer"
        } ${!meal ? "border-dashed opacity-60 hover:opacity-80" : ""}`}
      >
        {meal ? (
          <div className="space-y-0.5">
            <p className="text-white text-xs font-medium leading-tight line-clamp-2">
              {meal.emoji && <span className="mr-1">{meal.emoji}</span>}
              {meal.title}
            </p>
            {meal.recipe?.cuisine && (
              <p className="text-slate-400 text-[10px]">{meal.recipe.cuisine}</p>
            )}
          </div>
        ) : (
          <span className="text-slate-500 text-xs">+ Add</span>
        )}
      </button>

      {!readonly && (
        <MealModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          dayDate={date}
          mealType={mealType}
          weekStart={weekStart}
          existingTitle={meal?.title}
          existingRecipeId={meal?.recipeId}
          mealId={meal?.id}
          onSaved={onChanged}
        />
      )}
    </>
  );
}
