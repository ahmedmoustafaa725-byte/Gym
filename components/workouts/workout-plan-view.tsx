"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ExerciseCard } from "@/components/workouts/exercise-card";
import { useAppState } from "@/lib/app-state";
import { generateWorkoutPlan } from "@/services/ai/workoutGenerator";
import { saveAiGeneratedPlan } from "@/services/database/repository";

const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function WorkoutPlanView() {
  const { workoutPlan, profile, setWorkoutPlan } = useAppState();
  const [generating, setGenerating] = useState(false);
  const [custom, setCustom] = useState({
    title: "",
    focus: "",
    exerciseName: "",
    sets: "3",
    reps: "8-12",
    restSeconds: "90",
    targetMuscle: "",
    equipment: "",
    trainingDay: "0"
  });

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

      const payload = (await response.json()) as { plan: typeof workoutPlan };
      const generated = payload.plan;
      setWorkoutPlan(generated);
      void saveAiGeneratedPlan({
        userId: profile.userId,
        planType: "workout",
        provider: "gemini",
        model: "gemini-2.5-flash",
        prompt: "Workout plan regenerated from profile settings and exercise library.",
        response: generated,
        validationStatus: "passed"
      });
    } catch {
      const fallback = generateWorkoutPlan(profile, profile.userId);
      setWorkoutPlan(fallback);
      void saveAiGeneratedPlan({
        userId: profile.userId,
        planType: "workout",
        provider: "fallback",
        model: "local-rule-generator",
        prompt: "Fallback workout plan generated because Gemini was unavailable.",
        response: fallback,
        validationStatus: "passed"
      });
    } finally {
      setGenerating(false);
    }
  }

  function addCustomWorkout() {
    if (!custom.title.trim() || !custom.exerciseName.trim()) return;
    const exercise = {
      exerciseId: `custom-${crypto.randomUUID()}`,
      name: custom.exerciseName,
      sets: Number(custom.sets),
      reps: custom.reps,
      restSeconds: Number(custom.restSeconds),
      targetMuscle: custom.targetMuscle || "Custom",
      equipment: custom.equipment || "Custom",
      difficulty: profile.experience,
      videoUrl: "",
      instructions: ["Follow your saved notes and stop if serious pain appears."],
      commonMistakes: ["Rushing reps", "Skipping warm-up"],
      alternative: "Choose a similar pain-free movement"
    };
    setWorkoutPlan((current) => ({
      ...current,
      days: [
        ...current.days,
        {
          id: `custom-day-${crypto.randomUUID()}`,
          title: custom.title,
          focus: custom.focus || custom.targetMuscle || "Custom workout",
          dayIndex: Number(custom.trainingDay),
          estimatedMinutes: profile.minutesPerWorkout,
          exercises: [exercise]
        }
      ]
    }));
    setCustom({ title: "", focus: "", exerciseName: "", sets: "3", reps: "8-12", restSeconds: "90", targetMuscle: "", equipment: "", trainingDay: "0" });
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

      <Card>
        <CardHeader>
          <CardTitle>Create custom workout</CardTitle>
          <CardDescription>Add a workout day to your plan and save it to Supabase.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Input value={custom.title} onChange={(event) => setCustom((current) => ({ ...current, title: event.target.value }))} placeholder="Workout name, e.g. Push strength" />
          <Input value={custom.focus} onChange={(event) => setCustom((current) => ({ ...current, focus: event.target.value }))} placeholder="Workout focus, e.g. chest and triceps" />
          <Input type="number" min="0" max="6" value={custom.trainingDay} onChange={(event) => setCustom((current) => ({ ...current, trainingDay: event.target.value }))} placeholder="Training day index, e.g. 0 for Monday" />
          <Input value={custom.exerciseName} onChange={(event) => setCustom((current) => ({ ...current, exerciseName: event.target.value }))} placeholder="Exercise name, e.g. Dumbbell press" />
          <Input type="number" min="1" max="8" value={custom.sets} onChange={(event) => setCustom((current) => ({ ...current, sets: event.target.value }))} placeholder="Sets, e.g. 3" />
          <Input value={custom.reps} onChange={(event) => setCustom((current) => ({ ...current, reps: event.target.value }))} placeholder="Reps, e.g. 8-12" />
          <Input type="number" min="30" max="300" value={custom.restSeconds} onChange={(event) => setCustom((current) => ({ ...current, restSeconds: event.target.value }))} placeholder="Rest time in seconds, e.g. 90" />
          <Input value={custom.targetMuscle} onChange={(event) => setCustom((current) => ({ ...current, targetMuscle: event.target.value }))} placeholder="Target muscle, e.g. chest" />
          <Input value={custom.equipment} onChange={(event) => setCustom((current) => ({ ...current, equipment: event.target.value }))} placeholder="Equipment, e.g. dumbbells" />
          <Button className="md:col-span-3" onClick={addCustomWorkout}>
            Add custom workout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
