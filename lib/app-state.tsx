"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { demoCheckins, demoFoodLogs, demoProgress } from "@/data/demo";
import { meals as seedMeals } from "@/data/meals";
import { defaultProfile } from "@/data/onboarding";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useAuth } from "@/lib/auth-context";
import { todayISO } from "@/lib/date";
import { shouldUseSupabase } from "@/lib/supabase";
import { estimateTargets, generateWorkoutPlan } from "@/services/ai/workoutGenerator";
import {
  createFoodLog,
  deleteFoodLog as deleteFoodLogInDb,
  deleteMeal,
  getActiveWorkoutPlan,
  getProfile,
  listFoodItems,
  listFoodLogs,
  listMeals,
  listProgressEntries,
  listWeeklyCheckins,
  listWorkoutSessions,
  saveCalorieTarget,
  saveExerciseLogs,
  saveWorkoutPlan,
  updateFoodLog as updateFoodLogInDb,
  uploadProgressPhoto as uploadProgressPhotoInDb,
  upsertMeal,
  upsertProfile,
  upsertProgressEntry,
  upsertWeeklyCheckin,
  upsertWorkoutSession
} from "@/services/database/repository";
import type { FoodItem, FoodLog, Meal, Profile, ProgressEntry, WeeklyCheckin, WorkoutPlan, WorkoutSession } from "@/types";

type AppStateContextValue = {
  profile: Profile;
  setProfile: React.Dispatch<React.SetStateAction<Profile>>;
  targets: ReturnType<typeof estimateTargets>;
  workoutPlan: WorkoutPlan;
  setWorkoutPlan: React.Dispatch<React.SetStateAction<WorkoutPlan>>;
  foodLogs: FoodLog[];
  addFoodLog: (log: Omit<FoodLog, "id" | "userId" | "date"> & { date?: string }) => Promise<FoodLog>;
  updateFoodLog: (id: string, patch: Partial<FoodLog>) => void;
  deleteFoodLog: (id: string) => void;
  meals: Meal[];
  setMeals: React.Dispatch<React.SetStateAction<Meal[]>>;
  foodItems: FoodItem[];
  progress: ProgressEntry[];
  setProgress: React.Dispatch<React.SetStateAction<ProgressEntry[]>>;
  checkins: WeeklyCheckin[];
  setCheckins: React.Dispatch<React.SetStateAction<WeeklyCheckin[]>>;
  sessions: WorkoutSession[];
  setSessions: React.Dispatch<React.SetStateAction<WorkoutSession[]>>;
  uploadProgressPhoto: (file: File, label?: string) => Promise<{ path: string; url: string }>;
  refreshAppData: () => Promise<void>;
  dataMode: "supabase" | "mock";
  hydrated: boolean;
};

const AppStateContext = createContext<AppStateContextValue | null>(null);

function applyUpdate<T>(action: React.SetStateAction<T>, current: T): T {
  return typeof action === "function" ? (action as (previous: T) => T)(current) : action;
}

function emptyWorkoutPlan(profile: Profile): WorkoutPlan {
  return {
    id: `empty-${profile.userId}`,
    name: "No workout plan yet",
    userId: profile.userId,
    goal: profile.goal,
    daysPerWeek: profile.daysPerWeek,
    split: "Generated after onboarding",
    generatedAt: new Date().toISOString(),
    days: []
  };
}

