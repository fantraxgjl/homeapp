import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { title, emoji, recipeUrl, recipeId, servings } = body;

  const meal = await prisma.meal.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(emoji !== undefined ? { emoji } : {}),
      ...(recipeUrl !== undefined ? { recipeUrl } : {}),
      ...(recipeId !== undefined ? { recipeId } : {}),
      ...(servings !== undefined ? { servings: servings ? Number(servings) : null } : {}),
    },
    include: {
      recipe: {
        select: { id: true, title: true, cuisine: true, cookTime: true, allergens: true },
      },
    },
  });

  return NextResponse.json({
    ...meal,
    createdAt: meal.createdAt.toISOString(),
    recipe: meal.recipe
      ? { ...meal.recipe, allergens: meal.recipe.allergens ? JSON.parse(meal.recipe.allergens) : [] }
      : null,
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.meal.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
