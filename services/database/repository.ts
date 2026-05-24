import { exercises as seedExercises } from "@/data/exercises";
import { meals as seedMeals } from "@/data/meals";
import { shouldUseSupabase, supabase } from "@/lib/supabase";
import { estimateTargets } from "@/services/ai/workoutGenerator";
import type {
  AdminSetting,
  AiGeneratedPlan,
  BodyMeasurements,
  ChatMessage,
  Exercise,
  ExerciseLog,
  FoodItem,
  FoodLog,
  Meal,
  MealPlan,
  NutritionReferenceTarget,
  OnboardingAnswers,
  Profile,
  ProgressEntry,
  ProgressPhoto,
  ScheduledWorkout,
  WeeklyCheckin,
  WorkoutPlan,
  WorkoutSession
} from "@/types";

type Row = Record<string, any>;

export function canUseDatabase() {
  return Boolean(shouldUseSupabase && supabase);
}

function client() {
  return canUseDatabase() ? supabase : null;
}

function isUuid(value?: string) {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
}

function compact<T extends Row>(row: T) {
  return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined)) as Partial<T>;
}

function num(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function arr(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

function mapProfile(row: Row): Profile {
  return {
    userId: String(row.user_id),
    age: num(row.age, 28),
    gender: row.gender ?? "prefer_not_to_say",
    heightCm: num(row.height_cm, 175),
    weightKg: num(row.weight_kg, 75),
    goal: row.goal ?? "general_fitness",
    experience: row.experience ?? "beginner",
    activityLevel: row.activity_level ?? "moderate",
    trainingLocation: row.training_location ?? "both",
    equipment: arr(row.equipment),
    daysPerWeek: num(row.days_per_week, 3),
    minutesPerWorkout: num(row.minutes_per_workout, 45),
    injuries: row.injuries ?? "",
    preferredTrainingStyle: row.preferred_training_style ?? "",
    dietPreference: row.diet_preference ?? "normal",
    foodAllergies: row.food_allergies ?? "",
    dislikedFoods: row.disliked_foods ?? "",
    favoriteMeals: row.favorite_meals ?? "",
    preferredCuisine: row.preferred_cuisine ?? "Egyptian",
    mealsPerDay: num(row.meals_per_day, 3),
    targetWeightKg: row.target_weight_kg == null ? undefined : num(row.target_weight_kg),
    budgetLevel: row.budget_level ?? "medium",
    cookingTime: row.cooking_time ?? "moderate"
  };
}

function profileRow(profile: Profile) {
  return {
    user_id: profile.userId,
    age: profile.age,
    gender: profile.gender,
    height_cm: profile.heightCm,
    weight_kg: profile.weightKg,
    goal: profile.goal,
    experience: profile.experience,
    activity_level: profile.activityLevel,
    training_location: profile.trainingLocation,
    equipment: profile.equipment,
    days_per_week: profile.daysPerWeek,
    minutes_per_workout: profile.minutesPerWorkout,
    injuries: profile.injuries,
    preferred_training_style: profile.preferredTrainingStyle,
    diet_preference: profile.dietPreference,
    food_allergies: profile.foodAllergies,
    disliked_foods: profile.dislikedFoods,
    favorite_meals: profile.favoriteMeals,
    preferred_cuisine: profile.preferredCuisine,
    meals_per_day: profile.mealsPerDay,
    target_weight_kg: profile.targetWeightKg,
    budget_level: profile.budgetLevel,
    cooking_time: profile.cookingTime,
    updated_at: new Date().toISOString()
  };
}

function mapFoodLog(row: Row): FoodLog {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    date: String(row.log_date ?? row.date),
    mealName: row.meal_name ?? row.mealName ?? "Food",
    source: row.source ?? "manual",
    mealId: row.meal_id ?? undefined,
    foodItemId: row.food_item_id ?? undefined,
    mealTime: row.meal_time ?? undefined,
    servingSize: row.serving_size ?? undefined,
    quantity: row.quantity == null ? undefined : num(row.quantity, 1),
    calories: num(row.calories),
    protein: num(row.protein),
    carbs: num(row.carbs),
    fat: num(row.fat),
    fiber: row.fiber == null ? undefined : num(row.fiber),
    notes: row.notes ?? undefined
  };
}

function foodLogRow(log: FoodLog | (Omit<FoodLog, "id"> & { id?: string })) {
  return compact({
    id: isUuid(log.id) ? log.id : undefined,
    user_id: log.userId,
    meal_id: log.mealId,
    food_item_id: log.foodItemId,
    log_date: log.date,
    meal_name: log.mealName,
    source: log.source,
    meal_time: log.mealTime,
    serving_size: log.servingSize,
    quantity: log.quantity,
    calories: log.calories,
    protein: log.protein,
    carbs: log.carbs,
    fat: log.fat,
    fiber: log.fiber,
    notes: log.notes
  });
}

function mapProgress(row: Row): ProgressEntry {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    date: String(row.entry_date),
    weightKg: num(row.weight_kg),
    waistCm: row.waist_cm == null ? undefined : num(row.waist_cm),
    hipsCm: row.hips_cm == null ? undefined : num(row.hips_cm),
    chestCm: row.chest_cm == null ? undefined : num(row.chest_cm),
    underbustCm: row.underbust_cm == null ? undefined : num(row.underbust_cm),
    neckCm: row.neck_cm == null ? undefined : num(row.neck_cm),
    shouldersCm: row.shoulders_cm == null ? undefined : num(row.shoulders_cm),
    armCm: row.arm_cm == null ? undefined : num(row.arm_cm),
    leftArmCm: row.left_arm_cm == null ? undefined : num(row.left_arm_cm),
    rightArmCm: row.right_arm_cm == null ? undefined : num(row.right_arm_cm),
    thighCm: row.thigh_cm == null ? undefined : num(row.thigh_cm),
    leftThighCm: row.left_thigh_cm == null ? undefined : num(row.left_thigh_cm),
    rightThighCm: row.right_thigh_cm == null ? undefined : num(row.right_thigh_cm),
    glutesCm: row.glutes_cm == null ? undefined : num(row.glutes_cm),
    calvesCm: row.calves_cm == null ? undefined : num(row.calves_cm),
    caloriesAverage: row.calories_average == null ? undefined : num(row.calories_average),
    proteinAverage: row.protein_average == null ? undefined : num(row.protein_average),
    workoutConsistency: row.workout_consistency == null ? undefined : num(row.workout_consistency),
    notes: row.notes ?? undefined,
    photoPath: row.photo_path ?? undefined,
    photoUrl: row.photo_url ?? undefined
  };
}

