"use client";

import { FormEvent, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Heart, ListChecks, Plus, Search, ShoppingBasket, Sparkles, Utensils } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAppState } from "@/lib/app-state";
import { todayISO } from "@/lib/date";
import type { Meal } from "@/types";
import { includesSearch } from "@/utils/search";

const cuisines = ["all", "Egyptian", "Middle Eastern", "Mediterranean", "International"];

export function MealPlanner() {
  const { meals, setMeals, addFoodLog, targets, profile } = useAppState();
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
  const [custom, setCustom] = useState({
    name: "",
    calories: 400,
    protein: 30,
    carbs: 45,
    fat: 12,
    ingredients: "",
    cuisine: "Egyptian"
  });

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

  const builtInSuggestedPlan = useMemo(() => {
    const highProtein = meals.filter((meal) => meal.protein >= 25).slice(0, 3);
    const lighter = meals.filter((meal) => meal.calories <= 350).slice(0, 2);
    return [...highProtein, ...lighter].slice(0, 4);
  }, [meals]);

  const suggestedPlan = aiMeals.length ? aiMeals : builtInSuggestedPlan;

  const shoppingList = useMemo(
    () => {
      if (aiShoppingList.length) {
        return aiShoppingList;
      }

      return Array.from(
        new Set(
          suggestedPlan.flatMap((meal) =>
            meal.ingredients.map((ingredient) => `${ingredient.amount} ${ingredient.name}`)
          )
        )
      );
    },
    [aiShoppingList, suggestedPlan]
  );

  function addMealToLog(meal: Meal) {
    addFoodLog({
      mealName: meal.name,
      source: "meal_plan",
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      notes: meal.arabicName,
      date: todayISO()
    });
  }

  function createMeal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = `custom-${crypto.randomUUID()}`;
    const meal: Meal = {
      id,
      name: custom.name,
      aliases: [custom.name],
      cuisine: custom.cuisine as Meal["cuisine"],
      tags: ["Custom", "Free user meal"],
      portionSize: "1 serving",
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
    setCustom({ name: "", calories: 400, protein: 30, carbs: 45, fat: 12, ingredients: "", cuisine: "Egyptian" });
  }

  async function generateMealPlan() {
    setGeneratingMeals(true);
    try {
      const response = await fetch("/api/ai/meal-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ profile, targets, meals })
      });

      if (!response.ok) {
        throw new Error("Meal generation failed");
      }

      const generated = (await response.json()) as { meals: Meal[]; shoppingList: string[]; note: string };
      setAiMeals(generated.meals ?? []);
      setAiShoppingList(generated.shoppingList ?? []);
      setAiNote(generated.note ?? "");
    } catch {
      setAiMeals(builtInSuggestedPlan);
      setAiShoppingList([]);
      setAiNote("Gemini was unavailable, so this plan uses the built-in Egyptian and Middle Eastern meal database.");
    } finally {
      setGeneratingMeals(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <Card>
          <CardContent className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-[1fr_160px_140px_140px_140px_140px]">
            <label className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search حواوشي, hawawshi, فول..." />
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
                        onClick={() =>
                          setFavorites((current) => (current.includes(meal.id) ? current.filter((id) => id !== meal.id) : [...current, meal.id]))
                        }
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
                    {meal.normalCalories || meal.fitnessCalories ? (
                      <div className="rounded-md border bg-background/60 p-3 text-sm text-muted-foreground">
                        <p>Normal version: {meal.normalCalories}</p>
                        <p>Fitness version: {meal.fitnessCalories}</p>
                      </div>
                    ) : null}
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
            <CardDescription>
              {aiMeals.length ? "Gemini-generated plan using your profile." : `Simple free suggestion near your ${targets.calories} kcal target.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" onClick={generateMealPlan} disabled={generatingMeals}>
              <Sparkles className={`h-4 w-4 ${generatingMeals ? "animate-spin" : ""}`} />
              {generatingMeals ? "Generating meal plan..." : "Generate with Gemini"}
            </Button>
            {aiNote ? <p className="rounded-md border bg-background/60 p-3 text-sm text-muted-foreground">{aiNote}</p> : null}
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
              <Input value={custom.name} onChange={(event) => setCustom((current) => ({ ...current, name: event.target.value }))} placeholder="Meal name" required />
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" value={custom.calories} onChange={(event) => setCustom((current) => ({ ...current, calories: Number(event.target.value) }))} placeholder="Calories" />
                <Input type="number" value={custom.protein} onChange={(event) => setCustom((current) => ({ ...current, protein: Number(event.target.value) }))} placeholder="Protein" />
                <Input type="number" value={custom.carbs} onChange={(event) => setCustom((current) => ({ ...current, carbs: Number(event.target.value) }))} placeholder="Carbs" />
                <Input type="number" value={custom.fat} onChange={(event) => setCustom((current) => ({ ...current, fat: Number(event.target.value) }))} placeholder="Fat" />
              </div>
              <Textarea value={custom.ingredients} onChange={(event) => setCustom((current) => ({ ...current, ingredients: event.target.value }))} placeholder="One ingredient per line" />
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
