"use client";

import { useState, useCallback } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { Recipe, MealType } from "@/types/meals";

interface MealModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayDate: string; // ISO date string
  mealType: MealType;
  weekStart: string;
  existingTitle?: string;
  existingRecipeId?: string | null;
  mealId?: string | null;
  onSaved: () => void;
}

const MEAL_EMOJIS: Record<MealType, string> = {
  BREAKFAST: "🌅",
  LUNCH: "☀️",
  DINNER: "🌙",
  SNACK: "🍎",
};

export function MealModal({
  isOpen,
  onClose,
  dayDate,
  mealType,
  weekStart,
  existingTitle = "",
  existingRecipeId = null,
  mealId = null,
  onSaved,
}: MealModalProps) {
  const [title, setTitle] = useState(existingTitle);
  const [recipeSearch, setRecipeSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"freetext" | "recipe">(existingRecipeId ? "recipe" : "freetext");

  const searchRecipes = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/recipes?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults(data);
    } finally {
      setSearching(false);
    }
  }, []);

  async function handleSave() {
    const finalTitle = tab === "recipe" && selectedRecipe ? selectedRecipe.title : title.trim();
    if (!finalTitle) return;
    setSaving(true);
    try {
      const body = {
        weekStart,
        dayDate,
        mealType,
        title: finalTitle,
        emoji: MEAL_EMOJIS[mealType],
        recipeId: tab === "recipe" ? (selectedRecipe?.id ?? existingRecipeId ?? null) : null,
      };
      if (mealId) {
        await fetch(`/api/meals/${mealId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: finalTitle, recipeId: body.recipeId }),
        });
      } else {
        await fetch("/api/meals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!mealId) return;
    setSaving(true);
    try {
      await fetch(`/api/meals/${mealId}`, { method: "DELETE" });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${MEAL_EMOJIS[mealType]} ${mealType.charAt(0) + mealType.slice(1).toLowerCase()}`}
    >
      <div className="space-y-4">
        {/* Tab switcher */}
        <div className="flex gap-2">
          <button
            onClick={() => setTab("freetext")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "freetext"
                ? "bg-indigo-600 text-white"
                : "bg-slate-700 text-slate-300 hover:text-white"
            }`}
          >
            Free text
          </button>
          <button
            onClick={() => setTab("recipe")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "recipe"
                ? "bg-indigo-600 text-white"
                : "bg-slate-700 text-slate-300 hover:text-white"
            }`}
          >
            From recipe book
          </button>
        </div>

        {tab === "freetext" ? (
          <input
            autoFocus
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Pasta carbonara"
            className="w-full px-4 py-3 bg-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
        ) : (
          <div className="space-y-2">
            <input
              autoFocus
              type="text"
              value={recipeSearch}
              onChange={(e) => {
                setRecipeSearch(e.target.value);
                searchRecipes(e.target.value);
              }}
              placeholder="Search recipes…"
              className="w-full px-4 py-3 bg-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searching && <p className="text-sm text-slate-400">Searching…</p>}
            {searchResults.length > 0 && (
              <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-600 divide-y divide-slate-700">
                {searchResults.map((recipe) => (
                  <button
                    key={recipe.id}
                    onClick={() => { setSelectedRecipe(recipe); setRecipeSearch(recipe.title); setSearchResults([]); }}
                    className="w-full px-4 py-3 text-left hover:bg-slate-700 transition-colors"
                  >
                    <p className="text-white text-sm font-medium">{recipe.title}</p>
                    {recipe.cuisine && (
                      <p className="text-slate-400 text-xs">{recipe.cuisine}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
            {selectedRecipe && (
              <div className="px-4 py-3 bg-indigo-900/30 border border-indigo-700 rounded-xl">
                <p className="text-indigo-300 text-sm font-medium">✓ {selectedRecipe.title}</p>
                {selectedRecipe.cookTime && (
                  <p className="text-slate-400 text-xs mt-0.5">⏱ {selectedRecipe.cookTime} min</p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          {mealId && (
            <Button
              variant="ghost"
              onClick={handleDelete}
              disabled={saving}
              className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
            >
              Remove
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={saving || (tab === "freetext" ? !title.trim() : !selectedRecipe && !existingRecipeId)}
            className="flex-1"
          >
            {saving ? "Saving…" : mealId ? "Update" : "Add meal"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
