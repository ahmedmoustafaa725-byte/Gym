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
  createScheduledWorkoutsFromPlan,
  createFoodLog,
  deleteBodyMeasurement as deleteBodyMeasurementInDb,
  deleteFoodLog as deleteFoodLogInDb,
  deleteMealPlan,
  deleteMeal,
  deleteProgressEntry as deleteProgressEntryInDb,
  deleteProgressPhoto as deleteProgressPhotoInDb,
  getActiveWorkoutPlan,
  getProfile,
  listBodyMeasurements,
  listFoodItems,
  listFoodLogs,
  listMealPlans,
  listMeals,
  listProgressEntries,
  listProgressPhotos,
  listScheduledWorkouts,
  listWeeklyCheckins,
  listWorkoutSessions,
  saveCalorieTarget,
  saveBodyMeasurements,
  saveExerciseLogs,
  saveMealPlan,
  upsertScheduledWorkout,
  saveWorkoutPlan,
  updateFoodLog as updateFoodLogInDb,
  uploadProgressPhoto as uploadProgressPhotoInDb,
  upsertMeal,
  upsertProfile,
  upsertProgressEntry,
  upsertWeeklyCheckin,
  upsertWorkoutSession
} from "@/services/database/repository";
import type {
  BodyMeasurements,
  FoodItem,
  FoodLog,
  Meal,
  MealPlan,
  Profile,
  ProgressEntry,
  ProgressPhoto,
  ScheduledWorkout,
  WeeklyCheckin,
  WorkoutPlan,
  WorkoutSession
} from "@/types";

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
  mealPlans: MealPlan[];
  setMealPlans: React.Dispatch<React.SetStateAction<MealPlan[]>>;
  foodItems: FoodItem[];
  scheduledWorkouts: ScheduledWorkout[];
  setScheduledWorkouts: React.Dispatch<React.SetStateAction<ScheduledWorkout[]>>;
  progress: ProgressEntry[];
  setProgress: React.Dispatch<React.SetStateAction<ProgressEntry[]>>;
  deleteProgressEntry: (id: string) => void;
  checkins: WeeklyCheckin[];
  setCheckins: React.Dispatch<React.SetStateAction<WeeklyCheckin[]>>;
  sessions: WorkoutSession[];
  setSessions: React.Dispatch<React.SetStateAction<WorkoutSession[]>>;
  progressPhotos: ProgressPhoto[];
  uploadProgressPhoto: (file: File, label?: string) => Promise<{ path: string; url: string }>;
  deleteProgressPhoto: (photo: { id?: string; storagePath?: string; progressEntryId?: string; weeklyCheckinId?: string }) => Promise<void>;
  bodyMeasurements: BodyMeasurements[];
  saveBodyMeasurement: (measurement: BodyMeasurements) => Promise<BodyMeasurements>;
  deleteBodyMeasurement: (id: string) => Promise<void>;
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
  const [mockMealPlans, setMockMealPlans, mealPlansHydrated] = useLocalStorage<MealPlan[]>("nilefit:meal-plans", []);
  const [mockScheduledWorkouts, setMockScheduledWorkouts, scheduledHydrated] = useLocalStorage<ScheduledWorkout[]>("nilefit:scheduled-workouts", []);
  const [mockProgress, setMockProgress, progressHydrated] = useLocalStorage<ProgressEntry[]>("nilefit:progress", demoProgress);
  const [mockProgressPhotos, setMockProgressPhotos, photosHydrated] = useLocalStorage<ProgressPhoto[]>("nilefit:progress-photos", []);
  const [mockBodyMeasurements, setMockBodyMeasurements, measurementsHydrated] = useLocalStorage<BodyMeasurements[]>("nilefit:body-measurements", []);
  const [mockCheckins, setMockCheckins, checkinsHydrated] = useLocalStorage<WeeklyCheckin[]>("nilefit:checkins", demoCheckins);
  const [mockSessions, setMockSessions, sessionsHydrated] = useLocalStorage<WorkoutSession[]>("nilefit:sessions", []);

  const [profileState, setProfileState] = useState<Profile>(profileForUser(user?.id));
  const [workoutPlanState, setWorkoutPlanState] = useState<WorkoutPlan>(emptyWorkoutPlan(profileForUser(user?.id)));
  const [foodLogsState, setFoodLogsState] = useState<FoodLog[]>([]);
  const [mealsState, setMealsState] = useState<Meal[]>([]);
  const [mealPlansState, setMealPlansState] = useState<MealPlan[]>([]);
  const [foodItemsState, setFoodItemsState] = useState<FoodItem[]>([]);
  const [scheduledWorkoutsState, setScheduledWorkoutsState] = useState<ScheduledWorkout[]>([]);
  const [progressState, setProgressState] = useState<ProgressEntry[]>([]);
  const [progressPhotosState, setProgressPhotosState] = useState<ProgressPhoto[]>([]);
  const [bodyMeasurementsState, setBodyMeasurementsState] = useState<BodyMeasurements[]>([]);
  const [checkinsState, setCheckinsState] = useState<WeeklyCheckin[]>([]);
  const [sessionsState, setSessionsState] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(false);

  const activeProfile = realMode ? profileState : mockProfile;
  const activePlan = realMode ? workoutPlanState : mockWorkoutPlan;
  const activeFoodLogs = realMode ? foodLogsState : mockFoodLogs;
  const activeMeals = realMode ? mealsState : mockMeals;
  const activeMealPlans = realMode ? mealPlansState : mockMealPlans;
  const activeScheduledWorkouts = realMode ? scheduledWorkoutsState : mockScheduledWorkouts;
  const activeProgress = realMode ? progressState : mockProgress;
  const activeProgressPhotos = realMode ? progressPhotosState : mockProgressPhotos;
  const activeBodyMeasurements = realMode ? bodyMeasurementsState : mockBodyMeasurements;
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
        dbMealPlans,
        dbFoodItems,
        dbScheduledWorkouts,
        dbProgress,
        dbProgressPhotos,
        dbBodyMeasurements,
        dbCheckins,
        dbSessions
      ] = await Promise.all([
        getProfile(user.id),
        getActiveWorkoutPlan(user.id),
        listFoodLogs(user.id),
        listMeals(),
        listMealPlans(user.id),
        listFoodItems({ cuisine: "all" }),
        listScheduledWorkouts(user.id),
        listProgressEntries(user.id),
        listProgressPhotos(user.id),
        listBodyMeasurements(user.id),
        listWeeklyCheckins(user.id),
        listWorkoutSessions(user.id)
      ]);

      const nextProfile = dbProfile ?? fallbackProfile;
      setProfileState(nextProfile);
      setWorkoutPlanState(dbWorkoutPlan ?? emptyWorkoutPlan(nextProfile));
      setFoodLogsState(dbFoodLogs);
      const seededMealIds = new Set(seedMeals.map((meal) => meal.id));
      const extraDbMeals = dbMeals.filter((meal) => !seededMealIds.has(meal.id));
      setMealsState([...seedMeals, ...extraDbMeals]);
      setMealPlansState(dbMealPlans);
      setFoodItemsState(dbFoodItems);
      setScheduledWorkoutsState(dbScheduledWorkouts);
      setProgressState(dbProgress);
      setProgressPhotosState(dbProgressPhotos);
      setBodyMeasurementsState(dbBodyMeasurements);
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
      void saveWorkoutPlan(next).then((saved) => {
        setWorkoutPlanState(saved);
        void createScheduledWorkoutsFromPlan(saved).then(setScheduledWorkoutsState);
      });
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

  const setMealPlans: React.Dispatch<React.SetStateAction<MealPlan[]>> = useCallback(
    (action) => {
      if (!realMode) {
        setMockMealPlans(action);
        return;
      }

      const next = applyUpdate(action, activeMealPlans);
      const previousIds = new Set(activeMealPlans.map((plan) => plan.id));
      const nextIds = new Set(next.map((plan) => plan.id));
      setMealPlansState(next);
      next.forEach((plan) => {
        void saveMealPlan(plan).then((saved) => {
          setMealPlansState((current) => current.map((item) => (item.id === plan.id ? saved : item)));
        });
      });
      previousIds.forEach((id) => {
        if (!nextIds.has(id)) void deleteMealPlan(id);
      });
    },
    [activeMealPlans, realMode, setMockMealPlans]
  );

  const setScheduledWorkouts: React.Dispatch<React.SetStateAction<ScheduledWorkout[]>> = useCallback(
    (action) => {
      if (!realMode) {
        setMockScheduledWorkouts(action);
        return;
      }

      const next = applyUpdate(action, activeScheduledWorkouts);
      setScheduledWorkoutsState(next);
      next.forEach((item) => {
        void upsertScheduledWorkout(item).then((saved) => {
          setScheduledWorkoutsState((current) => current.map((workout) => (workout.id === item.id ? saved : workout)));
        });
      });
    },
    [activeScheduledWorkouts, realMode, setMockScheduledWorkouts]
  );

  const setProgress: React.Dispatch<React.SetStateAction<ProgressEntry[]>> = useCallback(
    (action) => {
      if (!realMode) {
        setMockProgress(action);
        return;
      }

      const next = applyUpdate(action, activeProgress);
      const previousIds = new Set(activeProgress.map((entry) => entry.id));
      const nextIds = new Set(next.map((entry) => entry.id));
      setProgressState(next);
      next.forEach((entry) => {
        void upsertProgressEntry(entry).then((saved) => {
          setProgressState((current) => current.map((item) => (item.id === entry.id ? saved : item)));
        });
      });
      previousIds.forEach((id) => {
        if (!nextIds.has(id)) void deleteProgressEntryInDb(id);
      });
    },
    [activeProgress, realMode, setMockProgress]
  );

  const deleteProgressEntry = useCallback(
    (id: string) => {
      if (!realMode) {
        setMockProgress((current) => current.filter((entry) => entry.id !== id));
        return;
      }

      setProgressState((current) => current.filter((entry) => entry.id !== id));
      void deleteProgressEntryInDb(id);
    },
    [realMode, setMockProgress]
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
          if (saved.scheduledWorkoutId) {
            const scheduled = activeScheduledWorkouts.find((item) => item.id === saved.scheduledWorkoutId);
            if (scheduled) {
              const completedSchedule: ScheduledWorkout = { ...scheduled, status: "completed" };
              setScheduledWorkoutsState((current) => current.map((item) => (item.id === completedSchedule.id ? completedSchedule : item)));
              void upsertScheduledWorkout(completedSchedule);
            }
          }
        });
      });
    },
    [activeScheduledWorkouts, activeSessions, realMode, setMockSessions]
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

  const deleteProgressPhoto = useCallback(
    async (photo: { id?: string; storagePath?: string; progressEntryId?: string; weeklyCheckinId?: string }) => {
      if (!realMode) {
        setMockProgressPhotos((current) => current.filter((item) => item.id !== photo.id && item.storagePath !== photo.storagePath));
        setMockProgress((current) =>
          current.map((entry) =>
            entry.id === photo.progressEntryId || entry.photoPath === photo.storagePath ? { ...entry, photoPath: undefined, photoUrl: undefined } : entry
          )
        );
        setMockCheckins((current) =>
          current.map((checkin) =>
            checkin.id === photo.weeklyCheckinId || checkin.photoPath === photo.storagePath ? { ...checkin, photoPath: undefined, photoUrl: undefined } : checkin
          )
        );
        return;
      }

      setProgressPhotosState((current) => current.filter((item) => item.id !== photo.id && item.storagePath !== photo.storagePath));
      setProgressState((current) =>
        current.map((entry) =>
          entry.id === photo.progressEntryId || entry.photoPath === photo.storagePath ? { ...entry, photoPath: undefined, photoUrl: undefined } : entry
        )
      );
      setCheckinsState((current) =>
        current.map((checkin) =>
          checkin.id === photo.weeklyCheckinId || checkin.photoPath === photo.storagePath ? { ...checkin, photoPath: undefined, photoUrl: undefined } : checkin
        )
      );
      await deleteProgressPhotoInDb(photo);
    },
    [realMode, setMockCheckins, setMockProgress, setMockProgressPhotos]
  );

  const saveBodyMeasurement = useCallback(
    async (measurement: BodyMeasurements) => {
      if (!realMode) {
        setMockBodyMeasurements((current) => {
          const exists = current.some((item) => item.id === measurement.id);
          return exists ? current.map((item) => (item.id === measurement.id ? measurement : item)) : [...current, measurement];
        });
        return measurement;
      }

      setBodyMeasurementsState((current) => {
        const exists = current.some((item) => item.id === measurement.id);
        return exists ? current.map((item) => (item.id === measurement.id ? measurement : item)) : [...current, measurement];
      });
      const saved = await saveBodyMeasurements(measurement);
      setBodyMeasurementsState((current) => current.map((item) => (item.id === measurement.id ? saved : item)));
      return saved;
    },
    [realMode, setMockBodyMeasurements]
  );

  const deleteBodyMeasurement = useCallback(
    async (id: string) => {
      if (!realMode) {
        setMockBodyMeasurements((current) => current.filter((item) => item.id !== id));
        return;
      }
      setBodyMeasurementsState((current) => current.filter((item) => item.id !== id));
      await deleteBodyMeasurementInDb(id);
    },
    [realMode, setMockBodyMeasurements]
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
      mealPlans: activeMealPlans,
      setMealPlans,
      foodItems: foodItemsState,
      scheduledWorkouts: activeScheduledWorkouts,
      setScheduledWorkouts,
      progress: activeProgress,
      setProgress,
      deleteProgressEntry,
      checkins: activeCheckins,
      setCheckins,
      sessions: activeSessions,
      setSessions,
      progressPhotos: activeProgressPhotos,
      uploadProgressPhoto,
      deleteProgressPhoto,
      bodyMeasurements: activeBodyMeasurements,
      saveBodyMeasurement,
      deleteBodyMeasurement,
      refreshAppData,
      dataMode: realMode ? "supabase" : "mock",
      hydrated: realMode
        ? !loading
        : profileHydrated &&
          planHydrated &&
          logsHydrated &&
          mealsHydrated &&
          mealPlansHydrated &&
          scheduledHydrated &&
          progressHydrated &&
          photosHydrated &&
          measurementsHydrated &&
          checkinsHydrated &&
          sessionsHydrated
    }),
    [
      activeCheckins,
      activeFoodLogs,
      activeMealPlans,
      activeMeals,
      activePlan,
      activeProfile,
      activeBodyMeasurements,
      activeProgressPhotos,
      activeProgress,
      activeScheduledWorkouts,
      activeSessions,
      addFoodLog,
      checkinsHydrated,
      deleteBodyMeasurement,
      deleteFoodLog,
      deleteProgressEntry,
      deleteProgressPhoto,
      foodItemsState,
      logsHydrated,
      mealPlansHydrated,
      mealsHydrated,
      measurementsHydrated,
      planHydrated,
      photosHydrated,
      profileHydrated,
      progressHydrated,
      realMode,
      refreshAppData,
      saveBodyMeasurement,
      scheduledHydrated,
      sessionsHydrated,
      setCheckins,
      setMealPlans,
      setMeals,
      setProfile,
      setProgress,
      setScheduledWorkouts,
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
