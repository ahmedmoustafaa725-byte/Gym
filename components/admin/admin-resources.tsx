"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminGuard } from "@/components/admin/admin-guard";
import { ResourceManager } from "@/components/admin/resource-manager";
import { aiPromptTemplates } from "@/data/ai-prompts";
import { demoUser } from "@/data/demo";
import { exercises } from "@/data/exercises";
import { defaultProfile } from "@/data/onboarding";
import { useAppState } from "@/lib/app-state";
import {
  deleteExercise,
  deleteWorkoutTemplate,
  listAdminSettings,
  listExercises,
  listUsers,
  listWorkoutTemplates,
  upsertAdminSetting,
  upsertExercise,
  upsertUserRow,
  upsertWorkoutTemplate
} from "@/services/database/repository";
import { generateWorkoutPlan } from "@/services/ai/workoutGenerator";
import type { AdminSetting, Exercise, Meal, User, WorkoutTemplate } from "@/types";

export function ManageExercises() {
  const [rows, setRows] = useState<Exercise[]>(exercises);
  useEffect(() => {
    void listExercises().then(setRows);
  }, []);
  const persistRows = useCallback<React.Dispatch<React.SetStateAction<Exercise[]>>>((action) => {
    setRows((current) => {
      const next = typeof action === "function" ? (action as (previous: Exercise[]) => Exercise[])(current) : action;
      const nextIds = new Set(next.map((item) => item.id));
      next.forEach((item) => void upsertExercise(item));
      current.forEach((item) => {
        if (!nextIds.has(item.id)) void deleteExercise(item.id);
      });
      return next;
    });
  }, []);
  return (
    <AdminGuard>
      <ResourceManager
        title="Exercises"
        description="Manage exercise names, muscles, equipment, difficulty, instructions, mistakes, alternatives, and video metadata."
        rows={rows}
        setRows={persistRows}
        columns={[
          { key: "name", label: "Name" },
          { key: "muscleGroup", label: "Muscle" },
          { key: "equipment", label: "Equipment" },
          { key: "difficulty", label: "Difficulty" },
          { key: "videoSource", label: "Video source" }
        ]}
        createItem={() => ({
          id: `exercise-${crypto.randomUUID()}`,
          name: "New Exercise",
          muscleGroup: "Full body",
          equipment: "Bodyweight",
          difficulty: "beginner",
          videoUrl: "",
          thumbnail: "",
          videoSource: "Seed placeholder",
          licenseNote: "Add verified source and attribution before production use.",
          instructions: ["Add instructions"],
          commonMistakes: ["Add mistake"],
          alternatives: ["Add alternative"]
        } satisfies Exercise)}
      />
    </AdminGuard>
  );
}

export function ManageMeals() {
  const { meals, setMeals } = useAppState();
  return (
    <AdminGuard>
      <ResourceManager
        title="Meals"
        description="Manage Egyptian food aliases, normal/fitness calories, macros, tags, ingredients, and allergy warnings."
        rows={meals}
        setRows={setMeals}
        columns={[
          { key: "name", label: "Name" },
          { key: "arabicName", label: "Arabic" },
          { key: "cuisine", label: "Cuisine" },
          { key: "calories", label: "Calories" },
          { key: "protein", label: "Protein" }
        ]}
        createItem={() => ({
          id: `meal-${crypto.randomUUID()}`,
          name: "New Meal",
          arabicName: "",
          aliases: ["new meal"],
          cuisine: "Egyptian",
          tags: ["Admin added"],
          portionSize: "1 serving",
          calories: 400,
          protein: 25,
          carbs: 45,
          fat: 12,
          ingredients: [{ name: "Ingredient", amount: "1 serving" }],
          instructions: ["Add instructions"],
          healthierTips: ["Add healthier prep tip"],
          budgetLevel: "medium",
          cookingTimeMinutes: 20
        } satisfies Meal)}
      />
    </AdminGuard>
  );
}

