import { NextResponse } from "next/server";
import { exercises } from "@/data/exercises";
import { generateGeminiJSON } from "@/services/ai/geminiClient";
import { validateWorkoutPlan } from "@/services/ai/planVerifier";
import { generateWorkoutPlan } from "@/services/ai/workoutGenerator";
import type { Profile, WorkoutDay, WorkoutExercise, WorkoutPlan } from "@/types";

function normalizeExercise(raw: Partial<WorkoutExercise>, fallback: WorkoutExercise): WorkoutExercise {
  const exercise = exercises.find((item) => item.id === raw.exerciseId) ?? exercises.find((item) => item.name === raw.name);
  return {
    ...fallback,
    exerciseId: exercise?.id ?? fallback.exerciseId,
    name: exercise?.name ?? raw.name ?? fallback.name,
    sets: Number(raw.sets ?? fallback.sets),
    reps: String(raw.reps ?? fallback.reps),
    restSeconds: Number(raw.restSeconds ?? fallback.restSeconds),
    targetMuscle: exercise?.muscleGroup ?? raw.targetMuscle ?? fallback.targetMuscle,
    equipment: exercise?.equipment ?? raw.equipment ?? fallback.equipment,
    difficulty: exercise?.difficulty ?? raw.difficulty ?? fallback.difficulty,
    videoUrl: exercise?.videoUrl ?? raw.videoUrl ?? fallback.videoUrl,
    instructions: raw.instructions?.length ? raw.instructions : exercise?.instructions ?? fallback.instructions,
    commonMistakes: raw.commonMistakes?.length ? raw.commonMistakes : exercise?.commonMistakes ?? fallback.commonMistakes,
    alternative: raw.alternative ?? exercise?.alternatives[0] ?? fallback.alternative
  };
}

function normalizeDay(raw: Partial<WorkoutDay>, fallback: WorkoutDay, index: number): WorkoutDay {
  const rawExercises = Array.isArray(raw.exercises) ? raw.exercises : [];
  const fallbackExercise = fallback.exercises[0] ?? {
    exerciseId: exercises[0].id,
    name: exercises[0].name,
    sets: 3,
    reps: "8-12",
    restSeconds: 90,
    targetMuscle: exercises[0].muscleGroup,
    equipment: exercises[0].equipment,
    difficulty: exercises[0].difficulty,
    videoUrl: exercises[0].videoUrl,
    instructions: exercises[0].instructions,
    commonMistakes: exercises[0].commonMistakes,
    alternative: exercises[0].alternatives[0] ?? "Bodyweight variation"
  };
  return {
    ...fallback,
    id: String(raw.id ?? fallback.id),
    title: String(raw.title ?? fallback.title),
    focus: String(raw.focus ?? fallback.focus),
    dayIndex: Number(raw.dayIndex ?? fallback.dayIndex ?? index),
    estimatedMinutes: Number(raw.estimatedMinutes ?? fallback.estimatedMinutes),
    exercises: (rawExercises.length ? rawExercises : fallback.exercises).map((exercise, exerciseIndex) =>
      normalizeExercise(exercise, fallback.exercises[exerciseIndex] ?? fallbackExercise)
    )
  };
}

function normalizePlan(raw: Partial<WorkoutPlan>, fallback: WorkoutPlan): WorkoutPlan {
  const rawDays = Array.isArray(raw.days) ? raw.days : [];
  return {
    ...fallback,
    id: String(raw.id ?? fallback.id),
    userId: fallback.userId,
    name: String(raw.name ?? fallback.name),
    goal: fallback.goal,
    daysPerWeek: Number(raw.daysPerWeek ?? fallback.daysPerWeek),
    split: String(raw.split ?? fallback.split),
    generatedAt: new Date().toISOString(),
    days: (rawDays.length ? rawDays : fallback.days).map((day, index) => normalizeDay(day, fallback.days[index] ?? fallback.days[0], index))
  };
}

export async function POST(request: Request) {
  const { profile } = (await request.json()) as { profile: Profile };
  if (!process.env.GEMINI_API_KEY || process.env.AI_PROVIDER !== "gemini") {
    return NextResponse.json({ error: "Gemini is not configured. Set GEMINI_API_KEY and AI_PROVIDER=gemini." }, { status: 503 });
  }
  const fallback = generateWorkoutPlan(profile, profile.userId);
  const exerciseCatalog = exercises.map((exercise) => ({
    id: exercise.id,
    name: exercise.name,
    muscleGroup: exercise.muscleGroup,
    equipment: exercise.equipment,
    difficulty: exercise.difficulty,
    alternatives: exercise.alternatives
  }));

  const prompt = `
You are NileFit AI, a safe fitness coach.
Generate a personalized workout program from this user profile.
Use only exercise IDs from the exercise catalog.
Respect injuries and limitations. Do not recommend training through serious pain.
Include rest time, target muscle, equipment, instructions, common mistakes, and alternatives.
If the user has little time, keep workouts shorter and focused.

Return ONLY JSON matching this structure:
{
  "id": "plan-id",
  "name": "string",
  "daysPerWeek": 4,
  "split": "string",
  "days": [
    {
      "id": "day-id",
      "title": "string",
      "focus": "string",
      "dayIndex": 0,
      "estimatedMinutes": 45,
      "exercises": [
        {
          "exerciseId": "bench-press",
          "name": "Bench Press",
          "sets": 4,
          "reps": "8-10",
          "restSeconds": 90,
          "targetMuscle": "Chest",
          "equipment": "Barbell",
          "difficulty": "beginner",
          "instructions": ["string"],
          "commonMistakes": ["string"],
          "alternative": "string"
        }
      ]
    }
  ]
}

User profile:
${JSON.stringify(profile)}

Exercise catalog:
${JSON.stringify(exerciseCatalog)}
`;

  const raw = await generateGeminiJSON<Partial<WorkoutPlan>>(prompt, fallback, { temperature: 0.35 });
  let normalized = normalizePlan(raw, fallback);
  let validation = validateWorkoutPlan(normalized, profile, exercises);

  if (!validation.valid) {
    const retryPrompt = `${prompt}

The previous response failed validation for these reasons:
${validation.issues.map((issue) => `- ${issue}`).join("\n")}

Retry once. Return only valid JSON.`;
    const retryRaw = await generateGeminiJSON<Partial<WorkoutPlan>>(retryPrompt, fallback, { temperature: 0.2 });
    normalized = normalizePlan(retryRaw, fallback);
    validation = validateWorkoutPlan(normalized, profile, exercises);
  }

  if (!validation.valid) {
    return NextResponse.json(
      { error: "Generated workout plan failed verification.", issues: validation.issues },
      { status: 422 }
    );
  }

  return NextResponse.json({ plan: normalized, verified: true, issues: [] });
}
