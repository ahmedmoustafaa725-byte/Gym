"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExerciseCard } from "@/components/workouts/exercise-card";
import { useAppState } from "@/lib/app-state";
import { generateWorkoutPlan } from "@/services/ai/workoutGenerator";

const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function WorkoutPlanView() {
  const { workoutPlan, profile, setWorkoutPlan } = useAppState();
  const [generating, setGenerating] = useState(false);

  async function regeneratePlan() {
    setGenerating(true);
    try {
      const response = await fetch("/api/ai/workout-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ profile })
      });

      if (!response.ok) {
        throw new Error("Workout generation failed");
      }

      setWorkoutPlan(await response.json());
    } catch {
      setWorkoutPlan(generateWorkoutPlan(profile, profile.userId));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold">{workoutPlan.name}</h2>
              <Badge>{workoutPlan.split}</Badge>
              <Badge className="border-accent/20 bg-accent/10 text-accent">{workoutPlan.daysPerWeek} days/week</Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Generated from your profile for {profile.goal.replaceAll("_", " ")} and {profile.minutesPerWorkout} minute sessions.
            </p>
          </div>
          <Button onClick={regeneratePlan} disabled={generating}>
            <RefreshCw className={`h-4 w-4 ${generating ? "animate-spin" : ""}`} />
            {generating ? "Generating with Gemini..." : "Regenerate with Gemini"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-5">
        {workoutPlan.days.map((day, index) => (
          <motion.div key={day.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle>{day.title}</CardTitle>
                    <CardDescription>
                      {dayNames[day.dayIndex]} - {day.focus} - {day.estimatedMinutes} min
                    </CardDescription>
                  </div>
                  <Badge>
                    <CalendarDays className="mr-1 h-3 w-3" />
                    Day {index + 1}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3">
                {day.exercises.map((exercise) => (
                  <ExerciseCard key={exercise.exerciseId} exercise={exercise} />
                ))}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