export function ManageUsers() {
  const [rows, setRows] = useState<User[]>([demoUser]);
  useEffect(() => {
    void listUsers().then((users) => setRows(users.length ? users : [demoUser]));
  }, []);
  const persistRows = useCallback<React.Dispatch<React.SetStateAction<User[]>>>((action) => {
    setRows((current) => {
      const next = typeof action === "function" ? (action as (previous: User[]) => User[])(current) : action;
      next.forEach((item) => {
        if (item.id) void upsertUserRow(item);
      });
      return next;
    });
  }, []);
  return (
    <AdminGuard>
      <ResourceManager
        title="Users"
        description="Manage user overview and roles. Supabase RLS protects user-owned data."
        rows={rows}
        setRows={persistRows}
        columns={[
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "role", label: "Role" },
          { key: "onboardingComplete", label: "Onboarded" }
        ]}
        createItem={() => ({
          id: crypto.randomUUID(),
          name: "New User",
          email: "new@nilefit.app",
          role: "user",
          onboardingComplete: false
        } satisfies User)}
      />
    </AdminGuard>
  );
}

export function ManageWorkoutTemplates() {
  const defaultPlan = useMemo(() => generateWorkoutPlan(defaultProfile), []);
  const [rows, setRows] = useState<WorkoutTemplate[]>([
    {
      id: "00000000-0000-4000-8000-000000000101",
      name: "Beginner Full Body",
      goal: "general_fitness",
      daysPerWeek: 3,
      split: "Full body",
      template: defaultPlan
    }
  ]);
  useEffect(() => {
    void listWorkoutTemplates().then((templates) =>
      setRows(
        templates.length
          ? templates
          : [
              {
                id: "00000000-0000-4000-8000-000000000101",
                name: "Beginner Full Body",
                goal: "general_fitness",
                daysPerWeek: 3,
                split: "Full body",
                template: defaultPlan
              }
            ]
      )
    );
  }, [defaultPlan]);
  const persistRows = useCallback<React.Dispatch<React.SetStateAction<WorkoutTemplate[]>>>((action) => {
    setRows((current) => {
      const next = typeof action === "function" ? (action as (previous: WorkoutTemplate[]) => WorkoutTemplate[])(current) : action;
      const nextIds = new Set(next.map((item) => item.id));
      next.forEach((item) => void upsertWorkoutTemplate(item));
      current.forEach((item) => {
        if (!nextIds.has(item.id)) void deleteWorkoutTemplate(item.id);
      });
      return next;
    });
  }, []);
  return (
    <AdminGuard>
      <ResourceManager
        title="Workout Templates"
        description="Manage reusable templates that the generator can select before personalizing."
        rows={rows}
        setRows={persistRows}
        columns={[
          { key: "name", label: "Name" },
          { key: "goal", label: "Goal" },
          { key: "daysPerWeek", label: "Days" },
          { key: "split", label: "Split" }
        ]}
        createItem={() => ({
          id: crypto.randomUUID(),
          name: "New Template",
          goal: "fat_loss",
          daysPerWeek: 4,
          split: "Upper/lower",
          template: defaultPlan
        } satisfies WorkoutTemplate)}
      />
    </AdminGuard>
  );
}

export function ManageAIPrompts() {
  const [rows, setRows] = useState<AdminSetting[]>(aiPromptTemplates);
  useEffect(() => {
    void listAdminSettings().then((settings) => setRows(settings.length ? settings : aiPromptTemplates));
  }, []);
  const persistRows = useCallback<React.Dispatch<React.SetStateAction<AdminSetting[]>>>((action) => {
    setRows((current) => {
      const next = typeof action === "function" ? (action as (previous: AdminSetting[]) => AdminSetting[])(current) : action;
      next.forEach((item) => void upsertAdminSetting(item));
      return next;
    });
  }, []);
  return (
    <AdminGuard>
      <ResourceManager
        title="AI Prompts"
        description="Manage system prompts for parser, workout generator, check-ins, and future AI personalization."
        rows={rows}
        setRows={persistRows}
        columns={[
          { key: "key", label: "Key" },
          { key: "category", label: "Category" },
          { key: "value", label: "Prompt" }
        ]}
        createItem={() => ({
          id: `prompt-${crypto.randomUUID()}`,
          key: "new_prompt",
          value: "Write prompt instructions here.",
          category: "ai_prompt"
        } satisfies AdminSetting)}
      />
    </AdminGuard>
  );
}
