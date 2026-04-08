import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { startOfDay, addDays, parseISO } from "date-fns";

function buildWeekDays(weekStart: Date) {
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    return { date, dayOfWeek: i };
  });
}

// GET /api/meals?weekStart=2026-04-07
export async function GET(req: NextRequest) {
  const weekStartStr = req.nextUrl.searchParams.get("weekStart");
  if (!weekStartStr) {
    return NextResponse.json({ error: "weekStart is required (yyyy-MM-dd)" }, { status: 400 });
  }

  const weekStart = startOfDay(parseISO(weekStartStr));

  // Find or return null (client handles empty shell)
  let plan = await prisma.mealPlan.findFirst({
    where: { weekStart },
    include: {
      days: {
        orderBy: { dayOfWeek: "asc" },
        include: {
          meals: {
            include: {
              recipe: {
                select: { id: true, title: true, cuisine: true, cookTime: true, allergens: true },
              },
            },
          },
        },
      },
    },
  });

  if (!plan) {
    // Return empty shell — 7 days, no meals
    return NextResponse.json({
      id: null,
      weekStart: weekStart.toISOString(),
      days: buildWeekDays(weekStart).map(({ date, dayOfWeek }) => ({
        id: null,
        planId: null,
        date: date.toISOString(),
        dayOfWeek,
        meals: [],
      })),
    });
  }

  return NextResponse.json({
    ...plan,
    weekStart: plan.weekStart.toISOString(),
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
    days: plan.days.map((day) => ({
      ...day,
      date: day.date.toISOString(),
      meals: day.meals.map((meal) => ({
        ...meal,
        createdAt: meal.createdAt.toISOString(),
        recipe: meal.recipe
          ? {
              ...meal.recipe,
              allergens: meal.recipe.allergens ? JSON.parse(meal.recipe.allergens) : [],
            }
          : null,
      })),
    })),
  });
}

// POST /api/meals — add a meal to a day (creates plan+day as needed)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { weekStart: weekStartStr, dayDate: dayDateStr, mealType, title, emoji, recipeUrl, recipeId, servings } = body;

  if (!weekStartStr || !dayDateStr || !mealType || !title) {
    return NextResponse.json(
      { error: "weekStart, dayDate, mealType, title are required" },
      { status: 400 }
    );
  }

  const weekStart = startOfDay(parseISO(weekStartStr));
  const dayDate = startOfDay(parseISO(dayDateStr));
  const dayOfWeek = Math.round((dayDate.getTime() - weekStart.getTime()) / 86400000);

  // Upsert MealPlan
  const plan = await prisma.mealPlan.upsert({
    where: { weekStart },
    update: {},
    create: { weekStart },
  });

  // Upsert MealDay
  const day = await prisma.mealDay.upsert({
    where: { planId_date: { planId: plan.id, date: dayDate } },
    update: {},
    create: { planId: plan.id, date: dayDate, dayOfWeek },
  });

  // Upsert Meal (one per mealType per day)
  const meal = await prisma.meal.upsert({
    where: { dayId_mealType: { dayId: day.id, mealType } },
    update: {
      title,
      emoji: emoji ?? null,
      recipeUrl: recipeUrl ?? null,
      recipeId: recipeId ?? null,
      servings: servings ? Number(servings) : null,
    },
    create: {
      dayId: day.id,
      mealType,
      title,
      emoji: emoji ?? null,
      recipeUrl: recipeUrl ?? null,
      recipeId: recipeId ?? null,
      servings: servings ? Number(servings) : null,
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
  }, { status: 201 });
}
