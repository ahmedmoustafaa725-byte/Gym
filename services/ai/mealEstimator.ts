import { meals } from "@/data/meals";
import type { FoodLog } from "@/types";
import { includesSearch, normalizeSearch } from "@/utils/search";

type ParsedItem = {
  name: string;
  quantity: number;
  portionHint?: string;
};

const portionMultipliers: Record<string, number> = {
  quarter: 0.25,
  "1/4": 0.25,
  ربع: 0.25,
  half: 0.5,
  "1/2": 0.5,
  نص: 0.5,
  نصف: 0.5,
  cup: 1,
  كوب: 1,
  كوباية: 1,
  رغيف: 1
};

const fallbackFoods = [
  { tokens: ["iced coffee", "coffee with milk", "قهوة", "ايس كوفي"], name: "Iced coffee with milk", calories: 60, protein: 3, carbs: 7, fat: 2 },
  { tokens: ["fries", "chips", "بطاطس"], name: "Fries", calories: 320, protein: 4, carbs: 45, fat: 14 },
  { tokens: ["chicken", "فراخ", "دجاج"], name: "Chicken", calories: 240, protein: 35, carbs: 0, fat: 10 },
  { tokens: ["rice", "رز"], name: "Rice", calories: 205, protein: 4, carbs: 45, fat: 1 },
  { tokens: ["milk", "لبن"], name: "Milk", calories: 120, protein: 8, carbs: 12, fat: 5 }
];

function detectQuantity(input: string, alias: string) {
  const normalized = normalizeSearch(input);
  const aliasIndex = normalized.indexOf(normalizeSearch(alias));
  const context = aliasIndex >= 0 ? normalized.slice(Math.max(0, aliasIndex - 24), aliasIndex + 32) : normalized;
  const numberMatch = context.match(/(\d+)(?:\s*x)?/);
  const quantity = numberMatch ? Number(numberMatch[1]) : 1;
  const multiplierKey = Object.keys(portionMultipliers).find((key) => context.includes(normalizeSearch(key)));
  return quantity * (multiplierKey ? portionMultipliers[multiplierKey] : 1);
}

function parseItems(input: string): ParsedItem[] {
  const detected: ParsedItem[] = [];

  for (const meal of meals) {
    const names = [meal.name, meal.arabicName ?? "", ...meal.aliases].filter(Boolean);
    const alias = names.find((name) => includesSearch([input], name));
    if (alias) {
      detected.push({ name: meal.name, quantity: detectQuantity(input, alias), portionHint: meal.portionSize });
    }
  }

  for (const food of fallbackFoods) {
    const token = food.tokens.find((value) => includesSearch([input], value));
    if (token && !detected.some((item) => item.name === food.name)) {
      detected.push({ name: food.name, quantity: detectQuantity(input, token) });
    }
  }

  return detected;
}

export function estimateMealFromText(input: string): Omit<FoodLog, "id" | "userId" | "date" | "source"> & { breakdown: string[]; needsClarification: boolean } {
  const normalized = normalizeSearch(input);

  if (normalized.includes("same breakfast") || normalized.includes("نفس الفطار")) {
    return {
      mealName: "Same breakfast as yesterday",
      calories: 470,
      protein: 30,
      carbs: 50,
      fat: 18,
      notes: "Mocked from yesterday's breakfast until Supabase history is connected.",
      breakdown: ["Ful Medames + boiled eggs from yesterday: 470 kcal"],
      needsClarification: false
    };
  }

  const items = parseItems(input);

  if (!items.length) {
    return {
      mealName: "Unclear meal",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      notes: "Could not estimate confidently.",
      breakdown: ["I need a portion or a clearer food name to estimate this."],
      needsClarification: true
    };
  }

  const totals = items.reduce(
    (sum, item) => {
      const meal = meals.find((entry) => entry.name === item.name);
      const fallback = fallbackFoods.find((entry) => entry.name === item.name);
      const source = meal ?? fallback;
      if (!source) return sum;
      return {
        calories: sum.calories + Math.round(source.calories * item.quantity),
        protein: sum.protein + Math.round(source.protein * item.quantity),
        carbs: sum.carbs + Math.round(source.carbs * item.quantity),
        fat: sum.fat + Math.round(source.fat * item.quantity)
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return {
    mealName: items.map((item) => `${item.quantity !== 1 ? `${item.quantity}x ` : ""}${item.name}`).join(", "),
    ...totals,
    notes: input,
    breakdown: items.map((item) => {
      const meal = meals.find((entry) => entry.name === item.name);
      const fallback = fallbackFoods.find((entry) => entry.name === item.name);
      const source = meal ?? fallback;
      return `${item.name}${item.quantity !== 1 ? ` x ${item.quantity}` : ""}: ${Math.round((source?.calories ?? 0) * item.quantity)} kcal`;
    }),
    needsClarification: false
  };
}
