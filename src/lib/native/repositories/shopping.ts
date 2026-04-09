import { query, run, uid, now } from "../db";

interface ShoppingRow {
  id: string; name: string; category: string; quantity: string | null;
  is_checked: number; meal_id: string | null; created_at: string; updated_at: string;
}

function toItem(r: ShoppingRow) {
  return {
    id: r.id, name: r.name, category: r.category, quantity: r.quantity,
    isChecked: !!r.is_checked, mealId: r.meal_id,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

export async function getAll() {
  const rows = await query<ShoppingRow>(
    "SELECT * FROM shopping_items ORDER BY is_checked ASC, category ASC, name ASC"
  );
  return rows.map(toItem);
}

export async function addItems(items: { name: string; category?: string; quantity?: string; mealId?: string }[]) {
  const ts = now();
  for (const item of items) {
    await run(
      `INSERT INTO shopping_items (id, name, category, quantity, is_checked, meal_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, 0, ?, ?, ?)`,
      [uid(), item.name, item.category ?? "Other", item.quantity ?? null, item.mealId ?? null, ts, ts]
    );
  }
  return getAll();
}

export async function update(id: string, data: Partial<{ isChecked: boolean; name: string; quantity: string; category: string }>) {
  const sets: string[] = []; const params: unknown[] = [];
  if (data.isChecked !== undefined) { sets.push("is_checked = ?"); params.push(data.isChecked ? 1 : 0); }
  if (data.name !== undefined)      { sets.push("name = ?");       params.push(data.name); }
  if (data.quantity !== undefined)  { sets.push("quantity = ?");   params.push(data.quantity || null); }
  if (data.category !== undefined)  { sets.push("category = ?");   params.push(data.category); }
  sets.push("updated_at = ?"); params.push(now()); params.push(id);
  await run(`UPDATE shopping_items SET ${sets.join(", ")} WHERE id = ?`, params);
}

export async function remove(id: string) {
  await run("DELETE FROM shopping_items WHERE id = ?", [id]);
}

export async function clearChecked() {
  await run("DELETE FROM shopping_items WHERE is_checked = 1");
}
