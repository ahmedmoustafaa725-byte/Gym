"use client";

import { createContext, useContext, useMemo } from "react";
import { demoCheckins, demoFoodLogs, demoProgress } from "@/data/demo";
import { meals as seedMeals } from "@/data/meals";
import { defaultProfile } from "@/data/onboarding";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { todayISO } from "@/lib/date";
import { estimateTargets, generateWorkoutPlan } from "@/services/ai/workoutGenerator";
import type { FoodLog, Meal, Profile, ProgressEntry, WeeklyCheckin, WorkoutPlan, WorkoutSession } from "@/types";

type AppStateContextValue = {
  profile: Profile;
  setProfile: React.Dispatch<React.SetStateAction<Profile>>;
  targets: ReturnType<typeof estimateTargets>;
  workoutPlan: WorkoutPlan;
  setWorkoutPlan: React.Dispatch<React.SetStateAction<WorkoutPlan>>;
  foodLogs: FoodLog[];
  addFoodLog: (log: Omit<FoodLog, "id" | "userId" | "date"> & { date?: string }) => void;
  updateFoodLog: (id: string, patch: Partial<FoodLog>) => void;
  deleteFoodLog: (id: string) => void;
  meals: Meal[];
  setMeals: React.Dispatch<React.SetStateAction<Meal[]>>;
  progress: ProgressEntry[];
  setProgress: React.Dispatch<React.SetStateAction<ProgressEntry[]>>;
  checkins: WeeklyCheckin[];
  setCheckins: React.Dispatch<React.SetStateAction<WeeklyCheckin[]>>;
  sessions: WorkoutSession[];
  setSessions: React.Dispatch<React.SetStateAction<WorkoutSession[]>>;
  hydrated: boolean;
};

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile, profileHydrated] = useLocalStorage<Profile>("nilefit:profile", defaultProfile);
  const [workoutPlan, setWorkoutPlan, planHydrated] = useLocalStorage<WorkoutPlan>(
    "nilefit:workout-plan",
    generateWorkoutPlan(defaultProfile)
  );
  const [foodLogs, setFoodLogs, logsHydrated] = useLocalStorage<FoodLog[]>("nilefit:food-logs", demoFoodLogs);
  const [meals, setMeals, mealsHydrated] = useLocalStorage<Meal[]>("nilefit:meals", seedMeals);
  const [progress, setProgress, progressHydrated] = useLocalStorage<ProgressEntry[]>("nilefit:progress", demoProgress);
  const [checkins, setCheckins, checkinsHydrated] = useLocalStorage<WeeklyCheckin[]>("nilefit:checkins", demoCheckins);
  const [sessions, setSessions, sessionsHydrated] = useLocalStorage<WorkoutSession[]>("nilefit:sessions", []);

  const value = useMemo<AppStateContextValue>(
    () => ({
      profile,
      setProfile,
      targets: estimateTargets(profile),
      workoutPlan,
      setWorkoutPlan,
      foodLogs,
      addFoodLog(log) {
        setFoodLogs((current) => [
          {
            ...log,
            id: `log-${crypto.randomUUID()}`,
            userId: profile.userId,
            date: log.date ?? todayISO()
          },
          ...current
        ]);
      },
      updateFoodLog(id, patch) {
        setFoodLogs((current) => current.map((log) => (log.id === id ? { ...log, ...patch } : log)));
      },
      deleteFoodLog(id) {
        setFoodLogs((current) => current.filter((log) => log.id !== id));
      },
      meals,
      setMeals,
      progress,
      setProgress,
      checkins,
      setCheckins,
      sessions,
      setSessions,
      hydrated:
        profileHydrated &&
        planHydrated &&
        logsHydrated &&
        mealsHydrated &&
        progressHydrated &&
        checkinsHydrated &&
        sessionsHydrated
    }),
    [
      checkins,
      checkinsHydrated,
      foodLogs,
      logsHydrated,
      meals,
      mealsHydrated,
      planHydrated,
      profile,
      profileHydrated,
      progress,
      progressHydrated,
      sessions,
      sessionsHydrated,
      setCheckins,
      setFoodLogs,
      setMeals,
      setProfile,
      setProgress,
      setSessions,
      setWorkoutPlan,
      workoutPlan
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) throw new Error("useAppState must be used inside AppStateProvider");
  return context;
}
