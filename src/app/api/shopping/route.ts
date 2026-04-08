import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { startOfDay, addDays, parseISO } from "date-fns";

// GET /api/shopping  — returns all items, most recently added first
// GET /api/shopping?fromMealPlan=2026-04-07  — auto-generate from recipe ingredients for the week
export async function GET(req: NextRequest) {
  const fromMealPlan = req.nextUrl.searchParams.get("fromMealPlan");

  if (fromMealPlan) {
    return NextResponse.json(await generateFromMealPlan(fromMealPlan));
  }

  const items = await prisma.shoppingItem.findMany({
    orderBy: [{ isChecked: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(
    items.map((i) => ({ ...i, createdAt: i.createdAt.toISOString() }))
  );
}

// POST /api/shopping — add one or more items manually
export async function POST(req: NextRequest) {
  const body = await req.json();

  // Support array or single item
  const items: Array<{ name: string; category?: string; quantity?: string; mealId?: string }> =
    Array.isArray(body) ? body : [body];

  if (items.length === 0 || !items[0].name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const created = await prisma.$transaction(
    items.map((item) =>
      prisma.shoppingItem.create({
        data: {
          name: item.name,
          category: item.category ?? null,
          quantity: item.quantity ?? null,
          mealId: item.mealId ?? null,
        },
      })
    )
  );

  return NextResponse.json(
    created.map((i) => ({ ...i, createdAt: i.createdAt.toISOString() })),
    { status: 201 }
  );
}

/** Generate shopping list from recipe ingredients in a meal plan week */
async function generateFromMealPlan(weekStartStr: string) {
  const weekStart = startOfDay(parseISO(weekStartStr));
  const weekEnd = addDays(weekStart, 7);

  // Get all meals with linked recipes for the week
  const plan = await prisma.mealPlan.findFirst({
    where: { weekStart },
    include: {
      days: {
        include: {
          meals: {
            where: { recipeId: { not: null } },
            include: {
              recipe: {
                include: {
                  ingredients: { orderBy: { sortOrder: "asc" } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!plan) return [];

  // Aggregate ingredients across all recipes
  const ingredientMap = new Map<
    string,
    { name: string; quantity: string | null; unit: string | null; category: string | null; sourceRecipes: string[] }
  >();

  for (const day of plan.days) {
    for (const meal of day.meals) {
      if (!meal.recipe) continue;
      for (const ing of meal.recipe.ingredients) {
        const key = ing.name.toLowerCase().trim();
        if (ingredientMap.has(key)) {
          ingredientMap.get(key)!.sourceRecipes.push(meal.recipe.title);
        } else {
          ingredientMap.set(key, {
            name: ing.name,
            quantity: ing.quantity,
            unit: ing.unit,
            category: null,
            sourceRecipes: [meal.recipe.title],
          });
        }
      }
    }
  }

  return Array.from(ingredientMap.values()).map((item, i) => ({
    id: `generated-${i}`,
    name: item.name,
    category: item.category,
    quantity: item.quantity ? `${item.quantity}${item.unit ? ` ${item.unit}` : ""}` : null,
    isChecked: false,
    mealId: null,
    addedById: null,
    createdAt: new Date().toISOString(),
    sourceRecipes: item.sourceRecipes,
  }));
}
