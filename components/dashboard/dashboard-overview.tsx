"use client";

import Link from "next/link";
import { Activity, Bot, Droplets, Dumbbell, Flame, Scale, Utensils } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressRing } from "@/components/ui/progress";
import { useAppState } from "@/lib/app-state";
import { todayISO } from "@/lib/date";
import { getTodayWorkout } from "@/services/ai/workoutGenerator";

export function DashboardOverview() {
  const { targets, foodLogs, workoutPlan, progress } = useAppState();
  const today = todayISO();
  const todayLogs = foodLogs.filter((log) => log.date === today);
  const eaten = todayLogs.reduce((sum, log) => sum + log.calories, 0);
  const protein = todayLogs.reduce((sum, log) => sum + log.protein, 0);
  const carbs = todayLogs.reduce((sum, log) => sum + log.carbs, 0);
  const fat = todayLogs.reduce((sum, log) => sum + log.fat, 0);
  const workout = getTodayWorkout(workoutPlan);
  const latestWeight = progress.at(-1)?.weightKg ?? 0;
  const calorieProgress = (eaten / targets.calories) * 100;

  const chartData = progress.map((entry) => ({
    date: new Date(entry.date).toLocaleDateString("en", { month: "short", day: "numeric" }),
    weight: entry.weightKg,
    protein: entry.proteinAverage
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Flame} label="Calories eaten" value={`${eaten} kcal`} subtext={`${Math.max(0, targets.calories - eaten)} kcal remaining`} progress={calorieProgress} />
        <MetricCard icon={Activity} label="Protein" value={`${protein}g`} subtext={`Target ${targets.protein}g`} progress={(protein / targets.protein) * 100} delay={0.05} />
        <MetricCard icon={Droplets} label="Water intake" value="1.8 L" subtext="Goal 2.7 L today" progress={67} delay={0.1} />
        <MetricCard icon={Scale} label="Current weight" value={`${latestWeight} kg`} subtext="Latest weekly check-in" delay={0.15} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>{workout ? "Today's workout" : "Recovery day"}</CardTitle>
              <CardDescription>
                {workout ? `${workout.title} - ${workout.estimatedMinutes} min - ${workout.focus}` : "Walk, stretch, hydrate, and hit your protein target."}
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/today">{workout ? "Start" : "View tips"}</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {workout ? (
              <div className="grid gap-3">
                {workout.exercises.slice(0, 5).map((exercise) => (
                  <div key={exercise.exerciseId} className="flex items-center justify-between rounded-md border bg-background/60 p-3">
                    <div>
                      <p className="font-medium">{exercise.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {exercise.sets} sets x {exercise.reps} - {exercise.targetMuscle}
                      </p>
                    </div>
                    <Dumbbell className="h-4 w-4 text-primary" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-3">
                {["20-30 min easy walk", "8 min hips and t-spine", "Protein at every meal"].map((tip) => (
                  <div key={tip} className="rounded-md border bg-background/60 p-3 text-sm">
                    {tip}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Macros</CardTitle>
            <CardDescription>Live from today's food log</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-3">
            <ProgressRing value={(protein / targets.protein) * 100} label={`${protein}g`} caption="Protein" />
            <ProgressRing value={(carbs / targets.carbs) * 100} label={`${carbs}g`} caption="Carbs" color="hsl(var(--secondary))" />
            <ProgressRing value={(fat / targets.fat) * 100} label={`${fat}g`} caption="Fat" color="hsl(var(--accent))" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Recent meals</CardTitle>
            <CardDescription>Food added today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between rounded-md border bg-background/60 p-3">
                <div>
                  <p className="font-medium">{log.mealName}</p>
                  <p className="text-xs text-muted-foreground">
                    {log.protein}g protein - {log.source}
                  </p>
                </div>
                <span className="font-semibold">{log.calories}</span>
              </div>
            ))}
            <Button asChild variant="outline" className="w-full">
              <Link href="/chatbot">
                <Bot className="h-4 w-4" />
                Log with AI chat
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly progress</CardTitle>
            <CardDescription>Weight and protein trend</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: -20, right: 10, top: 10 }}>
                <defs>
                  <linearGradient id="weight" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Area type="monotone" dataKey="weight" stroke="hsl(var(--primary))" fill="url(#weight)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">AI coach quick message</p>
            <p className="text-sm text-muted-foreground">
              You are on pace today. Add one high-protein snack if dinner is light, and use the 20-minute workout option if your schedule gets tight.
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/progress">Review recommendations</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
