"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { RecipeDetailModal } from "./RecipeDetailModal";
import type { Recipe } from "@/types/meals";

interface RecipeCardProps {
  recipe: Recipe;
  onDeleted?: () => void;
}

const CUISINE_EMOJIS: Record<string, string> = {
  italian: "🍝",
  mexican: "🌮",
  japanese: "🍱",
  chinese: "🥢",
  indian: "🍛",
  american: "🍔",
  french: "🥐",
  thai: "🍜",
  greek: "🫒",
  spanish: "🥘",
};

function cuisineEmoji(cuisine: string | null) {
  if (!cuisine) return "🍽️";
  return CUISINE_EMOJIS[cuisine.toLowerCase()] ?? "🍽️";
}

export function RecipeCard({ recipe, onDeleted }: RecipeCardProps) {
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setDetailOpen(true)}
        className="w-full text-left"
      >
        <Card
          variant="bordered"
          className="h-full hover:border-indigo-500/50 hover:bg-slate-750 transition-all active:scale-[0.98]"
        >
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <span className="text-2xl">{cuisineEmoji(recipe.cuisine)}</span>
              {recipe.cookTime && (
                <span className="text-slate-400 text-xs shrink-0">⏱ {recipe.cookTime}m</span>
              )}
            </div>
            <p className="text-white font-semibold text-sm leading-tight line-clamp-2">
              {recipe.title}
            </p>
            {recipe.cuisine && (
              <p className="text-slate-400 text-xs">{recipe.cuisine}</p>
            )}
            {recipe.allergens && recipe.allergens.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {recipe.allergens.slice(0, 3).map((a) => (
                  <span key={a} className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-900/40 text-amber-300 border border-amber-700/30">
                    {a}
                  </span>
                ))}
                {recipe.allergens.length > 3 && (
                  <span className="text-[10px] text-slate-500">+{recipe.allergens.length - 3}</span>
                )}
              </div>
            )}
          </div>
        </Card>
      </button>

      <RecipeDetailModal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        recipe={recipe}
        onDeleted={() => { setDetailOpen(false); onDeleted?.(); }}
      />
    </>
  );
}
