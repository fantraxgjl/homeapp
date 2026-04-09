import { query, run, uid, now } from "../db";

interface RecipeRow {
  id: string; title: string; cuisine: string | null; meal_type: string | null;
  servings: number | null; cook_time: number | null; source_url: string | null;
  image_url: string | null; allergens: string | null; nutrition_info: string | null;
  created_at: string; updated_at: string;
}
interface IngredientRow { id: string; recipe_id: string; name: string; quantity: string | null; unit: string | null; sort_order: number; }
interface StepRow { id: string; recipe_id: string; step_number: number; instruction: string; }

function toRecipe(r: RecipeRow, ingredients: IngredientRow[] = [], steps: StepRow[] = []) {
  return {
    id: r.id, title: r.title, cuisine: r.cuisine, mealType: r.meal_type,
    servings: r.servings, cookTime: r.cook_time, sourceUrl: r.source_url,
    imageUrl: r.image_url,
    allergens: r.allergens ? JSON.parse(r.allergens) : [],
    nutritionInfo: r.nutrition_info ? JSON.parse(r.nutrition_info) : null,
    createdAt: r.created_at, updatedAt: r.updated_at,
    ingredients: ingredients.map((i) => ({ id: i.id, name: i.name, quantity: i.quantity, unit: i.unit, sortOrder: i.sort_order })),
    steps: steps.map((s) => ({ id: s.id, stepNumber: s.step_number, instruction: s.instruction })),
  };
}

export async function getAll(filters?: { mealType?: string; cuisine?: string; q?: string; allergen?: string }) {
  let sql = "SELECT * FROM recipes";
  const params: unknown[] = [];
  const where: string[] = [];
  if (filters?.mealType) { where.push("meal_type = ?"); params.push(filters.mealType); }
  if (filters?.cuisine)  { where.push("cuisine = ?");   params.push(filters.cuisine); }
  if (filters?.q)        { where.push("title LIKE ?");  params.push(`%${filters.q}%`); }
  if (filters?.allergen) { where.push("allergens LIKE ?"); params.push(`%${filters.allergen}%`); }
  if (where.length) sql += " WHERE " + where.join(" AND ");
  sql += " ORDER BY created_at DESC";
  const rows = await query<RecipeRow>(sql, params);
  return rows.map((r) => toRecipe(r));
}

export async function getById(id: string) {
  const rows = await query<RecipeRow>("SELECT * FROM recipes WHERE id = ?", [id]);
  if (!rows[0]) return null;
  const ingredients = await query<IngredientRow>(
    "SELECT * FROM ingredients WHERE recipe_id = ? ORDER BY sort_order ASC", [id]
  );
  const steps = await query<StepRow>(
    "SELECT * FROM recipe_steps WHERE recipe_id = ? ORDER BY step_number ASC", [id]
  );
  return toRecipe(rows[0], ingredients, steps);
}

export async function create(data: {
  title: string; cuisine?: string; mealType?: string; servings?: number; cookTime?: number;
  sourceUrl?: string; imageUrl?: string; allergens?: string[]; nutritionInfo?: unknown;
  ingredients?: { name: string; quantity?: string; unit?: string }[];
  steps?: { stepNumber: number; instruction: string }[];
}) {
  const id = uid(); const ts = now();
  await run(
    `INSERT INTO recipes (id, title, cuisine, meal_type, servings, cook_time, source_url, image_url, allergens, nutrition_info, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.title, data.cuisine ?? null, data.mealType ?? null, data.servings ?? null,
     data.cookTime ?? null, data.sourceUrl ?? null, data.imageUrl ?? null,
     data.allergens ? JSON.stringify(data.allergens) : null,
     data.nutritionInfo ? JSON.stringify(data.nutritionInfo) : null, ts, ts]
  );
  if (data.ingredients?.length) {
    for (let i = 0; i < data.ingredients.length; i++) {
      const ing = data.ingredients[i];
      await run(
        "INSERT INTO ingredients (id, recipe_id, name, quantity, unit, sort_order) VALUES (?, ?, ?, ?, ?, ?)",
        [uid(), id, ing.name, ing.quantity ?? null, ing.unit ?? null, i]
      );
    }
  }
  if (data.steps?.length) {
    for (const step of data.steps) {
      await run(
        "INSERT INTO recipe_steps (id, recipe_id, step_number, instruction) VALUES (?, ?, ?, ?)",
        [uid(), id, step.stepNumber, step.instruction]
      );
    }
  }
  return (await getById(id))!;
}

export async function remove(id: string) {
  await run("DELETE FROM recipes WHERE id = ?", [id]);
}
