"use client";

import useSWR from "swr";
import { useState } from "react";
import { RecipeCard } from "./RecipeCard";
import { RecipeImportModal } from "./RecipeImportModal";
import { Button } from "@/components/ui/Button";
import type { Recipe, MealType } from "@/types/meals";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const MEAL_TYPE_FILTERS: Array<{ label: string; value: MealType | "" }> = [
  { label: "All", value: "" },
  { label: "Breakfast", value: "BREAKFAST" },
  { label: "Lunch", value: "LUNCH" },
  { label: "Dinner", value: "DINNER" },
  { label: "Snack", value: "SNACK" },
];

export function RecipeGrid() {
  const [mealTypeFilter, setMealTypeFilter] = useState<MealType | "">("");
  const [searchQuery, setSearchQuery] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const params = new URLSearchParams();
  if (mealTypeFilter) params.set("mealType", mealTypeFilter);
  if (debouncedQuery) params.set("q", debouncedQuery);

  const { data: recipes, mutate } = useSWR<Recipe[]>(
    `/api/recipes?${params.toString()}`,
    fetcher
  );

  let searchTimeout: ReturnType<typeof setTimeout>;
  function handleSearch(q: string) {
    setSearchQuery(q);
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => setDebouncedQuery(q), 300);
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search recipes…"
          className="flex-1 min-w-48 px-4 py-2.5 bg-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />
        <Button onClick={() => setImportOpen(true)} className="shrink-0">
          + Import from URL
        </Button>
      </div>

      {/* Meal type filter chips */}
      <div className="flex gap-2 flex-wrap">
        {MEAL_TYPE_FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setMealTypeFilter(value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              mealTypeFilter === value
                ? "bg-indigo-600 text-white"
                : "bg-slate-700 text-slate-300 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Recipe grid */}
      {!recipes ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-700/50 animate-pulse" />
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p className="text-4xl mb-3">🍽️</p>
          <p className="font-medium">No recipes yet</p>
          <p className="text-sm mt-1">Import one from a URL to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} onDeleted={() => mutate()} />
          ))}
        </div>
      )}

      <RecipeImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={() => { setImportOpen(false); mutate(); }}
      />
    </div>
  );
}
