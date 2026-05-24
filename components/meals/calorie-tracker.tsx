"use client";

import { FormEvent, useMemo, useState } from "react";
import { AlertTriangle, Copy, Edit3, Plus, Save, Star, Trash2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress, ProgressRing } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useAppState } from "@/lib/app-state";
import { todayISO } from "@/lib/date";
import { buildDailyNutritionRecommendations } from "@/services/recommendations/nutritionStandards";
import type { FoodLog, Meal } from "@/types";

export function CalorieTracker() {
  const { foodLogs, addFoodLog, updateFoodLog, deleteFoodLog, targets, setMeals } = useAppState();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [manual, setManual] = useState({ mealName: "", calories: 350, protein: 25, carbs: 35, fat: 10, notes: "" });
  const [quickView, setQuickView] = useState<{ added: string; remaining: string } | null>(null);
  const today = todayISO();
  const todayLogs = foodLogs.filter((log) => log.date === today);
  const totals = todayLogs.reduce(
    (sum, log) => ({
      calories: sum.calories + log.calories,
      protein: sum.protein + log.protein,
      carbs: sum.carbs + log.carbs,
      fat: sum.fat + log.fat
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const byDay = useMemo(() => {
    const grouped = new Map<string, { date: string; calories: number; protein: number }>();
    foodLogs.forEach((log) => {
      const current = grouped.get(log.date) ?? { date: log.date, calories: 0, protein: 0 };
      grouped.set(log.date, { date: log.date, calories: current.calories + log.calories, protein: current.protein + log.protein });
    });
    return Array.from(grouped.values()).slice(0, 7).reverse();
  }, [foodLogs]);

  const weeklyAverage = byDay.length ? Math.round(byDay.reduce((sum, day) => sum + day.calories, 0) / byDay.length) : 0;
  const bestProteinDay = byDay.reduce((best, day) => (day.protein > best.protein ? day : best), { date: "-", protein: 0, calories: 0 });
  const missedWarning = totals.calories < targets.calories * 0.65 || totals.protein < targets.protein * 0.5;
  const nutritionGuidance = buildDailyNutritionRecommendations(totals, targets);

  function showQuickView(log: Omit<FoodLog, "id" | "userId" | "date">) {
    const next = {
      calories: totals.calories + log.calories,
      protein: totals.protein + log.protein,
      carbs: totals.carbs + log.carbs,
      fat: totals.fat + log.fat
    };
    setQuickView({
      added: `+${log.calories} kcal | +${log.protein}g protein | +${log.carbs}g carbs | +${log.fat}g fat`,
      remaining: `Remaining today: ${Math.max(0, targets.calories - next.calories)} kcal | ${Math.max(0, targets.protein - next.protein)}g protein | ${Math.max(0, targets.carbs - next.carbs)}g carbs | ${Math.max(0, targets.fat - next.fat)}g fat`
    });
    window.setTimeout(() => setQuickView(null), 2000);
  }

  async function submitManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!manual.mealName.trim() || manual.calories < 0 || manual.protein < 0 || manual.carbs < 0 || manual.fat < 0) return;
    const log = { ...manual, source: "manual" } satisfies Parameters<typeof addFoodLog>[0];
    await addFoodLog(log);
    showQuickView(log);
    setManual({ mealName: "", calories: 350, protein: 25, carbs: 35, fat: 10, notes: "" });
  }

  function copyYesterday() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const key = yesterday.toISOString().slice(0, 10);
    const sourceLogs = foodLogs.filter((log) => log.date === key);
    const fallback = foodLogs.filter((log) => log.date !== today).slice(0, 2);
    (sourceLogs.length ? sourceLogs : fallback).forEach((log) =>
      addFoodLog({
        mealName: log.mealName,
        source: "copy",
        calories: log.calories,
        protein: log.protein,
        carbs: log.carbs,
        fat: log.fat,
        notes: `Copied from ${log.date}`
      })
    );
  }

  function saveRepeatedMeal(log: FoodLog) {
    const meal: Meal = {
      id: `repeat-${log.id}`,
      name: log.mealName,
      aliases: [log.mealName],
      cuisine: "International",
      tags: ["Repeated", "Saved"],
      portionSize: "1 saved serving",
      calories: log.calories,
      protein: log.protein,
      carbs: log.carbs,
      fat: log.fat,
      ingredients: [{ name: log.mealName, amount: "1 serving" }],
      instructions: ["Saved from calorie tracker."],
      healthierTips: ["Review portions when goals change."],
      budgetLevel: "medium",
      cookingTimeMinutes: 0
    };
    setMeals((current) => [meal, ...current.filter((item) => item.id !== meal.id)]);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      {quickView ? (
        <div className="fixed right-4 top-4 z-50 max-w-md rounded-lg border border-primary/30 bg-card p-4 text-sm shadow-2xl">
          <p className="font-semibold text-primary">Meal added to today</p>
          <p className="mt-1">{quickView.added}</p>
          <p className="mt-1 text-muted-foreground">{quickView.remaining}</p>
        </div>
      ) : null}

      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-5">
              <ProgressRing value={(totals.calories / targets.calories) * 100} label={`${totals.calories}`} caption="Calories" />
              <p className="mt-4 text-center text-sm text-muted-foreground">{Math.max(0, targets.calories - totals.calories)} kcal remaining</p>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Macro progress</CardTitle>
              <CardDescription>Daily target: {targets.calories} kcal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                ["Protein", totals.protein, targets.protein, "bg-primary"],
                ["Carbs", totals.carbs, targets.carbs, "bg-secondary"],
                ["Fat", totals.fat, targets.fat, "bg-accent"]
              ].map(([label, value, target, color]) => (
                <div key={label as string}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span>{label}</span>
                    <span className="text-muted-foreground">
                      {value as number}g / {target as number}g
                    </span>
                  </div>
                  <Progress value={((value as number) / (target as number)) * 100} indicatorClassName={color as string} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {missedWarning ? (
          <Card className="border-accent/30">
            <CardContent className="flex gap-3 p-4 text-sm">
              <AlertTriangle className="h-5 w-5 text-accent" />
              <p>Your intake is far below today's target. Avoid extreme restriction; add a balanced meal with protein, carbs, and vegetables.</p>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Daily nutrition recommendations</CardTitle>
            <CardDescription>General fitness guidance based on your targets, not medical advice.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid gap-2 sm:grid-cols-4">
              {Object.entries(nutritionGuidance.statuses).map(([key, value]) => (
                <div key={key} className="rounded-md border bg-background/60 p-3">
                  <p className="capitalize text-muted-foreground">{key}</p>
                  <p className="font-semibold">{value}</p>
                </div>
              ))}
            </div>
            {nutritionGuidance.messages.map((message) => (
              <p key={message} className="rounded-md border bg-background/60 p-3 text-muted-foreground">
                {message}
              </p>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Meal history</CardTitle>
              <CardDescription>Edit or delete today's logged foods.</CardDescription>
            </div>
            <Button variant="outline" onClick={copyYesterday}>
              <Copy className="h-4 w-4" />
              Copy yesterday
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayLogs.map((log) => {
              const editing = editingId === log.id;
              return (
                <div key={log.id} className="rounded-md border bg-background/60 p-3">
                  {editing ? (
                    <div className="grid gap-3 md:grid-cols-5">
                      <Input className="md:col-span-2" value={log.mealName} onChange={(event) => updateFoodLog(log.id, { mealName: event.target.value })} placeholder="Meal name, e.g. chicken rice bowl" aria-label="Edit meal name" />
                      <Input type="number" min="0" value={log.calories} onChange={(event) => updateFoodLog(log.id, { calories: Number(event.target.value) })} placeholder="Calories, e.g. 520" aria-label="Edit calories" />
                      <Input type="number" min="0" value={log.protein} onChange={(event) => updateFoodLog(log.id, { protein: Number(event.target.value) })} placeholder="Protein in grams, e.g. 35" aria-label="Edit protein" />
                      <Button onClick={() => setEditingId(null)}>
                        <Save className="h-4 w-4" />
                        Save
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{log.mealName}</p>
                          <Badge>{log.source}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {log.calories} kcal - P {log.protein}g - C {log.carbs}g - F {log.fat}g
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" aria-label="Save repeated meal" title="Save repeated meal" onClick={() => saveRepeatedMeal(log)}>
                          <Star className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" aria-label="Edit meal" title="Edit meal" onClick={() => setEditingId(log.id)}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" aria-label="Delete meal" title="Delete meal" onClick={() => deleteFoodLog(log.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {!todayLogs.length ? <p className="text-sm text-muted-foreground">No food logged today yet.</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly nutrition</CardTitle>
            <CardDescription>Average {weeklyAverage} kcal/day - best protein day {bestProteinDay.date}</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="calories" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="h-fit">
        <CardHeader>
          <Plus className="mb-3 h-7 w-7 text-primary" />
          <CardTitle>Add food manually</CardTitle>
          <CardDescription>Use this when you already know the calories/macros.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={submitManual}>
            <label className="grid gap-2 text-sm font-medium">
              Meal name
              <Input value={manual.mealName} onChange={(event) => setManual((current) => ({ ...current, mealName: event.target.value }))} placeholder="Chicken rice bowl" required />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" min="0" value={manual.calories} onChange={(event) => setManual((current) => ({ ...current, calories: Number(event.target.value) }))} placeholder="Calories, e.g. 520" aria-label="Calories" />
              <Input type="number" min="0" value={manual.protein} onChange={(event) => setManual((current) => ({ ...current, protein: Number(event.target.value) }))} placeholder="Protein in grams, e.g. 35" aria-label="Protein grams" />
              <Input type="number" min="0" value={manual.carbs} onChange={(event) => setManual((current) => ({ ...current, carbs: Number(event.target.value) }))} placeholder="Carbs in grams, e.g. 60" aria-label="Carbs grams" />
              <Input type="number" min="0" value={manual.fat} onChange={(event) => setManual((current) => ({ ...current, fat: Number(event.target.value) }))} placeholder="Fat in grams, e.g. 12" aria-label="Fat grams" />
            </div>
            <Textarea value={manual.notes} onChange={(event) => setManual((current) => ({ ...current, notes: event.target.value }))} placeholder="Ingredients or notes, e.g. chicken, rice, olive oil" />
            <Button className="w-full" type="submit">
              <Plus className="h-4 w-4" />
              Add food
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