function profileForUser(userId?: string): Profile {
  return {
    ...defaultProfile,
    userId: userId ?? defaultProfile.userId,
    equipment: [],
    injuries: "",
    preferredTrainingStyle: "",
    dietPreference: "normal",
    foodAllergies: "",
    dislikedFoods: "",
    favoriteMeals: "",
    preferredCuisine: "Egyptian",
    mealsPerDay: 3,
    targetWeightKg: undefined
  };
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const realMode = Boolean(user && shouldUseSupabase);

  const [mockProfile, setMockProfile, profileHydrated] = useLocalStorage<Profile>("nilefit:profile", defaultProfile);
  const [mockWorkoutPlan, setMockWorkoutPlan, planHydrated] = useLocalStorage<WorkoutPlan>(
    "nilefit:workout-plan",
    generateWorkoutPlan(defaultProfile)
  );
  const [mockFoodLogs, setMockFoodLogs, logsHydrated] = useLocalStorage<FoodLog[]>("nilefit:food-logs", demoFoodLogs);
  const [mockMeals, setMockMeals, mealsHydrated] = useLocalStorage<Meal[]>("nilefit:meals", seedMeals);
  const [mockProgress, setMockProgress, progressHydrated] = useLocalStorage<ProgressEntry[]>("nilefit:progress", demoProgress);
  const [mockCheckins, setMockCheckins, checkinsHydrated] = useLocalStorage<WeeklyCheckin[]>("nilefit:checkins", demoCheckins);
  const [mockSessions, setMockSessions, sessionsHydrated] = useLocalStorage<WorkoutSession[]>("nilefit:sessions", []);

  const [profileState, setProfileState] = useState<Profile>(profileForUser(user?.id));
  const [workoutPlanState, setWorkoutPlanState] = useState<WorkoutPlan>(emptyWorkoutPlan(profileForUser(user?.id)));
  const [foodLogsState, setFoodLogsState] = useState<FoodLog[]>([]);
  const [mealsState, setMealsState] = useState<Meal[]>([]);
  const [foodItemsState, setFoodItemsState] = useState<FoodItem[]>([]);
  const [progressState, setProgressState] = useState<ProgressEntry[]>([]);
  const [checkinsState, setCheckinsState] = useState<WeeklyCheckin[]>([]);
  const [sessionsState, setSessionsState] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(false);

  const activeProfile = realMode ? profileState : mockProfile;
  const activePlan = realMode ? workoutPlanState : mockWorkoutPlan;
  const activeFoodLogs = realMode ? foodLogsState : mockFoodLogs;
  const activeMeals = realMode ? mealsState : mockMeals;
  const activeProgress = realMode ? progressState : mockProgress;
  const activeCheckins = realMode ? checkinsState : mockCheckins;
  const activeSessions = realMode ? sessionsState : mockSessions;

  const refreshAppData = useCallback(async () => {
    if (!user || !shouldUseSupabase) return;
    setLoading(true);
    try {
      const fallbackProfile = profileForUser(user.id);
      const [
        dbProfile,
        dbWorkoutPlan,
        dbFoodLogs,
        dbMeals,
        dbFoodItems,
        dbProgress,
        dbCheckins,
        dbSessions
      ] = await Promise.all([
        getProfile(user.id),
        getActiveWorkoutPlan(user.id),
        listFoodLogs(user.id),
        listMeals(),
        listFoodItems({ cuisine: "Egyptian" }),
        listProgressEntries(user.id),
        listWeeklyCheckins(user.id),
        listWorkoutSessions(user.id)
      ]);

      const nextProfile = dbProfile ?? fallbackProfile;
      setProfileState(nextProfile);
      setWorkoutPlanState(dbWorkoutPlan ?? emptyWorkoutPlan(nextProfile));
      setFoodLogsState(dbFoodLogs);
      setMealsState(dbMeals);
      setFoodItemsState(dbFoodItems);
      setProgressState(dbProgress);
      setCheckinsState(dbCheckins);
      setSessionsState(dbSessions);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (realMode) {
      void refreshAppData();
      return;
    }

    if (user) {
      setProfileState(profileForUser(user.id));
      setWorkoutPlanState(emptyWorkoutPlan(profileForUser(user.id)));
    }
    setLoading(false);
  }, [realMode, refreshAppData, user]);

  const setProfile: React.Dispatch<React.SetStateAction<Profile>> = useCallback(
    (action) => {
      if (!realMode) {
        setMockProfile(action);
        return;
      }

      const next = applyUpdate(action, activeProfile);
      setProfileState(next);
      void upsertProfile(next).then(setProfileState);
      void saveCalorieTarget(next);
    },
    [activeProfile, realMode, setMockProfile]
  );

  const setWorkoutPlan: React.Dispatch<React.SetStateAction<WorkoutPlan>> = useCallback(
    (action) => {
      if (!realMode) {
        setMockWorkoutPlan(action);
        return;
      }

      const next = applyUpdate(action, activePlan);
      setWorkoutPlanState(next);
      void saveWorkoutPlan(next).then(setWorkoutPlanState);
    },
    [activePlan, realMode, setMockWorkoutPlan]
  );

  const addFoodLog = useCallback(
    async (log: Omit<FoodLog, "id" | "userId" | "date"> & { date?: string }) => {
      const userId = user?.id ?? activeProfile.userId;
      const localLog: FoodLog = {
        ...log,
        id: `log-${crypto.randomUUID()}`,
        userId,
        date: log.date ?? todayISO()
      };

      if (!realMode) {
        setMockFoodLogs((current) => [localLog, ...current]);
        return localLog;
      }

      setFoodLogsState((current) => [localLog, ...current]);
      const saved = await createFoodLog(localLog);
      setFoodLogsState((current) => current.map((item) => (item.id === localLog.id ? saved : item)));
      return saved;
    },
    [activeProfile.userId, realMode, setMockFoodLogs, user?.id]
  );

  const updateFoodLog = useCallback(
    (id: string, patch: Partial<FoodLog>) => {
      if (!realMode) {
        setMockFoodLogs((current) => current.map((log) => (log.id === id ? { ...log, ...patch } : log)));
        return;
      }

      setFoodLogsState((current) => current.map((log) => (log.id === id ? { ...log, ...patch } : log)));
      void updateFoodLogInDb(id, patch).then((saved) => {
        if (!saved) return;
        setFoodLogsState((current) => current.map((log) => (log.id === id ? saved : log)));
      });
    },
    [realMode, setMockFoodLogs]
  );

  const deleteFoodLog = useCallback(
    (id: string) => {
      if (!realMode) {
        setMockFoodLogs((current) => current.filter((log) => log.id !== id));
        return;
      }

      setFoodLogsState((current) => current.filter((log) => log.id !== id));
      void deleteFoodLogInDb(id);
    },
    [realMode, setMockFoodLogs]
  );

  const setMeals: React.Dispatch<React.SetStateAction<Meal[]>> = useCallback(
    (action) => {
      if (!realMode) {
        setMockMeals(action);
        return;
      }

      const next = applyUpdate(action, activeMeals);
      const previousIds = new Set(activeMeals.map((meal) => meal.id));
      const nextIds = new Set(next.map((meal) => meal.id));
      setMealsState(next);
      next.forEach((meal) => void upsertMeal(meal, user?.id));
      previousIds.forEach((id) => {
        if (!nextIds.has(id)) void deleteMeal(id);
      });
    },
    [activeMeals, realMode, setMockMeals, user?.id]
  );

  const setProgress: React.Dispatch<React.SetStateAction<ProgressEntry[]>> = useCallback(
    (action) => {
      if (!realMode) {
        setMockProgress(action);
        return;
      }

      const next = applyUpdate(action, activeProgress);
      const previousIds = new Set(activeProgress.map((entry) => entry.id));
      setProgressState(next);
      next.filter((entry) => !previousIds.has(entry.id)).forEach((entry) => {
        void upsertProgressEntry(entry).then((saved) => {
          setProgressState((current) => current.map((item) => (item.id === entry.id ? saved : item)));
        });
      });
    },
    [activeProgress, realMode, setMockProgress]
  );

  const setCheckins: React.Dispatch<React.SetStateAction<WeeklyCheckin[]>> = useCallback(
    (action) => {
      if (!realMode) {
        setMockCheckins(action);
        return;
      }

      const next = applyUpdate(action, activeCheckins);
      const previousIds = new Set(activeCheckins.map((checkin) => checkin.id));
      setCheckinsState(next);
      next.filter((checkin) => !previousIds.has(checkin.id)).forEach((checkin) => {
        void upsertWeeklyCheckin(checkin).then((saved) => {
          setCheckinsState((current) => current.map((item) => (item.id === checkin.id ? saved : item)));
        });
      });
    },
    [activeCheckins, realMode, setMockCheckins]
  );

  const setSessions: React.Dispatch<React.SetStateAction<WorkoutSession[]>> = useCallback(
    (action) => {
      if (!realMode) {
        setMockSessions(action);
        return;
      }

      const next = applyUpdate(action, activeSessions);
      const previousIds = new Set(activeSessions.map((session) => session.id));
      setSessionsState(next);
      next.filter((session) => !previousIds.has(session.id)).forEach((session) => {
        void upsertWorkoutSession(session).then((saved) => {
          setSessionsState((current) => current.map((item) => (item.id === session.id ? saved : item)));
          void saveExerciseLogs(
            saved.sets.map((set) => ({
              id: `exercise-log-${crypto.randomUUID()}`,
              userId: saved.userId,
              workoutSessionId: saved.id,
              exerciseId: set.exerciseId,
              exerciseName: set.exerciseId.replaceAll("-", " "),
              actualReps: set.reps,
              weightKg: set.weightKg,
              notes: set.notes,
              completed: set.completed
            }))
          );
        });
      });
    },
    [activeSessions, realMode, setMockSessions]
  );

  const uploadProgressPhoto = useCallback(
    async (file: File, label?: string) => {
      if (!realMode) {
        return { path: URL.createObjectURL(file), url: URL.createObjectURL(file) };
      }
      return uploadProgressPhotoInDb(user?.id ?? activeProfile.userId, file, label);
    },
    [activeProfile.userId, realMode, user?.id]
  );

  const value = useMemo<AppStateContextValue>(
    () => ({
      profile: activeProfile,
      setProfile,
      targets: estimateTargets(activeProfile),
      workoutPlan: activePlan,
      setWorkoutPlan,
      foodLogs: activeFoodLogs,
      addFoodLog,
      updateFoodLog,
      deleteFoodLog,
      meals: activeMeals,
      setMeals,
      foodItems: foodItemsState,
      progress: activeProgress,
      setProgress,
      checkins: activeCheckins,
      setCheckins,
      sessions: activeSessions,
      setSessions,
      uploadProgressPhoto,
      refreshAppData,
      dataMode: realMode ? "supabase" : "mock",
      hydrated: realMode
        ? !loading
        : profileHydrated &&
          planHydrated &&
          logsHydrated &&
          mealsHydrated &&
          progressHydrated &&
          checkinsHydrated &&
          sessionsHydrated
    }),
    [
      activeCheckins,
      activeFoodLogs,
      activeMeals,
      activePlan,
      activeProfile,
      activeProgress,
      activeSessions,
      addFoodLog,
      checkinsHydrated,
      deleteFoodLog,
      foodItemsState,
      logsHydrated,
      mealsHydrated,
      planHydrated,
      profileHydrated,
      progressHydrated,
      realMode,
      refreshAppData,
      sessionsHydrated,
      setCheckins,
      setMeals,
      setProfile,
      setProgress,
      setSessions,
      setWorkoutPlan,
      updateFoodLog,
      uploadProgressPhoto,
      loading
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) throw new Error("useAppState must be used inside AppStateProvider");
  return context;
}
