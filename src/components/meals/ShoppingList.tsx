"use client";

import useSWR from "swr";
import { useState } from "react";
import { format, startOfWeek } from "date-fns";
import { Button } from "@/components/ui/Button";
import type { ShoppingItem as ShoppingItemType } from "@/types/meals";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function groupByCategory(items: ShoppingItemType[]) {
  const groups = new Map<string, ShoppingItemType[]>();
  for (const item of items) {
    const cat = item.category ?? "Other";
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(item);
  }
  return groups;
}

export function ShoppingList() {
  const [newItemName, setNewItemName] = useState("");
  const [adding, setAdding] = useState(false);
  const [generating, setGenerating] = useState(false);

  const { data: items, mutate } = useSWR<ShoppingItemType[]>(
    "/api/shopping",
    fetcher
  );

  async function handleAddItem() {
    if (!newItemName.trim()) return;
    setAdding(true);
    try {
      await fetch("/api/shopping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newItemName.trim() }),
      });
      setNewItemName("");
      mutate();
    } finally {
      setAdding(false);
    }
  }

  async function handleToggle(item: ShoppingItemType) {
    await fetch(`/api/shopping/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isChecked: !item.isChecked }),
    });
    mutate();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/shopping/${id}`, { method: "DELETE" });
    mutate();
  }

  async function handleClearChecked() {
    const checked = (items ?? []).filter((i) => i.isChecked);
    await Promise.all(checked.map((i) => fetch(`/api/shopping/${i.id}`, { method: "DELETE" })));
    mutate();
  }

  async function handleGenerateFromMealPlan() {
    setGenerating(true);
    try {
      const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
      const res = await fetch(`/api/shopping?fromMealPlan=${weekStart}`);
      const generated: Array<{ name: string; quantity: string | null; category: string | null }> = await res.json();

      if (generated.length === 0) {
        alert("No recipes linked in this week's meal plan. Add recipes to your meal plan first.");
        return;
      }

      await fetch("/api/shopping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          generated.map((g) => ({ name: g.name, quantity: g.quantity, category: g.category }))
        ),
      });
      mutate();
    } finally {
      setGenerating(false);
    }
  }

  const checkedCount = (items ?? []).filter((i) => i.isChecked).length;
  const groups = groupByCategory(items ?? []);

  return (
    <div className="space-y-5">
      {/* Add item input */}
      <div className="flex gap-3">
        <input
          type="text"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
          placeholder="Add item…"
          disabled={adding}
          className="flex-1 px-4 py-3 bg-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <Button onClick={handleAddItem} disabled={!newItemName.trim() || adding}>
          Add
        </Button>
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <Button
          variant="secondary"
          onClick={handleGenerateFromMealPlan}
          disabled={generating}
          className="text-sm"
        >
          {generating ? "Generating…" : "🗓️ Generate from this week"}
        </Button>
        {checkedCount > 0 && (
          <Button
            variant="ghost"
            onClick={handleClearChecked}
            className="text-sm text-slate-400"
          >
            Clear {checkedCount} checked
          </Button>
        )}
      </div>

      {/* List */}
      {!items ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 rounded-xl bg-slate-700/50 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p className="text-4xl mb-3">🛒</p>
          <p>Your shopping list is empty</p>
        </div>
      ) : (
        <div className="space-y-5">
          {Array.from(groups.entries()).map(([category, catItems]) => (
            <div key={category}>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
                {category}
              </p>
              <div className="space-y-1">
                {catItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-4 py-3 bg-slate-800 rounded-xl border border-slate-700"
                  >
                    <button
                      onClick={() => handleToggle(item)}
                      className={`min-w-6 min-h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        item.isChecked
                          ? "bg-emerald-500 border-emerald-500"
                          : "border-slate-500 hover:border-emerald-400"
                      }`}
                    >
                      {item.isChecked && <span className="text-white text-xs">✓</span>}
                    </button>
                    <span
                      className={`flex-1 text-sm ${
                        item.isChecked ? "line-through text-slate-500" : "text-white"
                      }`}
                    >
                      {item.name}
                    </span>
                    {item.quantity && (
                      <span className="text-slate-400 text-xs">{item.quantity}</span>
                    )}
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-slate-600 hover:text-red-400 transition-colors text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
