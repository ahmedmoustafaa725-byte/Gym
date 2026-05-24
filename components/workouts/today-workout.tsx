"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Save, Sparkles, Trees } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { useAppState } from "@/lib/app-state";
import { todayISO } from "@/lib/date";
import { getTodayWorkout, shortenWorkout } from "@/services/ai/workoutGenerator";
import type { WorkoutSetLog } from "@/types";

export function TodayWorkout() {
  const { workoutPlan, sessions, setSessions, profile } = useAppState();
  const baseWorkout = getTodayWorkout(workoutPlan);
  const [shortMode, setShortMode] = useState(false);
  const workout = baseWorkout && shortMode ? shortenWorkout(baseWorkout) : baseWorkout;
  const [logs, setLogs] = useState<Record<string, WorkoutSetLog>>({});
  const [difficulty, setDifficulty] = useState("3");
  const [notes, setNotes] = useState("");
  const today = todayISO();

  const completedCount = useMemo(() => Object.values(logs).filter((log) => log.completed).length, [logs]);

  if (!workout) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <EmptyState icon={Trees} title="Recovery day" description="Today is a planned rest day. Recover like it is part of the program, because it is." />
        <Card>
          <CardHeader>
            <CardTitle>Recovery checklist</CardTitle>
            <CardDescription>Simple work that supports tomorrow.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {["20-40 minute easy walk", "8 minutes of mobility", "Hit protein target", "Hydrate and sleep on time"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-md border bg-background/60 p-3 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeWorkout = workout;

  function updateExercise(exerciseId: string, patch: Partial<WorkoutSetLog>) {
    setLogs((current) => {
      const existing = current[exerciseId];
      return {
        ...current,
        [exerciseId]: {
          ...existing,
          ...patch,
          exerciseId,
          completed: patch.completed ?? existing?.completed ?? false
        }
      };
    });
  }

  function saveSession() {
    setSessions((current) => [
      {
        id: `session-${crypto.randomUUID()}`,
        userId: profile.userId,
        workoutDayId: activeWorkout.id,
        date: today,
        difficultyRating: Number(difficulty),
        notes,
        sets: Object.values(logs)
      },
      ...current
    ]);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <Card className="border-primary/20">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>{activeWorkout.title}</CardTitle>
              <CardDescription>
                {activeWorkout.focus} - {activeWorkout.estimatedMinutes} minutes - {completedCount}/{activeWorkout.exercises.length} completed
              </CardDescription>
            </div>
            <Button variant={shortMode ? "secondary" : "outline"} onClick={() => setShortMode((value) => !value)}>
              <Clock className="h-4 w-4" />I only have 20 minutes today
            </Button>
          </CardHeader>
        </Card>

        {activeWorkout.exercises.map((exercise, index) => {
          const log = logs[exercise.exerciseId];
          return (
            <motion.div key={exercise.exerciseId} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <CardTitle>{exercise.name}</CardTitle>
                      <CardDescription>
                        {exercise.sets} sets x {exercise.reps} - {exercise.restSeconds}s rest - {exercise.targetMuscle}
                      </CardDescription>
                    </div>
                    <Button
                      variant={log?.completed ? "default" : "outline"}
                      onClick={() => updateExercise(exercise.exerciseId, { completed: !log?.completed })}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {log?.completed ? "Done" : "Mark done"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 lg:grid-cols-[1fr_280px]">
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">Instructions</p>
                    <ul className="space-y-1">
                      {exercise.instructions.map((instruction) => (
                        <li key={instruction}>- {instruction}</li>
                      ))}
                    </ul>
                    <p>
                      Common mistakes: <span className="text-foreground">{exercise.commonMistakes.join(", ")}</span>
                    </p>
                    <p>
                      Alternative: <span className="text-foreground">{exercise.alternative}</span>
                    </p>
                  </div>
                  <div className="grid gap-3">
                    <label className="grid gap-2 text-sm font-medium">
                      Weight used (kg)
                      <Input type="number" value={log?.weightKg ?? ""} onChange={(event) => updateExercise(exercise.exerciseId, { weightKg: Number(event.target.value) })} />
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                      Reps achieved
                      <Input type="number" value={log?.reps ?? ""} onChange={(event) => updateExercise(exercise.exerciseId, { reps: Number(event.target.value) })} />
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                      Notes
                      <Input value={log?.notes ?? ""} onChange={(event) => updateExercise(exercise.exerciseId, { notes: event.target.value })} placeholder="Form, pain, tempo..." />
                    </label>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Sparkles className="mb-3 h-7 w-7 text-primary" />
            <CardTitle>Session finish</CardTitle>
            <CardDescription>Save difficulty and notes to workout history.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="grid gap-2 text-sm font-medium">
              Difficulty
              <Select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>
                    {value} / 5
                  </option>
                ))}
              </Select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Workout notes
              <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Energy, pain, wins, next time..." />
            </label>
            <Button className="w-full" onClick={saveSession}>
              <Save className="h-4 w-4" />
              Save workout history
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent sessions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sessions.slice(0, 4).map((session) => (
              <div key={session.id} className="rounded-md border bg-background/60 p-3 text-sm">
                <p className="font-medium">{session.date}</p>
                <p className="text-muted-foreground">
                  {session.sets.filter((set) => set.completed).length} exercises - difficulty {session.difficultyRating}/5
                </p>
              </div>
            ))}
            {!sessions.length ? <p className="text-sm text-muted-foreground">No sessions saved yet.</p> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
