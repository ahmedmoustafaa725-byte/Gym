import type { Exercise, MacroTarget, Meal, Profile, WorkoutPlan } from "@/types";

export type PlanValidation = {
  valid: boolean;
  issues: string[];
};

export function validateWorkoutPlan(plan: WorkoutPlan, profile: Profile, exerciseCatalog: Exercise[]): PlanValidation {
  const issues: string[] = [];
  const exerciseIds = new Set(exerciseCatalog.map((exercise) => exercise.id));

  if (!plan.name.trim()) issues.push("Workout plan name is missing.");
  if (!plan.days.length) issues.push("Workout plan has no training days.");
  if (plan.days.length > profile.daysPerWeek) issues.push("Workout plan has more days than the user can train.");

  plan.days.forEach((day, index) => {
    if (!day.title.trim()) issues.push(`Day ${index + 1} is missing a title.`);
    if (day.estimatedMinutes > profile.minutesPerWorkout + 20) issues.push(`${day.title} is longer than the preferred workout duration.`);
    if (!day.exercises.length) issues.push(`${day.title} has no exercises.`);
    day.exercises.forEach((exercise) => {
      if (!exerciseIds.has(exercise.exerciseId)) issues.push(`${exercise.name} is not in the exercise library.`);
      if (profile.experience === "beginner" && exercise.difficulty === "advanced") issues.push(`${exercise.name} is too advanced for a beginner plan.`);
      if (exercise.sets < 1 || exercise.sets > 6) issues.push(`${exercise.name} has unrealistic set count.`);
      if (exercise.restSeconds < 30 || exercise.restSeconds > 300) issues.push(`${exercise.name} has unrealistic rest time.`);
    });
  });

  if (profile.injuries.trim()) {
    const injury = profile.injuries.toLowerCase();
    const risky = plan.days.flatMap((day) => day.exercises).filter((exercise) => injury.includes("knee") && /jump|burpee|lunge/i.test(exercise.name));
    if (risky.length) issues.push("Plan may conflict with the user's knee limitation.");
  }

  return { valid: issues.length === 0, issues };
}

export function validateMealPlan(meals: Meal[], targets: MacroTarget): PlanValidation {
  const issues: string[] = [];
  if (!meals.length) issues.push("Diet plan contains no meals.");

  meals.forEach((meal) => {
    if (!meal.name.trim()) issues.push("A meal is missing its name.");
    if (meal.calories <= 0 || meal.calories > 1600) issues.push(`${meal.name} has unrealistic calories.`);
    if (meal.protein < 0 || meal.carbs < 0 || meal.fat < 0) issues.push(`${meal.name} has negative macro values.`);
  });

  const total = meals.reduce(
    (sum, meal) => ({
      calories: sum.calories + meal.calories,
      protein: sum.protein + meal.protein,
      carbs: sum.carbs + meal.carbs,
      fat: sum.fat + meal.fat
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  if (total.calories < targets.calories * 0.65) issues.push("Diet plan calories are too low for the target.");
  if (total.calories > targets.calories * 1.25) issues.push("Diet plan calories are too high for the target.");
  if (total.protein < targets.protein * 0.65) issues.push("Diet plan protein is too low for the target.");
  if (total.fat > targets.fat * 1.6) issues.push("Diet plan fat is too high for the target.");

  return { valid: issues.length === 0, issues };
}
