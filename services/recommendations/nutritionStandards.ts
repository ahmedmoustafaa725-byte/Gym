import type { MacroTarget } from "@/types";

export type NutritionTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
};

function status(value: number, target: number) {
  if (value < target * 0.85) return "below" as const;
  if (value > target * 1.1) return "above" as const;
  return "within" as const;
}

export function buildDailyNutritionRecommendations(totals: NutritionTotals, targets: MacroTarget) {
  const statuses = {
    calories: status(totals.calories, targets.calories),
    protein: status(totals.protein, targets.protein),
    carbs: status(totals.carbs, targets.carbs),
    fat: status(totals.fat, targets.fat)
  };

  const messages: string[] = [];
  if (statuses.protein === "below") messages.push("You are below your protein target today. Try adding grilled chicken, tuna, cottage cheese, eggs, or lentil soup.");
  if (statuses.fat === "above") messages.push("Your fat intake is already high today. Choose a lower-fat meal next and measure oil.");
  if (statuses.carbs === "below") messages.push("You still have carbs remaining. Rice, baladi bread, potatoes, or fruit can fit well before training.");
  if (statuses.calories === "above") messages.push("Calories are above today's target. Keep the next meal lighter and focus on protein and vegetables.");
  if (statuses.calories === "within" && statuses.protein === "within") messages.push("Calories and protein are close to target. Keep the rest of the day simple and hydrated.");

  return {
    statuses,
    messages,
    references: ["WHO general energy-balance guidance", "EFSA baseline water intake guidance", "USDA Dietary Guidelines macronutrient/fiber ranges", "ISSN sports protein range for active users"]
  };
}
