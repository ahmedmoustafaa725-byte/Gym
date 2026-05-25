"use client";

import { FormEvent, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Database, Heart, ListChecks, Plus, Search, ShoppingBasket, Sparkles, Utensils } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAppState } from "@/lib/app-state";
import { todayISO } from "@/lib/date";
import { saveAiGeneratedPlan, saveMealPlan } from "@/services/database/repository";
import type { FoodItem, FoodLog, Meal } from "@/types";
import { includesSearch } from "@/utils/search";

const cuisines = ["all", "Egyptian", "Middle Eastern", "Mediterranean", "International"];

export function MealPlanner() {
  const { meals, setMeals, mealPlans, setMealPlans, addFoodLog, foodLogs, foodItems, targets, profile } = useAppState();
  const [query, setQuery] = useState("");
  const [cuisine, setCuisine] = useState("all");
  const [budget, setBudget] = useState("all");
  const [maxCalories, setMaxCalories] = useState("all");
  const [minProtein, setMinProtein] = useState("all");
  const [maxCookingTime, setMaxCookingTime] = useState("all");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [aiMeals, setAiMeals] = useState<Meal[]>([]);
  const [aiShoppingList, setAiShoppingList] = useState<string[]>([]);
  const [aiNote, setAiNote] = useState("");
  const [generatingMeals, setGeneratingMeals] = useState(false);
  const [servings, setServings] = useState<Record<string, string>>({});
  const [quickView, setQuickView] = useState<{ title: string; added: string; remaining: string } | null>(null);
  const [custom, setCustom] = useState({
    name: "",
    calories: 400,
    protein: 30,
    carbs: 45,
    fat: 12,
    ingredients: "",
    servingSize: "",
    mealTime: "",
    notes: "",
    cuisine: "Egyptian"
  });

  const todayTotals = useMemo(
    () =>
      foodLogs
        .filter((log) => log.date === todayISO())
        .reduce(
          (sum, log) => ({
            calories: sum.calories + log.calories,
            protein: sum.protein + log.protein,
            carbs: sum.carbs + log.carbs,
            fat: sum.fat + log.fat
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        ),
    [foodLogs]
  );

  const filteredMeals = useMemo(
    () =>
      meals.filter((meal) => {
        const matchesSearch = includesSearch([meal.name, meal.arabicName ?? "", ...meal.aliases, ...meal.tags], query);
        const matchesCuisine = cuisine === "all" || meal.cuisine === cuisine;
        const matchesBudget = budget === "all" || meal.budgetLevel === budget;
        const matchesCalories = maxCalories === "all" || meal.calories <= Number(maxCalories);
        const matchesProtein = minProtein === "all" || meal.protein >= Number(minProtein);
        const matchesCooking = maxCookingTime === "all" || meal.cookingTimeMinutes <= Number(maxCookingTime);
        return matchesSearch && matchesCuisine && matchesBudget && matchesCalories && matchesProtein && matchesCooking;
      }),
    [budget, cuisine, maxCalories, maxCookingTime, meals, minProtein, query]
  );

  const filteredFoodItems = useMemo(
    () =>
      foodItems
        .filter((item) => includesSearch([item.foodName, item.servingSize, item.cuisine ?? "", item.category ?? "", ...(item.aliases ?? [])], query))
        .slice(0, 12),
    [foodItems, query]
  );

  const builtInSuggestedPlan = useMemo(() => {
    const highProtein = meals.filter((meal) => meal.protein >= 25).slice(0, 3);
    const lighter = meals.filter((meal) => meal.calories <= 350).slice(0, 2);
    return [...highProtein, ...lighter].slice(0, 4);
  }, [meals]);

  const suggestedPlan = aiMeals.length ? aiMeals : builtInSuggestedPlan;

  const shoppingList = useMemo(() => {
    if (aiShoppingList.length) return aiShoppingList;
    return Array.from(new Set(suggestedPlan.flatMap((meal) => meal.ingredients.map((ingredient) => `${ingredient.amount} ${ingredient.name}`))));
  }, [aiShoppingList, suggestedPlan]);

  function showQuickView(log: Omit<FoodLog, "id" | "userId" | "date">) {
    const next = {
      calories: todayTotals.calories + log.calories,
      protein: todayTotals.protein + log.protein,
      carbs: todayTotals.carbs + log.carbs,
      fat: todayTotals.fat + log.fat
    };
    setQuickView({
      title: "Meal added to today",
      added: `+${log.calories} kcal | +${log.protein}g protein | +${log.carbs}g carbs | +${log.fat}g fat`,
      remaining: `Remaining today: ${Math.max(0, targets.calories - next.calories)} kcal | ${Math.max(0, targets.protein - next.protein)}g protein | ${Math.max(0, targets.carbs - next.carbs)}g carbs | ${Math.max(0, targets.fat - next.fat)}g fat`
    });
    window.setTimeout(() => setQuickView(null), 2000);
  }

  async function addMealToLog(meal: Meal) {
    const log = {
      mealName: meal.name,
      source: "meal_plan",
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      notes: meal.arabicName,
      date: todayISO()
    } satisfies Parameters<typeof addFoodLog>[0];
    await addFoodLog(log);
    showQuickView(log);
  }

  async function addFoodItemToLog(item: FoodItem) {
    const quantity = Math.max(0.25, Number(servings[item.id] || 1));
    const log = {
      mealName: item.foodName,
      source: "egyptian_food",
      foodItemId: item.id,
      servingSize: item.servingSize,
      quantity,
      calories: Math.round(item.calories * quantity),
      protein: Math.round(item.proteinG * quantity),
      carbs: Math.round(item.carbsG * quantity),
      fat: Math.round(item.fatG * quantity),
      notes: `${quantity} x ${item.servingSize}`,
      date: todayISO()
    } satisfies Parameters<typeof addFoodLog>[0];
    await addFoodLog(log);
    showQuickView(log);
  }

  function createMeal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!custom.name.trim() || custom.calories < 0 || custom.protein < 0 || custom.carbs < 0 || custom.fat < 0) return;
    const id = `custom-${crypto.randomUUID()}`;
    const meal: Meal = {
      id,
      name: custom.name,
      aliases: [custom.name],
      cuisine: custom.cuisine as Meal["cuisine"],
      tags: ["Custom", "Free user meal"],
      portionSize: custom.servingSize || "1 serving",
      calories: Number(custom.calories),
      protein: Number(custom.protein),
      carbs: Number(custom.carbs),
      fat: Number(custom.fat),
      ingredients: custom.ingredients
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => ({ name: line, amount: "1 portion" })),
      instructions: ["Prepare using your saved method."],
      healthierTips: ["Keep oil measured and add protein or vegetables if needed."],
      budgetLevel: "medium",
      cookingTimeMinutes: 20
    };
    setMeals((current) => [meal, ...current]);
    setCustom({ name: "", calories: 400, protein: 30, carbs: 45, fat: 12, ingredients: "", servingSize: "", mealTime: "", notes: "", cuisine: "Egyptian" });
  }

  async function generateMealPlan() {
    setGeneratingMeals(true);
    try {
      const response = await fetch("/api/ai/meal-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ profile, targets, meals, foodItems })
      });

      if (!response.ok) throw new Error("Meal generation failed");

      const generated = (await response.json()) as { verified: boolean; issues: string[]; meals: Meal[]; shoppingList: string[]; note: string };
      setAiMeals(generated.meals ?? []);
      setAiShoppingList(generated.shoppingList ?? []);
      setAiNote(generated.note ?? "");
      const savedPlan = await saveMealPlan({
        id: `meal-plan-${crypto.randomUUID()}`,
        userId: profile.userId,
        name: "Gemini Egyptian meal plan",
        planDate: todayISO(),
        meals: generated.meals ?? [],
        shoppingList: generated.shoppingList ?? [],
        note: generated.note ?? "",
        createdAt: new Date().toISOString()
      });
      setMealPlans((current) => [savedPlan, ...current]);
      void saveAiGeneratedPlan({
        userId: profile.userId,
        planType: "diet",
        provider: "gemini",
        model: "gemini-2.5-flash",
        prompt: "Meal plan generated from profile, macro targets, saved meals, and Egyptian food_items.",
        response: generated,
        validationStatus: "passed"
      });
    } catch {
      setAiMeals(builtInSuggestedPlan);
      setAiShoppingList([]);
      setAiNote("Gemini could not return a verified diet plan, so nothing was saved. Showing built-in Egyptian and Middle Eastern suggestions only.");
    } finally {
      setGeneratingMeals(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      {quickView ? (
        <div className="fixed right-4 top-4 z-50 max-w-md rounded-lg border border-primary/30 bg-card p-4 text-sm shadow-2xl">
          <p className="font-semibold text-primary">{quickView.title}</p>
          <p className="mt-1">{quickView.added}</p>
          <p className="mt-1 text-muted-foreground">{quickView.remaining}</p>
        </div>
      ) : null}

      <div className="space-y-6">
        <Card>
          <CardContent className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-[1fr_160px_140px_140px_140px_140px]">
            <label className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search hawawshi, ful, molokhia, rice, egg..." />
            </label>
            <Select value={cuisine} onChange={(event) => setCuisine(event.target.value)} aria-label="Cuisine filter">
              {cuisines.map((item) => (
                <option key={item} value={item}>
                  {item === "all" ? "All cuisines" : item}
                </option>
              ))}
            </Select>
            <Select value={budget} onChange={(event) => setBudget(event.target.value)} aria-label="Budget filter">
              <option value="all">All budgets</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
            <Select value={maxCalories} onChange={(event) => setMaxCalories(event.target.value)} aria-label="Calories filter">
              <option value="all">Any calories</option>
              <option value="350">Under 350</option>
              <option value="500">Under 500</option>
              <option value="650">Under 650</option>
            </Select>
            <Select value={minProtein} onChange={(event) => setMinProtein(event.target.value)} aria-label="Protein filter">
              <option value="all">Any protein</option>
              <option value="20">20g+ protein</option>
              <option value="30">30g+ protein</option>
              <option value="40">40g+ protein</option>
            </Select>
            <Select value={maxCookingTime} onChange={(event) => setMaxCookingTime(event.target.value)} aria-label="Cooking time filter">
              <option value="all">Any time</option>
              <option value="10">10 min</option>
              <option value="25">25 min</option>
              <option value="40">40 min</option>
            </Select>
          </CardContent>
        </Card>

        {filteredMeals.length ? (
          <div className="grid gap-5 md:grid-cols-2">
            {filteredMeals.map((meal, index) => (
              <motion.div key={meal.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }}>
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle>{meal.name}</CardTitle>
                        <CardDescription>{meal.arabicName ?? meal.cuisine}</CardDescription>
                      </div>
                      <Button
                        size="icon"
                        variant={favorites.includes(meal.id) ? "default" : "ghost"}
                        aria-label="Favorite meal"
                        title="Favorite meal"
                        onClick={() => setFavorites((current) => (current.includes(meal.id) ? current.filter((id) => id !== meal.id) : [...current, meal.id]))}
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-4 gap-2 text-center text-sm">
                      {[
                        ["kcal", meal.calories],
                        ["P", `${meal.protein}g`],
                        ["C", `${meal.carbs}g`],
                        ["F", `${meal.fat}g`]
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-md border bg-background/60 p-2">
                          <p className="font-semibold">{value}</p>
                          <p className="text-xs text-muted-foreground">{label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {meal.tags.slice(0, 4).map((tag) => (
                        <Badge key={tag}>{tag}</Badge>
                      ))}
                    </div>
                    
                    <div>
                      <p className="font-semibold">Healthier prep</p>
                      <p className="mt-1 text-sm text-muted-foreground">{meal.healthierTips.join(" ")}</p>
                    </div>
                    {meal.allergyNotes ? <p className="text-xs text-accent">Allergy note: {meal.allergyNotes}</p> : null}
                    <Button className="w-full" onClick={() => addMealToLog(meal)}>
                      <Plus className="h-4 w-4" />
                      Add to today
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState icon={Utensils} title="No meals found" description="Try searching in Arabic or English, or create a custom meal." />
        )}
      </div>

      <div className="space-y-6">
        <Card className="border-primary/20">
          <CardHeader>
            <ListChecks className="mb-3 h-7 w-7 text-primary" />
            <CardTitle>Generated meal plan</CardTitle>
            <CardDescription>{aiMeals.length ? "Gemini-generated plan using your profile." : `Simple free suggestion near your ${targets.calories} kcal target.`}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" onClick={generateMealPlan} disabled={generatingMeals}>
              <Sparkles className={`h-4 w-4 ${generatingMeals ? "animate-spin" : ""}`} />
              {generatingMeals ? "Generating meal plan..." : "Generate with Gemini"}
            </Button>
            {aiNote ? <p className="rounded-md border bg-background/60 p-3 text-sm text-muted-foreground">{aiNote}</p> : null}
            {mealPlans.length ? <p className="text-xs text-muted-foreground">{mealPlans.length} saved meal plan{mealPlans.length === 1 ? "" : "s"} in Supabase.</p> : null}
            {suggestedPlan.map((meal) => (
              <div key={meal.id} className="flex items-center justify-between rounded-md border bg-background/60 p-3 text-sm">
                <div>
                  <p className="font-medium">{meal.name}</p>
                  <p className="text-muted-foreground">{meal.protein}g protein</p>
                </div>
                <span className="font-semibold">{meal.calories}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Database className="mb-3 h-7 w-7 text-primary" />
            <CardTitle>Egyptian food database</CardTitle>
            <CardDescription>User-provided approximate macros stored in Supabase.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredFoodItems.length ? (
              filteredFoodItems.map((item) => (
                <div key={item.id} className="rounded-md border bg-background/60 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{item.foodName}</p>
                      <p className="text-xs text-muted-foreground">{item.servingSize}</p>
                    </div>
                    <span className="text-sm font-semibold">{item.calories} kcal</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    P {item.proteinG}g - C {item.carbsG}g - F {item.fatG}g
                  </p>
                  <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
                    <Input
                      type="number"
                      min="0.25"
                      step="0.25"
                      value={servings[item.id] ?? "1"}
                      onChange={(event) => setServings((current) => ({ ...current, [item.id]: event.target.value }))}
                      placeholder="Serving quantity, e.g. 1"
                      aria-label={`Serving quantity for ${item.foodName}`}
                    />
                    <Button onClick={() => addFoodItemToLog(item)}>
                      <Plus className="h-4 w-4" />
                      Add
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No Egyptian food items found. Paste the Egyptian seed SQL in Supabase, then redeploy or refresh.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <ShoppingBasket className="mb-3 h-7 w-7 text-secondary" />
            <CardTitle>Shopping list</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {shoppingList.slice(0, 10).map((item) => (
              <div key={item} className="rounded-md border bg-background/60 p-3 text-sm">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create custom meal</CardTitle>
            <CardDescription>Save your own meal and use it in logs.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={createMeal}>
              <label className="grid gap-2 text-sm font-medium">
                Meal name
                <Input value={custom.name} onChange={(event) => setCustom((current) => ({ ...current, name: event.target.value }))} placeholder="Chicken rice bowl" required />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" min="0" value={custom.calories} onChange={(event) => setCustom((current) => ({ ...current, calories: Number(event.target.value) }))} placeholder="Calories, e.g. 520" />
                <Input type="number" min="0" value={custom.protein} onChange={(event) => setCustom((current) => ({ ...current, protein: Number(event.target.value) }))} placeholder="Protein in grams, e.g. 35" />
                <Input type="number" min="0" value={custom.carbs} onChange={(event) => setCustom((current) => ({ ...current, carbs: Number(event.target.value) }))} placeholder="Carbs in grams, e.g. 60" />
                <Input type="number" min="0" value={custom.fat} onChange={(event) => setCustom((current) => ({ ...current, fat: Number(event.target.value) }))} placeholder="Fat in grams, e.g. 12" />
              </div>
              <Input value={custom.servingSize} onChange={(event) => setCustom((current) => ({ ...current, servingSize: event.target.value }))} placeholder="Serving size, e.g. 1 bowl or 250g" />
              <Input value={custom.mealTime} onChange={(event) => setCustom((current) => ({ ...current, mealTime: event.target.value }))} placeholder="Meal time, e.g. 13:30" />
              <Textarea value={custom.ingredients} onChange={(event) => setCustom((current) => ({ ...current, ingredients: event.target.value }))} placeholder="Ingredients, e.g. chicken, rice, olive oil" />
              <Textarea value={custom.notes} onChange={(event) => setCustom((current) => ({ ...current, notes: event.target.value }))} placeholder="Optional notes, e.g. post-workout meal" />
              <Button className="w-full" type="submit">
                <Plus className="h-4 w-4" />
                Save meal
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
