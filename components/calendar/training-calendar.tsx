"use client";

import Link from "next/link";
import { CalendarDays, CheckCircle2, Clock, Dumbbell, Utensils } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppState } from "@/lib/app-state";
import { todayISO } from "@/lib/date";

function isoDays(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    return date.toISOString().slice(0, 10);
  });
}

function weekdayIndex(isoDate: string) {
  const date = new Date(`${isoDate}T12:00:00`);
  return date.getDay() === 0 ? 6 : date.getDay() - 1;
}

export function TrainingCalendar() {
  const { workoutPlan, sessions, foodLogs, scheduledWorkouts, mealPlans } = useAppState();
  const days = isoDays(14);
  const today = todayISO();

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="grid gap-4 md:grid-cols-2">
        {days.map((date) => {
          const scheduled = scheduledWorkouts.find((item) => item.scheduledDate === date && item.status !== "rest");
          const workout = scheduled
            ? workoutPlan.days.find((day) => day.id === scheduled.workoutDayId)
            : workoutPlan.days.find((day) => day.dayIndex === weekdayIndex(date));
          const completed = sessions.some(
            (session) =>
              session.date === date &&
              (session.scheduledWorkoutId === scheduled?.id || session.workoutDayId === workout?.id)
          );
          const dayFoodLogs = foodLogs.filter((log) => log.date === date);
          const plannedMeals = mealPlans.filter((plan) => plan.planDate === date);
          const isPast = date < today;
          const status = completed ? "completed" : scheduled?.status ?? (workout ? (isPast ? "missed" : "scheduled") : "rest");
          return (
            <Card key={date} className={date === today ? "border-primary/40" : undefined}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{new Date(`${date}T12:00:00`).toLocaleDateString("en", { weekday: "long", month: "short", day: "numeric" })}</CardTitle>
                    <CardDescription>{date === today ? "Today" : isPast ? "Past day" : "Upcoming"}</CardDescription>
                  </div>
                  <Badge>{status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {workout ? (
                  <div className="rounded-md border bg-background/60 p-3">
                    <div className="flex items-center gap-2 font-semibold">
                      <Dumbbell className="h-4 w-4 text-primary" />
                      {workout.title}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {workout.focus} - {workout.estimatedMinutes} min - {workout.exercises.length} exercises
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border bg-background/60 p-3 text-sm text-muted-foreground">
                    Rest day: walk, stretch, hydrate, and hit protein.
                  </div>
                )}
                <div className="rounded-md border bg-background/60 p-3 text-sm">
                  <div className="flex items-center gap-2 font-semibold">
                    <Utensils className="h-4 w-4 text-secondary" />
                    Meals
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    {dayFoodLogs.length} foods logged - {plannedMeals.reduce((sum, plan) => sum + plan.meals.length, 0)} planned meals
                  </p>
                </div>
                {date === today ? (
                  <Button asChild className="w-full">
                    <Link href="/today">
                      <Clock className="h-4 w-4" />
                      Start today's workout
                    </Link>
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="space-y-6">
        <Card className="border-primary/20">
          <CardHeader>
            <CalendarDays className="mb-3 h-7 w-7 text-primary" />
            <CardTitle>Calendar rules</CardTitle>
            <CardDescription>Calendar reads workout plans, sessions, and food logs from Supabase.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Completed workouts appear when a saved session matches that date and workout day.</p>
            <p>Missed workouts are past scheduled days without a saved session.</p>
            <p>Rest days show recovery and nutrition reminders.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CheckCircle2 className="mb-3 h-7 w-7 text-secondary" />
            <CardTitle>Recent completions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sessions.slice(0, 6).map((session) => (
              <div key={session.id} className="rounded-md border bg-background/60 p-3 text-sm">
                <p className="font-semibold">{session.date}</p>
                <p className="text-muted-foreground">{session.sets.filter((set) => set.completed).length} exercises completed</p>
              </div>
            ))}
            {!sessions.length ? <p className="text-sm text-muted-foreground">No completed sessions yet.</p> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