function progressRow(entry: ProgressEntry) {
  return compact({
    id: isUuid(entry.id) ? entry.id : undefined,
    user_id: entry.userId,
    entry_date: entry.date,
    weight_kg: entry.weightKg,
    waist_cm: entry.waistCm,
    hips_cm: entry.hipsCm,
    chest_cm: entry.chestCm,
    underbust_cm: entry.underbustCm,
    neck_cm: entry.neckCm,
    shoulders_cm: entry.shouldersCm,
    arm_cm: entry.armCm,
    left_arm_cm: entry.leftArmCm,
    right_arm_cm: entry.rightArmCm,
    thigh_cm: entry.thighCm,
    left_thigh_cm: entry.leftThighCm,
    right_thigh_cm: entry.rightThighCm,
    glutes_cm: entry.glutesCm,
    calves_cm: entry.calvesCm,
    calories_average: entry.caloriesAverage,
    protein_average: entry.proteinAverage,
    workout_consistency: entry.workoutConsistency,
    notes: entry.notes,
    photo_path: entry.photoPath,
    photo_url: entry.photoUrl
  });
}

function mapCheckin(row: Row): WeeklyCheckin {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    weekStart: String(row.week_start),
    currentWeightKg: row.current_weight_kg == null ? undefined : num(row.current_weight_kg),
    mood: num(row.mood, 3),
    moodText: row.mood_text ?? undefined,
    energy: num(row.energy, 3),
    hunger: num(row.hunger, 3),
    sleepHours: num(row.sleep_hours, 7),
    sleepQuality: row.sleep_quality == null ? undefined : num(row.sleep_quality),
    trainingConsistency: row.training_consistency == null ? undefined : num(row.training_consistency),
    dietConsistency: row.diet_consistency == null ? undefined : num(row.diet_consistency),
    trainingDifficulty: num(row.training_difficulty, 3),
    notes: row.notes ?? undefined,
    photoPath: row.photo_path ?? undefined,
    photoUrl: row.photo_url ?? undefined
  };
}

