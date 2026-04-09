import { query, run, uid, now } from "../db";

export async function getMealPlan(weekStart: string) {
  // Ensure plan exists
  let plans = await query<{ id: string }>(
    "SELECT id FROM meal_plans WHERE week_start = ?", [weekStart]
  );
  let planId: string;
  if (plans.length === 0) {
    planId = uid();
    await run(
      "INSERT INTO meal_plans (id, week_start, created_at) VALUES (?, ?, ?)",
      [planId, weekStart, now()]
    );
  } else {
    planId = plans[0].id;
  }

  // Build 7-day shell
  const days: { date: string; id: string }[] = [];
  const start = new Date(weekStart + "T00:00:00Z");
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    let dayRows = await query<{ id: string }>(
      "SELECT id FROM meal_days WHERE plan_id = ? AND date = ?", [planId, dateStr]
    );
    let dayId: string;
    if (dayRows.length === 0) {
      dayId = uid();
      await run(
        "INSERT INTO meal_days (id, plan_id, date, created_at) VALUES (?, ?, ?, ?)",
        [dayId, planId, dateStr, now()]
      );
    } else {
      dayId = dayRows[0].id;
    }
    days.push({ date: dateStr, id: dayId });
  }

  // Load meals for all days
  const dayIds = days.map((d) => d.id);
  const meals = dayIds.length
    ? await query<{
        id: string; day_id: string; meal_type: string; title: string;
        emoji: string | null; image_url: string | null; recipe_url: string | null;
        recipe_id: string | null; servings: number | null; created_at: string; updated_at: string;
      }>(`SELECT * FROM meals WHERE day_id IN (${dayIds.map(() => "?").join(",")})`, dayIds)
    : [];

  return {
    id: planId,
    weekStart,
    days: days.map((d) => ({
      id: d.id,
      date: d.date,
      meals: meals
        .filter((m) => m.day_id === d.id)
        .map((m) => ({
          id: m.id, dayId: m.day_id, mealType: m.meal_type, title: m.title,
          emoji: m.emoji, imageUrl: m.image_url, recipeUrl: m.recipe_url,
          recipeId: m.recipe_id, servings: m.servings,
        })),
    })),
  };
}

export async function upsertMeal(data: {
  weekStart: string; date: string; mealType: string; title: string;
  emoji?: string; recipeUrl?: string; recipeId?: string; servings?: number;
}) {
  const plan = await getMealPlan(data.weekStart);
  const day = plan.days.find((d) => d.date === data.date);
  if (!day) throw new Error("Day not found");

  const existing = day.meals.find((m) => m.mealType === data.mealType);
  const ts = now();

  if (existing) {
    await run(
      `UPDATE meals SET title=?, emoji=?, recipe_url=?, recipe_id=?, servings=?, updated_at=? WHERE id=?`,
      [data.title, data.emoji ?? null, data.recipeUrl ?? null,
       data.recipeId ?? null, data.servings ?? null, ts, existing.id]
    );
    return { ...existing, title: data.title };
  } else {
    const id = uid();
    await run(
      `INSERT INTO meals (id, day_id, meal_type, title, emoji, recipe_url, recipe_id, servings, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, day.id, data.mealType, data.title, data.emoji ?? null,
       data.recipeUrl ?? null, data.recipeId ?? null, data.servings ?? null, ts, ts]
    );
    return { id, dayId: day.id, mealType: data.mealType, title: data.title };
  }
}

export async function updateMeal(id: string, data: Partial<{
  title: string; emoji: string; recipeUrl: string; recipeId: string; servings: number;
}>) {
  const sets: string[] = []; const params: unknown[] = [];
  if (data.title !== undefined)     { sets.push("title = ?");      params.push(data.title); }
  if (data.emoji !== undefined)     { sets.push("emoji = ?");      params.push(data.emoji); }
  if (data.recipeUrl !== undefined) { sets.push("recipe_url = ?"); params.push(data.recipeUrl || null); }
  if (data.recipeId !== undefined)  { sets.push("recipe_id = ?");  params.push(data.recipeId || null); }
  if (data.servings !== undefined)  { sets.push("servings = ?");   params.push(data.servings); }
  sets.push("updated_at = ?"); params.push(now()); params.push(id);
  await run(`UPDATE meals SET ${sets.join(", ")} WHERE id = ?`, params);
}

export async function deleteMeal(id: string) {
  await run("DELETE FROM meals WHERE id = ?", [id]);
}
