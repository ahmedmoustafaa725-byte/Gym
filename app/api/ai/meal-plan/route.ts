import { NextResponse } from "next/server";
import { meals as seedMeals } from "@/data/meals";
import { generateGeminiJSON } from "@/services/ai/geminiClient";
import type { MacroTarget, Meal, Profile } from "@/types";

type MealPlanResponse = {
  meals: Meal[];
  shoppingList: string[];
  note: string;
};

function fallbackMealPlan(): MealPlanResponse {
  const meals = seedMeals.filter((meal) => meal.protein >= 18).slice(0, 5);
  return {
    meals,
    shoppingList: Array.from(new Set(meals.flatMap((meal) => meal.ingredients.map((ingredient) => `${ingredient.amount} ${ingredient.name}`)))),
    note: "Generated from the built-in Egyptian and Middle Eastern meal database."
  };
}

function normalizeMeal(raw: Partial<Meal>, fallback: Meal, index: number): Meal {
  return {
    ...fallback,
    id: String(raw.id ?? `ai-meal-${index}`),
    name: String(raw.name ?? fallback.name),
    arabicName: raw.arabicName ?? fallback.arabicName,
    aliases: raw.aliases?.length ? raw.aliases : fallback.aliases,
    cuisine: raw.cuisine ?? fallback.cuisine,
    tags: raw.tags?.length ? raw.tags : fallback.tags,
    portionSize: String(raw.portionSize ?? fallback.portionSize),
    calories: Number(raw.calories ?? fallback.calories),
    protein: Number(raw.protein ?? fallback.protein),
    carbs: Number(raw.carbs ?? fallback.carbs),
    fat: Number(raw.fat ?? fallback.fat),
    ingredients: raw.ingredients?.length ? raw.ingredients : fallback.ingredients,
    instructions: raw.instructions?.length ? raw.instructions : fallback.instructions,
    healthierTips: raw.healthierTips?.length ? raw.healthierTips : fallback.healthierTips,
    budgetLevel: raw.budgetLevel ?? fallback.budgetLevel,
    cookingTimeMinutes: Number(raw.cookingTimeMinutes ?? fallback.cookingTimeMinutes)
  };
}

export async function POST(request: Request) {
  const { profile, targets, meals } = (await request.json()) as {
    profile: Profile;
    targets: MacroTarget;
    meals?: Meal[];
  };

  const fallback = fallbackMealPlan();
  const sourceMeals = (meals?.length ? meals : seedMeals).slice(0, 25);
  const prompt = `
You are NileFit AI, a nutrition coach for Egyptian and Middle Eastern food.
Generate a practical daily meal plan using real foods the user likes.
Respect allergies, disliked foods, budget level, cooking time, and calorie/macros target.
Avoid extreme starvation diets.

Return ONLY JSON:
{
  "meals": [
    {
      "id": "meal-id",
      "name": "Meal name",
      "arabicName": "Arabic name",
      "aliases": ["alias"],
      "cuisine": "Egyptian",
      "tags": ["High protein"],
      "portionSize": "1 serving",
      "calories": 400,
      "protein": 30,
      "carbs": 40,
      "fat": 12,
      "ingredients": [{"name": "ingredient", "amount": "100 g"}],
      "instructions": ["step"],
      "healthierTips": ["tip"],
      "budgetLevel": "medium",
      "cookingTimeMinutes": 20
    }
  ],
  "shoppingList": ["item"],
  "note": "short coaching note"
}

User profile:
${JSON.stringify(profile)}

Targets:
${JSON.stringify(targets)}

Available meal database:
${JSON.stringify(sourceMeals)}
`;

  const raw = await generateGeminiJSON<MealPlanResponse>(prompt, fallback, { temperature: 0.35 });
  const rawMeals = Array.isArray(raw.meals) ? raw.meals : fallback.meals;
  const normalizedMeals = rawMeals.slice(0, 6).map((meal, index) => normalizeMeal(meal, fallback.meals[index] ?? fallback.meals[0], index));
  const shoppingList = Array.isArray(raw.shoppingList) && raw.shoppingList.length
    ? raw.shoppingList.map(String)
    : Array.from(new Set(normalizedMeals.flatMap((meal) => meal.ingredients.map((ingredient) => `${ingredient.amount} ${ingredient.name}`))));

  return NextResponse.json({
    meals: normalizedMeals,
    shoppingList,
    note: raw.note || fallback.note
  });
}