function checkinRow(checkin: WeeklyCheckin) {
  return compact({
    id: isUuid(checkin.id) ? checkin.id : undefined,
    user_id: checkin.userId,
    week_start: checkin.weekStart,
    current_weight_kg: checkin.currentWeightKg,
    mood: checkin.mood,
    mood_text: checkin.moodText,
    energy: checkin.energy,
    hunger: checkin.hunger,
    sleep_hours: checkin.sleepHours,
    sleep_quality: checkin.sleepQuality,
    training_consistency: checkin.trainingConsistency,
    diet_consistency: checkin.dietConsistency,
    training_difficulty: checkin.trainingDifficulty,
    notes: checkin.notes,
    photo_path: checkin.photoPath,
    photo_url: checkin.photoUrl
  });
}

function mapExercise(row: Row): Exercise {
  const video = Array.isArray(row.exercise_videos) ? row.exercise_videos[0] : undefined;
  return {
    id: String(row.id),
    name: row.name ?? "Exercise",
    arabicName: row.arabic_name ?? undefined,
    muscleGroup: row.muscle_group ?? row.muscleGroup ?? "Full body",
    equipment: row.equipment ?? "Bodyweight",
    difficulty: row.difficulty ?? "beginner",
    videoUrl: video?.video_url ?? row.video_url ?? "",
    thumbnail: video?.thumbnail ?? row.thumbnail ?? "",
    videoSource: video?.source ?? row.videoSource ?? "Seed placeholder",
    videoLinks: [],
    licenseNote: video?.license_note ?? row.licenseNote ?? "Verify video license before public use.",
    instructions: arr(row.instructions),
    commonMistakes: arr(row.common_mistakes ?? row.commonMistakes),
    alternatives: arr(row.alternatives)
  };
}

function exerciseRow(exercise: Exercise) {
  return {
    id: exercise.id,
    name: exercise.name,
    arabic_name: exercise.arabicName,
    muscle_group: exercise.muscleGroup,
    equipment: exercise.equipment,
    difficulty: exercise.difficulty,
    instructions: exercise.instructions,
    common_mistakes: exercise.commonMistakes,
    alternatives: exercise.alternatives,
    updated_at: new Date().toISOString()
  };
}

function mapMeal(row: Row): Meal {
  return {
    id: String(row.id),
    name: row.name ?? "Meal",
    arabicName: row.arabic_name ?? undefined,
    aliases: arr(row.aliases),
    cuisine: row.cuisine ?? "Egyptian",
    tags: arr(row.tags),
    portionSize: row.portion_size ?? row.portionSize ?? "1 serving",
    calories: num(row.calories),
    protein: num(row.protein),
    carbs: num(row.carbs),
    fat: num(row.fat),
    normalCalories: row.normal_calories ?? undefined,
    fitnessCalories: row.fitness_calories ?? undefined,
    ingredients: Array.isArray(row.ingredients) ? row.ingredients : [],
    instructions: arr(row.instructions),
    healthierTips: arr(row.healthier_tips ?? row.healthierTips),
    allergyNotes: row.allergy_notes ?? undefined,
    budgetLevel: row.budget_level ?? "medium",
    cookingTimeMinutes: num(row.cooking_time_minutes)
  };
}

