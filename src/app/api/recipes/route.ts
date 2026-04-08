import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/recipes?mealType=DINNER&cuisine=Italian&allergen=gluten
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const mealType = searchParams.get("mealType") as string | null;
  const cuisine = searchParams.get("cuisine");
  const allergen = searchParams.get("allergen");
  const q = searchParams.get("q");

  const recipes = await prisma.recipe.findMany({
    where: {
      ...(mealType ? { mealType: mealType as "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK" } : {}),
      ...(cuisine ? { cuisine: { contains: cuisine } } : {}),
      ...(allergen ? { allergens: { contains: allergen } } : {}),
      ...(q ? { title: { contains: q } } : {}),
    },
    include: {
      ingredients: { orderBy: { sortOrder: "asc" } },
      steps: { orderBy: { stepNumber: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    recipes.map((r) => ({
      ...r,
      allergens: r.allergens ? JSON.parse(r.allergens) : [],
      nutritionInfo: r.nutritionInfo ? JSON.parse(r.nutritionInfo) : null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }))
  );
}

// POST /api/recipes  — create a new recipe
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, cuisine, mealType, servings, cookTime, sourceUrl, imageUrl, allergens, nutritionInfo, ingredients, steps } = body;

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const recipe = await prisma.recipe.create({
    data: {
      title,
      cuisine: cuisine ?? null,
      mealType: mealType ?? null,
      servings: servings ? Number(servings) : null,
      cookTime: cookTime ? Number(cookTime) : null,
      sourceUrl: sourceUrl ?? null,
      imageUrl: imageUrl ?? null,
      allergens: allergens ? JSON.stringify(allergens) : null,
      nutritionInfo: nutritionInfo ? JSON.stringify(nutritionInfo) : null,
      ingredients: {
        create: (ingredients ?? []).map(
          (ing: { name: string; quantity?: string; unit?: string }, i: number) => ({
            name: ing.name,
            quantity: ing.quantity ?? null,
            unit: ing.unit ?? null,
            sortOrder: i,
          })
        ),
      },
      steps: {
        create: (steps ?? []).map((instruction: string, i: number) => ({
          stepNumber: i + 1,
          instruction,
        })),
      },
    },
    include: {
      ingredients: { orderBy: { sortOrder: "asc" } },
      steps: { orderBy: { stepNumber: "asc" } },
    },
  });

  return NextResponse.json({
    ...recipe,
    allergens: recipe.allergens ? JSON.parse(recipe.allergens) : [],
    nutritionInfo: recipe.nutritionInfo ? JSON.parse(recipe.nutritionInfo) : null,
    createdAt: recipe.createdAt.toISOString(),
    updatedAt: recipe.updatedAt.toISOString(),
  }, { status: 201 });
}
