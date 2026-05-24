import type { FoodLog, ProgressEntry, User, WeeklyCheckin } from "@/types";

export const demoUser: User = {
  id: "demo-user",
  email: "demo@nilefit.app",
  name: "Demo Athlete",
  role: "admin",
  onboardingComplete: true
};

export const demoFoodLogs: FoodLog[] = [
  {
    id: "log-1",
    userId: "demo-user",
    date: new Date().toISOString().slice(0, 10),
    mealName: "Ful Medames + Boiled Eggs",
    source: "meal_plan",
    calories: 470,
    protein: 30,
    carbs: 50,
    fat: 18
  },
  {
    id: "log-2",
    userId: "demo-user",
    date: new Date().toISOString().slice(0, 10),
    mealName: "Grilled Chicken and Rice",
    source: "manual",
    calories: 510,
    protein: 48,
    carbs: 54,
    fat: 10
  }
];

export const demoProgress: ProgressEntry[] = [
  { id: "p1", userId: "demo-user", date: "2026-05-03", weightKg: 83.4, waistCm: 96, caloriesAverage: 2310, proteinAverage: 128, workoutConsistency: 62 },
  { id: "p2", userId: "demo-user", date: "2026-05-10", weightKg: 82.9, waistCm: 95, caloriesAverage: 2240, proteinAverage: 142, workoutConsistency: 76 },
  { id: "p3", userId: "demo-user", date: "2026-05-17", weightKg: 82.2, waistCm: 94, caloriesAverage: 2190, proteinAverage: 148, workoutConsistency: 83 },
  { id: "p4", userId: "demo-user", date: "2026-05-24", weightKg: 81.8, waistCm: 93, caloriesAverage: 2160, proteinAverage: 154, workoutConsistency: 86 }
];

export const demoCheckins: WeeklyCheckin[] = [
  {
    id: "checkin-1",
    userId: "demo-user",
    weekStart: "2026-05-18",
    mood: 4,
    energy: 4,
    hunger: 3,
    sleepHours: 7,
    trainingDifficulty: 3,
    notes: "Workouts felt better after moving carbs around training."
  }
];