function mealRow(meal: Meal, userId?: string) {
  return {
    id: meal.id,
    name: meal.name,
    arabic_name: meal.arabicName,
    aliases: meal.aliases,
    cuisine: meal.cuisine,
    tags: meal.tags,
    portion_size: meal.portionSize,
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fat: meal.fat,
    normal_calories: meal.normalCalories,
    fitness_calories: meal.fitnessCalories,
    instructions: meal.instructions,
    healthier_tips: meal.healthierTips,
    allergy_notes: meal.allergyNotes,
    budget_level: meal.budgetLevel,
    cooking_time_minutes: meal.cookingTimeMinutes,
    created_by: userId,
    updated_at: new Date().toISOString()
  };
}

function mapFoodItem(row: Row): FoodItem {
  return {
    id: String(row.id),
    foodName: row.food_name ?? "Food",
    servingSize: row.serving_size ?? "1 serving",
    calories: num(row.calories),
    proteinG: num(row.protein_g),
    carbsG: num(row.carbs_g),
    fatG: num(row.fat_g),
    fiberG: row.fiber_g == null ? undefined : num(row.fiber_g),
    category: row.category ?? undefined,
    cuisine: row.cuisine ?? undefined,
    aliases: arr(row.aliases),
    sourceType: row.source_type ?? "seed",
    isGlobal: Boolean(row.is_global ?? true),
    createdBy: row.created_by ?? undefined
  };
}

function mapPlan(row: Row): WorkoutPlan {
  const saved = (row.plan ?? {}) as Partial<WorkoutPlan>;
  return {
    id: String(row.id),
    name: row.name ?? saved.name ?? "Workout plan",
    userId: String(row.user_id),
    goal: row.goal ?? saved.goal ?? "general_fitness",
    daysPerWeek: num(row.days_per_week, saved.daysPerWeek ?? 0),
    split: row.split ?? saved.split ?? "Custom",
    generatedAt: String(row.generated_at ?? saved.generatedAt ?? new Date().toISOString()),
    days: Array.isArray(saved.days) ? saved.days : []
  };
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const c = client();
  if (!c) return null;
  const { data, error } = await c.from("profiles").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data ? mapProfile(data) : null;
}

export async function upsertProfile(profile: Profile): Promise<Profile> {
  const c = client();
  if (!c) return profile;
  const { data, error } = await c.from("profiles").upsert(profileRow(profile), { onConflict: "user_id" }).select("*").single();
  if (error) throw error;
  return mapProfile(data);
}

export async function markOnboardingComplete(userId: string, complete = true) {
  const c = client();
  if (!c) return;
  await c.from("users").update({ onboarding_complete: complete, updated_at: new Date().toISOString() }).eq("id", userId);
}

export async function saveOnboardingAnswers(profile: Profile): Promise<OnboardingAnswers | null> {
  const c = client();
  if (!c) return null;
  const { data, error } = await c.from("onboarding_answers").insert({ user_id: profile.userId, answers: profile }).select("*").single();
  if (error) throw error;
  return { id: data.id, userId: data.user_id, answers: data.answers, completedAt: data.completed_at };
}

export async function saveCalorieTarget(profile: Profile) {
  const target = estimateTargets(profile);
  const c = client();
  if (!c) return target;
  const { error } = await c.from("calorie_targets").insert({
    user_id: profile.userId,
    calories: target.calories,
    protein: target.protein,
    carbs: target.carbs,
    fat: target.fat,
    fiber: target.fiber,
    water_ml: target.waterMl,
    starts_on: new Date().toISOString().slice(0, 10)
  });
  if (error) throw error;
  return target;
}

