export type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";

export interface Ingredient {
  id: string;
  recipeId: string;
  name: string;
  quantity: string | null;
  unit: string | null;
  sortOrder: number;
}

export interface RecipeStep {
  id: string;
  recipeId: string;
  stepNumber: number;
  instruction: string;
}

export interface Recipe {
  id: string;
  title: string;
  cuisine: string | null;
  mealType: MealType | null;
  servings: number | null;
  cookTime: number | null;
  sourceUrl: string | null;
  imageUrl: string | null;
  allergens: string[];
  nutritionInfo: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  } | null;
  createdAt: string;
  updatedAt: string;
  ingredients?: Ingredient[];
  steps?: RecipeStep[];
}

export interface Meal {
  id: string;
  dayId: string;
  mealType: MealType;
  title: string;
  description: string | null;
  emoji: string | null;
  imageUrl: string | null;
  recipeUrl: string | null;
  servings: number | null;
  recipeId: string | null;
  createdAt: string;
  recipe?: Pick<Recipe, "id" | "title" | "cuisine" | "cookTime" | "allergens"> | null;
}

export interface MealDay {
  id: string;
  planId: string;
  date: string;
  dayOfWeek: number;
  meals: Meal[];
}

export interface MealPlanWeek {
  id: string;
  weekStart: string;
  days: MealDay[];
}

export interface ShoppingItem {
  id: string;
  name: string;
  category: string | null;
  quantity: string | null;
  isChecked: boolean;
  mealId: string | null;
  addedById: string | null;
  createdAt: string;
}
