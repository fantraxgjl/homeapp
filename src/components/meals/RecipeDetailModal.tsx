"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import type { Recipe } from "@/types/meals";

interface RecipeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: Recipe;
  onDeleted?: () => void;
}

export function RecipeDetailModal({ isOpen, onClose, recipe, onDeleted }: RecipeDetailModalProps) {
  const [tab, setTab] = useState<"ingredients" | "steps">("ingredients");
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${recipe.title}"?`)) return;
    setDeleting(true);
    try {
      await fetch(`/api/recipes/${recipe.id}`, { method: "DELETE" });
      onDeleted?.();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl" title={recipe.title}>
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        {/* Meta row */}
        <div className="flex flex-wrap gap-3 text-sm text-slate-300">
          {recipe.cuisine && <span>📍 {recipe.cuisine}</span>}
          {recipe.servings && <span>👥 {recipe.servings} servings</span>}
          {recipe.cookTime && <span>⏱ {recipe.cookTime} min</span>}
          {recipe.mealType && (
            <span className="px-2 py-0.5 rounded-full bg-indigo-900/40 text-indigo-300 text-xs border border-indigo-700/30">
              {recipe.mealType.charAt(0) + recipe.mealType.slice(1).toLowerCase()}
            </span>
          )}
        </div>

        {/* Allergens */}
        {recipe.allergens && recipe.allergens.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {recipe.allergens.map((a) => (
              <span
                key={a}
                className="text-xs px-2 py-0.5 rounded-full bg-amber-900/40 text-amber-300 border border-amber-700/30"
              >
                {a}
              </span>
            ))}
          </div>
        )}

        {/* Nutrition */}
        {recipe.nutritionInfo && (
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(recipe.nutritionInfo).map(([k, v]) => (
              <div key={k} className="bg-slate-700/50 rounded-lg p-2 text-center">
                <p className="text-white text-sm font-bold">{v}</p>
                <p className="text-slate-400 text-xs capitalize">{k}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        {((recipe.ingredients && recipe.ingredients.length > 0) || (recipe.steps && recipe.steps.length > 0)) && (
          <>
            <div className="flex gap-2">
              {recipe.ingredients && recipe.ingredients.length > 0 && (
                <button
                  onClick={() => setTab("ingredients")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    tab === "ingredients" ? "bg-indigo-600 text-white" : "bg-slate-700 text-slate-300"
                  }`}
                >
                  Ingredients ({recipe.ingredients.length})
                </button>
              )}
              {recipe.steps && recipe.steps.length > 0 && (
                <button
                  onClick={() => setTab("steps")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    tab === "steps" ? "bg-indigo-600 text-white" : "bg-slate-700 text-slate-300"
                  }`}
                >
                  Instructions ({recipe.steps.length})
                </button>
              )}
            </div>

            {tab === "ingredients" && recipe.ingredients && (
              <ul className="space-y-2">
                {recipe.ingredients.map((ing) => (
                  <li key={ing.id} className="flex items-center gap-3 py-2 border-b border-slate-700 last:border-0">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                    <span className="text-white text-sm flex-1">{ing.name}</span>
                    {(ing.quantity || ing.unit) && (
                      <span className="text-slate-400 text-sm">
                        {ing.quantity}{ing.unit ? ` ${ing.unit}` : ""}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {tab === "steps" && recipe.steps && (
              <ol className="space-y-3">
                {recipe.steps.map((step) => (
                  <li key={step.id} className="flex gap-3">
                    <span className="min-w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {step.stepNumber}
                    </span>
                    <p className="text-slate-200 text-sm leading-relaxed">{step.instruction}</p>
                  </li>
                ))}
              </ol>
            )}
          </>
        )}

        {/* Source link */}
        {recipe.sourceUrl && (
          <p className="text-slate-500 text-xs">
            Source:{" "}
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 underline"
            >
              {new URL(recipe.sourceUrl).hostname}
            </a>
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2 border-t border-slate-700">
          <Button
            variant="ghost"
            onClick={handleDelete}
            disabled={deleting}
            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
          >
            {deleting ? "Deleting…" : "Delete recipe"}
          </Button>
          <Button onClick={onClose} className="flex-1">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