export async function listExercises(): Promise<Exercise[]> {
  const c = client();
  if (!c) return seedExercises;
  const { data, error } = await c.from("exercises").select("*, exercise_videos(*)").order("name");
  if (error) return seedExercises;
  const mapped = (data ?? []).map(mapExercise);
  return mapped.length ? mapped : seedExercises;
}

export async function upsertExercise(exercise: Exercise) {
  const c = client();
  if (!c) return exercise;
  const { data, error } = await c.from("exercises").upsert(exerciseRow(exercise), { onConflict: "id" }).select("*").single();
  if (error) throw error;
  if (exercise.videoUrl) {
    await c.from("exercise_videos").insert({ exercise_id: exercise.id, video_url: exercise.videoUrl, thumbnail: exercise.thumbnail, source: exercise.videoSource, license_note: exercise.licenseNote, is_verified: false });
  }
  return mapExercise(data);
}

export async function deleteExercise(id: string) {
  const c = client();
  if (!c) return;
  const { error } = await c.from("exercises").delete().eq("id", id);
  if (error) throw error;
}

export async function listMeals(): Promise<Meal[]> {
  const c = client();
  if (!c) return seedMeals;
  const { data, error } = await c.from("meals").select("*, ingredients(name, amount, calories)").order("name");
  if (error) return seedMeals;
  return (data ?? []).map(mapMeal);
}

export async function upsertMeal(meal: Meal, userId?: string) {
  const c = client();
  if (!c) return meal;
  const { data, error } = await c.from("meals").upsert(mealRow(meal, userId), { onConflict: "id" }).select("*").single();
  if (error) throw error;
  await c.from("ingredients").delete().eq("meal_id", meal.id);
  if (meal.ingredients.length) await c.from("ingredients").insert(meal.ingredients.map((ingredient) => ({ meal_id: meal.id, ...ingredient })));
  return mapMeal({ ...data, ingredients: meal.ingredients });
}

export async function deleteMeal(id: string) {
  const c = client();
  if (!c) return;
  const { error } = await c.from("meals").delete().eq("id", id);
  if (error) throw error;
}

export async function listFoodItems(options: { query?: string; cuisine?: string } = {}): Promise<FoodItem[]> {
  const c = client();
  if (!c) return [];
  let q = c.from("food_items").select("*").order("food_name");
  if (options.cuisine && options.cuisine !== "all") q = q.eq("cuisine", options.cuisine);
  if (options.query?.trim()) {
    const term = `%${options.query.trim()}%`;
    q = q.or(`food_name.ilike.${term},serving_size.ilike.${term},category.ilike.${term},cuisine.ilike.${term}`);
  }
  const { data, error } = await q.limit(250);
  if (error) return [];
  return (data ?? []).map(mapFoodItem);
}

export async function createFoodLog(log: Omit<FoodLog, "id"> & { id?: string }): Promise<FoodLog> {
  const c = client();
  if (!c) return { ...log, id: log.id ?? `log-${crypto.randomUUID()}` };
  const { data, error } = await c.from("food_logs").insert(foodLogRow(log)).select("*").single();
  if (error) throw error;
  return mapFoodLog(data);
}

