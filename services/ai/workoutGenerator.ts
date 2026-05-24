import { exercises } from "@/data/exercises";
import type { Goal, MacroTarget, Profile, WorkoutDay, WorkoutPlan } from "@/types";
import { clampCalories } from "@/lib/safety";

function pickExercise(id: string) {
  const exercise = exercises.find((item) => item.id === id) ?? exercises[0];
  return {
    exerciseId: exercise.id,
    name: exercise.name,
    sets: 3,
    reps: "8-12",
    restSeconds: 90,
    targetMuscle: exercise.muscleGroup,
    equipment: exercise.equipment,
    difficulty: exercise.difficulty,
    videoUrl: exercise.videoUrl,
    instructions: exercise.instructions,
    commonMistakes: exercise.commonMistakes,
    alternative: exercise.alternatives[0] ?? "Bodyweight variation"
  };
}

function makeDay(id: string, title: string, focus: string, dayIndex: number, minutes: number, exerciseIds: string[]): WorkoutDay {
  return {
    id,
    title,
    focus,
    dayIndex,
    estimatedMinutes: minutes,
    exercises: exerciseIds.map((exerciseId, index) => ({
      ...pickExercise(exerciseId),
      sets: index === 0 ? 4 : 3,
      reps: index === exerciseIds.length - 1 ? "12-15" : "8-12",
      restSeconds: index === exerciseIds.length - 1 ? 60 : 90
    }))
  };
}

export function estimateTargets(profile: Profile): MacroTarget {
  const height = profile.heightCm;
  const weight = profile.weightKg;
  const age = profile.age;
  const genderAdjustment = profile.gender === "male" ? 5 : profile.gender === "female" ? -161 : -80;
  const bmr = 10 * weight + 6.25 * height - 5 * age + genderAdjustment;
  const activity = profile.daysPerWeek >= 5 ? 1.55 : profile.daysPerWeek >= 3 ? 1.4 : 1.25;
  const goalAdjustment: Record<Goal, number> = {
    fat_loss: -400,
    muscle_gain: 250,
    maintenance: 0,
    endurance: 100,
    general_fitness: -100
  };
  const calories = clampCalories(bmr * activity + goalAdjustment[profile.goal]);
  const protein = Math.round(weight * (profile.goal === "muscle_gain" ? 2 : 1.7));
  const fat = Math.round((calories * 0.25) / 9);
  const carbs = Math.round((calories - protein * 4 - fat * 9) / 4);
  return { calories, protein, carbs, fat };
}

export function generateWorkoutPlan(profile: Profile, userId = profile.userId): WorkoutPlan {
  const homeOnly = profile.trainingLocation === "home";
  const minutes = Math.max(25, profile.minutesPerWorkout);
  const days: WorkoutDay[] =
    profile.daysPerWeek <= 3
      ? [
          makeDay("full-body-a", "Full Body A", "Squat, push, pull", 0, minutes, homeOnly ? ["bodyweight-squat", "push-up", "dumbbell-row", "plank"] : ["goblet-squat", "bench-press", "lat-pulldown", "romanian-deadlift"]),
          makeDay("full-body-b", "Full Body B", "Hinge, shoulders, core", 2, minutes, homeOnly ? ["romanian-deadlift", "shoulder-press", "push-up", "walking"] : ["romanian-deadlift", "shoulder-press", "seated-cable-row", "dead-bug"]),
          makeDay("full-body-c", "Full Body C", "Volume and conditioning", 4, minutes, homeOnly ? ["walking-lunge", "push-up", "mountain-climber", "plank"] : ["incline-dumbbell-press", "leg-press", "dumbbell-row", "burpee"])
        ]
      : profile.daysPerWeek === 4
        ? [
            makeDay("upper-a", "Upper A", "Chest and back strength", 0, minutes, ["bench-press", "dumbbell-row", "shoulder-press", "lat-pulldown", "triceps-pushdown"]),
            makeDay("lower-a", "Lower A", "Squat and posterior chain", 1, minutes, ["goblet-squat", "romanian-deadlift", "leg-press", "plank"]),
            makeDay("upper-b", "Upper B", "Shoulders and pulling", 3, minutes, ["incline-dumbbell-press", "pull-up", "lateral-raise", "seated-cable-row", "biceps-curl"]),
            makeDay("lower-b", "Lower B", "Leg volume and conditioning", 5, minutes, ["hip-thrust", "walking-lunge", "bodyweight-squat", "dead-bug"])
          ]
        : [
            makeDay("push", "Push Day", "Chest, shoulders, triceps", 0, minutes, ["bench-press", "incline-dumbbell-press", "shoulder-press", "lateral-raise", "triceps-pushdown"]),
            makeDay("pull", "Pull Day", "Back and biceps", 1, minutes, ["lat-pulldown", "dumbbell-row", "seated-cable-row", "pull-up", "biceps-curl"]),
            makeDay("legs", "Leg Day", "Quads, hamstrings, core", 2, minutes, ["goblet-squat", "leg-press", "romanian-deadlift", "hip-thrust", "leg-raise"]),
            makeDay("upper-volume", "Upper Volume", "Technique and pump", 4, minutes, ["push-up", "dumbbell-row", "shoulder-press", "lat-pulldown", "triceps-pushdown"]),
            makeDay("conditioning", "Conditioning", "Fat-loss engine", 5, Math.min(minutes, 35), ["burpee", "mountain-climber", "walking", "plank"])
          ];

  return {
    id: `plan-${userId}`,
    userId,
    name: profile.goal === "fat_loss" ? "Lean Strength Builder" : profile.goal === "muscle_gain" ? "Muscle Growth Split" : "Balanced Performance Plan",
    goal: profile.goal,
    daysPerWeek: Math.min(profile.daysPerWeek, days.length),
    split: profile.daysPerWeek <= 3 ? "Full body" : profile.daysPerWeek === 4 ? "Upper/lower" : "Push/pull/legs",
    generatedAt: new Date().toISOString(),
    days
  };
}

export function getTodayWorkout(plan: WorkoutPlan, date = new Date()) {
  const index = date.getDay() === 0 ? 6 : date.getDay() - 1;
  return plan.days.find((day) => day.dayIndex === index) ?? null;
}

export function shortenWorkout(day: WorkoutDay): WorkoutDay {
  return {
    ...day,
    id: `${day.id}-short`,
    title: `${day.title} - 20 min`,
    estimatedMinutes: 20,
    exercises: day.exercises.slice(0, 3).map((exercise) => ({
      ...exercise,
      sets: Math.min(2, exercise.sets),
      restSeconds: Math.min(60, exercise.restSeconds)
    }))
  };
}
