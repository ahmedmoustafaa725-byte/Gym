"use client";

import Link from "next/link";
import { CheckCircle2, Dumbbell, PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { WorkoutExercise } from "@/types";

export function ExerciseCard({ exercise, compact = false }: { exercise: WorkoutExercise; compact?: boolean }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{exercise.name}</h3>
            <Badge>{exercise.targetMuscle}</Badge>
            <Badge className="border-secondary/20 bg-secondary/10 text-secondary">{exercise.equipment}</Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {exercise.sets} sets x {exercise.reps} - {exercise.restSeconds}s rest - {exercise.difficulty}
          </p>
          {!compact ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Alternative: <span className="text-foreground">{exercise.alternative}</span>
            </p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={`/exercise-library/${exercise.exerciseId}`}>
              <PlayCircle className="h-4 w-4" />
              Video
            </Link>
          </Button>
          <span className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary">
            {compact ? <CheckCircle2 className="h-4 w-4" /> : <Dumbbell className="h-4 w-4" />}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