export async function listFoodLogs(userId: string): Promise<FoodLog[]> {
  const c = client();
  if (!c) return [];
  const { data, error } = await c.from("food_logs").select("*").eq("user_id", userId).order("log_date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapFoodLog);
}

export async function updateFoodLog(id: string, patch: Partial<FoodLog>): Promise<FoodLog | null> {
  const c = client();
  if (!c || !isUuid(id)) return null;
  const { data, error } = await c.from("food_logs").update(foodLogRow({ ...(patch as FoodLog), id })).eq("id", id).select("*").single();
  if (error) throw error;
  return mapFoodLog(data);
}

export async function deleteFoodLog(id: string) {
  const c = client();
  if (!c || !isUuid(id)) return;
  const { error } = await c.from("food_logs").delete().eq("id", id);
  if (error) throw error;
}

export async function getActiveWorkoutPlan(userId: string): Promise<WorkoutPlan | null> {
  const c = client();
  if (!c) return null;
  const { data, error } = await c.from("workout_plans").select("*").eq("user_id", userId).order("generated_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data ? mapPlan(data) : null;
}

export async function saveWorkoutPlan(plan: WorkoutPlan): Promise<WorkoutPlan> {
  const c = client();
  if (!c) return plan;
  const { data, error } = await c
    .from("workout_plans")
    .upsert(compact({ id: isUuid(plan.id) ? plan.id : undefined, user_id: plan.userId, name: plan.name, goal: plan.goal, days_per_week: plan.daysPerWeek, split: plan.split, plan, generated_at: plan.generatedAt }), { onConflict: "id" })
    .select("*")
    .single();
  if (error) throw error;
  return mapPlan(data);
}

function mapSession(row: Row): WorkoutSession {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    workoutDayId: row.workout_day_id ?? "",
    scheduledWorkoutId: row.scheduled_workout_id ?? undefined,
    date: String(row.session_date),
    difficultyRating: row.difficulty_rating == null ? undefined : num(row.difficulty_rating),
    notes: row.notes ?? undefined,
    sets: Array.isArray(row.sets) ? row.sets : [],
    completedAt: row.completed_at ?? undefined
  };
}

export async function listWorkoutSessions(userId: string): Promise<WorkoutSession[]> {
  const c = client();
  if (!c) return [];
  const { data, error } = await c.from("workout_sessions").select("*").eq("user_id", userId).order("session_date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapSession);
}

export async function upsertWorkoutSession(session: WorkoutSession): Promise<WorkoutSession> {
  const c = client();
  if (!c) return session;
  const { data, error } = await c.from("workout_sessions").insert(compact({ id: isUuid(session.id) ? session.id : undefined, user_id: session.userId, workout_day_id: session.workoutDayId, scheduled_workout_id: session.scheduledWorkoutId, session_date: session.date, difficulty_rating: session.difficultyRating, notes: session.notes, sets: session.sets, completed_at: session.completedAt ?? new Date().toISOString() })).select("*").single();
  if (error) throw error;
  return mapSession(data);
}

export async function saveExerciseLogs(logs: ExerciseLog[]) {
  const c = client();
  if (!c || !logs.length) return logs;
  const { data, error } = await c.from("exercise_logs").insert(logs.map((log) => compact({ id: isUuid(log.id) ? log.id : undefined, user_id: log.userId, workout_session_id: isUuid(log.workoutSessionId) ? log.workoutSessionId : undefined, exercise_id: log.exerciseId, exercise_name: log.exerciseName, planned_sets: log.plannedSets, planned_reps: log.plannedReps, actual_sets: log.actualSets, actual_reps: log.actualReps, weight_kg: log.weightKg, notes: log.notes, completed: log.completed }))).select("*");
  if (error) throw error;
  return data as ExerciseLog[];
}

export async function listProgressEntries(userId: string): Promise<ProgressEntry[]> {
  const c = client();
  if (!c) return [];
  const { data, error } = await c.from("progress_entries").select("*").eq("user_id", userId).order("entry_date", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapProgress);
}

export async function upsertProgressEntry(entry: ProgressEntry): Promise<ProgressEntry> {
  const c = client();
  if (!c) return entry;
  const { data, error } = await c.from("progress_entries").insert(progressRow(entry)).select("*").single();
  if (error) throw error;
  return mapProgress(data);
}

export async function deleteProgressEntry(id: string) {
  const c = client();
  if (!c || !isUuid(id)) return;
  const { error } = await c.from("progress_entries").delete().eq("id", id);
  if (error) throw error;
}

export async function listWeeklyCheckins(userId: string): Promise<WeeklyCheckin[]> {
  const c = client();
  if (!c) return [];
  const { data, error } = await c.from("weekly_checkins").select("*").eq("user_id", userId).order("week_start", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapCheckin);
}

export async function upsertWeeklyCheckin(checkin: WeeklyCheckin): Promise<WeeklyCheckin> {
  const c = client();
  if (!c) return checkin;
  const { data, error } = await c.from("weekly_checkins").insert(checkinRow(checkin)).select("*").single();
  if (error) throw error;
  return mapCheckin(data);
}

export async function uploadProgressPhoto(userId: string, file: File, label = "progress-photo") {
  const c = client();
  if (!c) throw new Error("Supabase Storage is not configured.");
  const extension = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${Date.now()}-${label.replace(/[^a-z0-9-]/gi, "-").toLowerCase()}.${extension}`;
  const uploaded = await c.storage.from("progress-photos").upload(path, file, { upsert: false });
  if (uploaded.error) throw uploaded.error;
  const signed = await c.storage.from("progress-photos").createSignedUrl(path, 60 * 60 * 24 * 7);
  if (signed.error) throw signed.error;
  await c.from("progress_photos").insert({ user_id: userId, storage_path: path, photo_url: signed.data.signedUrl, label });
  return { path, url: signed.data.signedUrl };
}

export async function listProgressPhotos(userId: string): Promise<ProgressPhoto[]> {
  const c = client();
  if (!c) return [];
  const { data, error } = await c.from("progress_photos").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []).map((row) => ({ id: row.id, userId: row.user_id, progressEntryId: row.progress_entry_id, weeklyCheckinId: row.weekly_checkin_id, storagePath: row.storage_path, photoUrl: row.photo_url, label: row.label, createdAt: row.created_at }));
}

export async function listScheduledWorkouts(userId: string): Promise<ScheduledWorkout[]> {
  const c = client();
  if (!c) return [];
  const { data, error } = await c.from("scheduled_workouts").select("*").eq("user_id", userId).order("scheduled_date");
  if (error) return [];
  return (data ?? []).map((row) => ({ id: row.id, userId: row.user_id, workoutPlanId: row.workout_plan_id, workoutDayId: row.workout_day_id, scheduledDate: row.scheduled_date, status: row.status ?? "scheduled", notes: row.notes }));
}

export async function upsertScheduledWorkout(item: ScheduledWorkout) {
  const c = client();
  if (!c) return item;
  const { data, error } = await c.from("scheduled_workouts").upsert(compact({ id: isUuid(item.id) ? item.id : undefined, user_id: item.userId, workout_plan_id: isUuid(item.workoutPlanId) ? item.workoutPlanId : undefined, workout_day_id: item.workoutDayId, scheduled_date: item.scheduledDate, status: item.status, notes: item.notes })).select("*").single();
  if (error) throw error;
  return { id: data.id, userId: data.user_id, workoutPlanId: data.workout_plan_id, workoutDayId: data.workout_day_id, scheduledDate: data.scheduled_date, status: data.status, notes: data.notes } as ScheduledWorkout;
}

export async function saveMealPlan(plan: MealPlan) {
  const c = client();
  if (!c) return plan;
  const { data, error } = await c.from("meal_plans").insert({ user_id: plan.userId, name: plan.name, plan_date: plan.planDate, meals: plan.meals, shopping_list: plan.shoppingList, note: plan.note }).select("*").single();
  if (error) throw error;
  return { ...plan, id: data.id, createdAt: data.created_at };
}

export async function saveChatMessage(userId: string, message: ChatMessage) {
  const c = client();
  if (!c) return message;
  const { data, error } = await c.from("chat_messages").insert({ user_id: userId, role: message.role, content: message.content, parsed_food_log: message.parsedFoodLog }).select("*").single();
  if (error) throw error;
  return { id: data.id, role: data.role, content: data.content, createdAt: data.created_at, parsedFoodLog: data.parsed_food_log } as ChatMessage;
}

export async function listAdminSettings(): Promise<AdminSetting[]> {
  const c = client();
  if (!c) return [];
  const { data, error } = await c.from("admin_settings").select("*").order("key");
  if (error) return [];
  return (data ?? []).map((row) => ({ id: row.id, key: row.key, value: row.value, category: row.category ?? "feature" }));
}

export async function upsertAdminSetting(setting: AdminSetting) {
  const c = client();
  if (!c) return setting;
  const { data, error } = await c.from("admin_settings").upsert(compact({ id: isUuid(setting.id) ? setting.id : undefined, key: setting.key, value: setting.value, category: setting.category }), { onConflict: "key" }).select("*").single();
  if (error) throw error;
  return { id: data.id, key: data.key, value: data.value, category: data.category } as AdminSetting;
}

export async function listUsers() {
  const c = client();
  if (!c) return [];
  const { data, error } = await c.from("users").select("id, email, name, role, onboarding_complete").order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []).map((row) => ({ id: row.id, email: row.email, name: row.name, role: row.role ?? "user", onboardingComplete: Boolean(row.onboarding_complete) }));
}

export async function upsertUserRow(user: { id: string; email: string; name: string; role: "user" | "admin"; onboardingComplete: boolean }) {
  const c = client();
  if (!c) return user;
  const { data, error } = await c.from("users").upsert({ id: user.id, email: user.email, name: user.name, role: user.role, onboarding_complete: user.onboardingComplete, updated_at: new Date().toISOString() }, { onConflict: "id" }).select("id, email, name, role, onboarding_complete").single();
  if (error) throw error;
  return { id: data.id, email: data.email, name: data.name, role: data.role, onboardingComplete: Boolean(data.onboarding_complete) };
}

export async function saveAiGeneratedPlan(plan: Omit<AiGeneratedPlan, "id" | "createdAt">) {
  const c = client();
  if (!c) return null;
  const { data, error } = await c.from("ai_generated_plans").insert({ user_id: plan.userId, plan_type: plan.planType, provider: plan.provider, model: plan.model, prompt: plan.prompt, response: plan.response, validation_status: plan.validationStatus, validation_notes: plan.validationNotes }).select("*").single();
  if (error) throw error;
  return { id: data.id, userId: data.user_id, planType: data.plan_type, provider: data.provider, model: data.model, prompt: data.prompt, response: data.response, validationStatus: data.validation_status, validationNotes: data.validation_notes, createdAt: data.created_at } as AiGeneratedPlan;
}

export async function listNutritionReferenceTargets(): Promise<NutritionReferenceTarget[]> {
  const c = client();
  if (!c) return [];
  const { data, error } = await c.from("nutrition_reference_targets").select("*").order("nutrient");
  if (error) return [];
  return (data ?? []).map((row) => ({ id: row.id, nutrient: row.nutrient, referenceBody: row.reference_body, population: row.population, minValue: row.min_value, maxValue: row.max_value, unit: row.unit, note: row.note }));
}

export async function saveBodyMeasurements(measurement: BodyMeasurements) {
  const c = client();
  if (!c) return measurement;
  const { data, error } = await c.from("body_measurements").insert({ user_id: measurement.userId, progress_entry_id: isUuid(measurement.progressEntryId) ? measurement.progressEntryId : undefined, measured_at: measurement.measuredAt, waist_cm: measurement.waistCm, hips_cm: measurement.hipsCm, chest_cm: measurement.chestCm, underbust_cm: measurement.underbustCm, neck_cm: measurement.neckCm, shoulders_cm: measurement.shouldersCm, left_arm_cm: measurement.leftArmCm, right_arm_cm: measurement.rightArmCm, left_thigh_cm: measurement.leftThighCm, right_thigh_cm: measurement.rightThighCm, glutes_cm: measurement.glutesCm, calves_cm: measurement.calvesCm, notes: measurement.notes }).select("*").single();
  if (error) throw error;
  return { ...measurement, id: data.id };
}
