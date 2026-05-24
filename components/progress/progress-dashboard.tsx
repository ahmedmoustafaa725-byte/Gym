"use client";

import { FormEvent, useMemo, useState } from "react";
import { Camera, Dumbbell, Moon, Plus, Scale, Sparkles, TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAppState } from "@/lib/app-state";
import { todayISO } from "@/lib/date";
import { generateSmartRecommendations } from "@/services/recommendations/smartAdjustments";

export function ProgressDashboard() {
  const { progress, setProgress, checkins, setCheckins, sessions, foodLogs, targets, profile } = useAppState();
  const [entry, setEntry] = useState({ weightKg: profile.weightKg, waistCm: 93 });
  const [checkin, setCheckin] = useState({ mood: 4, energy: 4, hunger: 3, sleepHours: 7, trainingDifficulty: 3, notes: "" });

  const recommendations = generateSmartRecommendations({
    progress,
    foodLogs,
    sessions,
    checkins,
    proteinTarget: targets.protein
  });

  const chartData = progress.map((item) => ({
    date: new Date(item.date).toLocaleDateString("en", { month: "short", day: "numeric" }),
    weight: item.weightKg,
    waist: item.waistCm,
    calories: item.caloriesAverage,
    protein: item.proteinAverage,
    consistency: item.workoutConsistency
  }));

  const strengthData = useMemo(() => {
    const topSets = new Map<string, number>();
    sessions.forEach((session) => {
      session.sets.forEach((set) => {
        if (!set.weightKg) return;
        topSets.set(set.exerciseId, Math.max(topSets.get(set.exerciseId) ?? 0, set.weightKg));
      });
    });
    return Array.from(topSets.entries()).slice(0, 5);
  }, [sessions]);

  const summaryCards = [
    { label: "Current weight", value: `${progress.at(-1)?.weightKg ?? profile.weightKg} kg`, icon: Scale, detail: "Latest entry" },
    { label: "Waist", value: `${progress.at(-1)?.waistCm ?? "-"} cm`, icon: TrendingUp, detail: "Optional measurement" },
    { label: "Consistency", value: `${progress.at(-1)?.workoutConsistency ?? 0}%`, icon: Dumbbell, detail: "Workout completion" },
    { label: "Sleep", value: `${checkins.at(-1)?.sleepHours ?? 0} h`, icon: Moon, detail: "Latest check-in" }
  ];

  function addProgress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProgress((current) => [
      ...current,
      {
        id: `progress-${crypto.randomUUID()}`,
        userId: profile.userId,
        date: todayISO(),
        weightKg: Number(entry.weightKg),
        waistCm: Number(entry.waistCm),
        caloriesAverage: targets.calories,
        proteinAverage: targets.protein,
        workoutConsistency: Math.min(100, Math.round((sessions.length / Math.max(1, profile.daysPerWeek)) * 100))
      }
    ]);
  }

  function addCheckin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCheckins((current) => [
      ...current,
      {
        id: `checkin-${crypto.randomUUID()}`,
        userId: profile.userId,
        weekStart: todayISO(),
        ...checkin
      }
    ]);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_390px]">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {summaryCards.map(({ label, value, icon: Icon, detail }) => (
            <Card key={label}>
              <CardContent className="p-5">
                <Icon className="mb-4 h-6 w-6 text-primary" />
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-bold">{value}</p>
                <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Body trend</CardTitle>
            <CardDescription>Weight and waist over time</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} />
                <Line type="monotone" dataKey="waist" stroke="hsl(var(--accent))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Calories and protein</CardTitle>
              <CardDescription>Weekly averages from check-ins/logs</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Area type="monotone" dataKey="calories" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary) / 0.18)" />
                  <Area type="monotone" dataKey="protein" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.18)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Strength progress</CardTitle>
              <CardDescription>Best saved weights from workout sessions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {strengthData.length ? (
                strengthData.map(([exerciseId, weight]) => (
                  <div key={exerciseId}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span>{exerciseId.replaceAll("-", " ")}</span>
                      <span className="text-muted-foreground">{weight} kg</span>
                    </div>
                    <Progress value={Math.min(100, weight)} />
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Save a workout with weights to see strength trends.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <Camera className="mb-3 h-7 w-7 text-secondary" />
            <CardTitle>Progress photos</CardTitle>
            <CardDescription>Placeholder for Supabase Storage uploads.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {["Front", "Side", "Back"].map((label) => (
              <div key={label} className="grid aspect-[4/5] place-items-center rounded-lg border border-dashed bg-background/50 text-sm text-muted-foreground">
                {label} photo
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="border-primary/20">
          <CardHeader>
            <Sparkles className="mb-3 h-7 w-7 text-primary" />
            <CardTitle>Smart recommendations</CardTitle>
            <CardDescription>Rule-based now, AI-upgradable later.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.map((recommendation) => (
              <div key={recommendation.id} className="rounded-md border bg-background/60 p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold">{recommendation.title}</p>
                  <Badge className={recommendation.priority === "high" ? "border-accent/20 bg-accent/10 text-accent" : undefined}>
                    {recommendation.priority}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{recommendation.reason}</p>
                <p className="mt-2 text-sm">{recommendation.action}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Plus className="mb-3 h-7 w-7 text-primary" />
            <CardTitle>Add progress entry</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={addProgress}>
              <Input type="number" value={entry.weightKg} onChange={(event) => setEntry((current) => ({ ...current, weightKg: Number(event.target.value) }))} placeholder="Weight kg" />
              <Input type="number" value={entry.waistCm} onChange={(event) => setEntry((current) => ({ ...current, waistCm: Number(event.target.value) }))} placeholder="Waist cm" />
              <Button className="w-full" type="submit">
                <Plus className="h-4 w-4" />
                Save progress
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly check-in</CardTitle>
            <CardDescription>Mood, energy, hunger, sleep, and workout difficulty.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={addCheckin}>
              {[
                ["mood", "Mood"],
                ["energy", "Energy"],
                ["hunger", "Hunger"],
                ["trainingDifficulty", "Training difficulty"]
              ].map(([key, label]) => (
                <label key={key} className="grid gap-2 text-sm font-medium">
                  {label}
                  <Select
                    value={String(checkin[key as keyof typeof checkin])}
                    onChange={(event) => setCheckin((current) => ({ ...current, [key]: Number(event.target.value) }))}
                  >
                    {[1, 2, 3, 4, 5].map((value) => (
                      <option key={value} value={value}>
                        {value} / 5
                      </option>
                    ))}
                  </Select>
                </label>
              ))}
              <label className="grid gap-2 text-sm font-medium">
                Sleep hours
                <Input type="number" value={checkin.sleepHours} onChange={(event) => setCheckin((current) => ({ ...current, sleepHours: Number(event.target.value) }))} />
              </label>
              <Textarea value={checkin.notes} onChange={(event) => setCheckin((current) => ({ ...current, notes: event.target.value }))} placeholder="What changed this week?" />
              <Button className="w-full" type="submit">
                Save check-in
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
