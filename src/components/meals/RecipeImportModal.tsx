"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { ExtractedRecipe } from "@/lib/recipe-extract";

interface RecipeImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void;
}

type Step = "input" | "preview" | "saving";

export function RecipeImportModal({ isOpen, onClose, onImported }: RecipeImportModalProps) {
  const [url, setUrl] = useState("");
  const [step, setStep] = useState<Step>("input");
  const [error, setError] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ExtractedRecipe | null>(null);

  async function handleExtract() {
    setError(null);
    setStep("input"); // reset while loading
    const trimmed = url.trim();
    if (!trimmed) return;

    setStep("saving"); // repurpose saving spinner for extract
    try {
      const res = await fetch("/api/recipes/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Extraction failed");
      }
      const data: ExtractedRecipe = await res.json();
      setExtracted(data);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Extraction failed");
      setStep("input");
    }
  }

  async function handleSave() {
    if (!extracted) return;
    setStep("saving");
    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...extracted,
          sourceUrl: url.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      onImported();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setStep("preview");
    }
  }

  function handleClose() {
    setUrl("");
    setStep("input");
    setError(null);
    setExtracted(null);
    onClose();
  }

  const isLoading = step === "saving";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import recipe from URL">
      <div className="space-y-4">
        {error && (
          <div className="px-4 py-3 bg-red-900/30 border border-red-700 rounded-xl text-red-300 text-sm">
            {error}
          </div>
        )}

        {step !== "preview" && (
          <>
            <div className="space-y-2">
              <label className="text-slate-300 text-sm">Recipe URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.example.com/recipes/pasta"
                className="w-full px-4 py-3 bg-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onKeyDown={(e) => e.key === "Enter" && handleExtract()}
                disabled={isLoading}
              />
            </div>
            <p className="text-slate-500 text-xs">
              Claude AI will extract the recipe ingredients and instructions from the page.
            </p>
            <Button
              onClick={handleExtract}
              disabled={!url.trim() || isLoading}
              className="w-full"
            >
              {isLoading ? "Extracting…" : "Extract recipe"}
            </Button>
          </>
        )}

        {step === "preview" && extracted && (
          <>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              <div>
                <p className="text-white font-semibold text-lg">{extracted.title}</p>
                <div className="flex flex-wrap gap-2 mt-1 text-sm text-slate-400">
                  {extracted.cuisine && <span>{extracted.cuisine}</span>}
                  {extracted.servings && <span>· {extracted.servings} servings</span>}
                  {extracted.cookTime && <span>· {extracted.cookTime} min</span>}
                </div>
              </div>

              {extracted.allergens.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {extracted.allergens.map((a) => (
                    <span key={a} className="text-xs px-2 py-0.5 bg-amber-900/40 text-amber-300 rounded-full border border-amber-700/30">
                      {a}
                    </span>
                  ))}
                </div>
              )}

              <div>
                <p className="text-slate-400 text-xs font-medium mb-1">
                  {extracted.ingredients.length} ingredients
                </p>
                <ul className="space-y-1">
                  {extracted.ingredients.slice(0, 5).map((ing, i) => (
                    <li key={i} className="text-slate-300 text-sm">
                      • {ing.name}{ing.quantity ? ` — ${ing.quantity}${ing.unit ? ` ${ing.unit}` : ""}` : ""}
                    </li>
                  ))}
                  {extracted.ingredients.length > 5 && (
                    <li className="text-slate-500 text-sm">
                      + {extracted.ingredients.length - 5} more
                    </li>
                  )}
                </ul>
              </div>

              <p className="text-slate-400 text-xs">{extracted.steps.length} instruction steps</p>
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep("input")} disabled={isLoading}>
                Back
              </Button>
              <Button onClick={handleSave} disabled={isLoading} className="flex-1">
                {isLoading ? "Saving…" : "Save recipe"}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
