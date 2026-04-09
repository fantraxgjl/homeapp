import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      ingredients: { orderBy: { sortOrder: "asc" } },
      steps: { orderBy: { stepNumber: "asc" } },
    },
  });

  if (!recipe) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...recipe,
    allergens: recipe.allergens ? JSON.parse(recipe.allergens) : [],
    nutritionInfo: recipe.nutritionInfo ? JSON.parse(recipe.nutritionInfo) : null,
    createdAt: recipe.createdAt.toISOString(),
    updatedAt: recipe.updatedAt.toISOString(),
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { title, cuisine, mealType, servings, cookTime, sourceUrl, imageUrl, allergens, nutritionInfo, ingredients, steps } = body;

  const recipe = await prisma.recipe.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(cuisine !== undefined ? { cuisine } : {}),
      ...(mealType !== undefined ? { mealType } : {}),
      ...(servings !== undefined ? { servings: servings ? Number(servings) : null } : {}),
      ...(cookTime !== undefined ? { cookTime: cookTime ? Number(cookTime) : null } : {}),
      ...(sourceUrl !== undefined ? { sourceUrl } : {}),
      ...(imageUrl !== undefined ? { imageUrl } : {}),
      ...(allergens !== undefined ? { allergens: JSON.stringify(allergens) } : {}),
      ...(nutritionInfo !== undefined ? { nutritionInfo: nutritionInfo ? JSON.stringify(nutritionInfo) : null } : {}),
      ...(ingredients !== undefined
        ? {
            ingredients: {
              deleteMany: {},
              create: ingredients.map(
                (ing: { name: string; quantity?: string; unit?: string }, i: number) => ({
                  name: ing.name,
                  quantity: ing.quantity ?? null,
                  unit: ing.unit ?? null,
                  sortOrder: i,
                })
              ),
            },
          }
        : {}),
      ...(steps !== undefined
        ? {
            steps: {
              deleteMany: {},
              create: steps.map((instruction: string, i: number) => ({
                stepNumber: i + 1,
                instruction,
              })),
            },
          }
        : {}),
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
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.recipe.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
// Required for Next.js static export (output: 'export'). Unused at runtime in native mode.
export async function generateStaticParams() { return []; }
