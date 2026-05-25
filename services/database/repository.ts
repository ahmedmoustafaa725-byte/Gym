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
  WorkoutTemplate,
  WorkoutSession
} from "@/types";

type DbRecord = Record<string, unknown>;

export function canUseDatabase() {
  return Boolean(shouldUseSupabase && supabase);
}

function db() {
  return canUseDatabase() ? supabase : null;
}

function isUuid(value?: string) {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

function compactRow(row: DbRecord) {
  return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined));
}

function mapProfile(row: DbRecord): Profile {
  return {
    userId: String(row.user_id),
    age: asNumber(row.age, 28),
    gender: (row.gender as Profile["gender"]) ?? "prefer_not_to_say",
    heightCm: asNumber(row.height_cm, 175),
    weightKg: asNumber(row.weight_kg, 75),
    goal: (row.goal as Profile["goal"]) ?? "general_fitness",
    experience: (row.experience as Profile["experience"]) ?? "beginner",
    activityLevel: (row.activity_level as Profile["activityLevel"]) ?? "moderate",
    trainingLocation: (row.training_location as Profile["trainingLocation"]) ?? "both",
    equipment: asStringArray(row.equipment),
    daysPerWeek: asNumber(row.days_per_week, 3),
    minutesPerWorkout: asNumber(row.minutes_per_workout, 45),
    injuries: String(row.injuries ?? ""),
    preferredTrainingStyle: String(row.preferred_training_style ?? ""),
    dietPreference: (row.diet_preference as Profile["dietPreference"]) ?? "normal",
    foodAllergies: String(row.food_allergies ?? ""),
    dislikedFoods: String(row.disliked_foods ?? ""),
    favoriteMeals: String(row.favorite_meals ?? ""),
    preferredCuisine: String(row.preferred_cuisine ?? "Egyptian"),
    mealsPerDay: asNumber(row.meals_per_day, 3),
    targetWeightKg: row.target_weight_kg === null || row.target_weight_kg === undefined ? undefined : asNumber(row.target_weight_kg),
    budgetLevel: (row.budget_level as Profile["budgetLevel"]) ?? "medium",
    cookingTime: (row.cooking_time as Profile["cookingTime"]) ?? "moderate"
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

function mapMeal(row: DbRecord): Meal {
  const ingredients = Array.isArray(row.ingredients)
    ? (row.ingredients as DbRecord[]).map((item) => ({
        name: String(item.name ?? ""),
        amount: String(item.amount ?? ""),
        calories: item.calories === null || item.calories === undefined ? undefined : asNumber(item.calories)
      }))
    : [];

  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    arabicName: row.arabic_name ? String(row.arabic_name) : undefined,
    aliases: asStringArray(row.aliases),
    cuisine: (row.cuisine as Meal["cuisine"]) ?? "Egyptian",
    tags: asStringArray(row.tags),
    portionSize: String(row.portion_size ?? "1 serving"),
    calories: asNumber(row.calories),
    protein: asNumber(row.protein),
    carbs: asNumber(row.carbs),
    fat: asNumber(row.fat),
    normalCalories: row.normal_calories ? String(row.normal_calories) : undefined,
    fitnessCalories: row.fitness_calories ? String(row.fitness_calories) : undefined,
    ingredients,
    instructions: asStringArray(row.instructions),
    healthierTips: asStringArray(row.healthier_tips),
    allergyNotes: row.allergy_notes ? String(row.allergy_notes) : undefined,
    budgetLevel: (row.budget_level as Meal["budgetLevel"]) ?? "medium",
    cookingTimeMinutes: asNumber(row.cooking_time_minutes)
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

function mapExercise(row: DbRecord): Exercise {
  const videos = Array.isArray(row.exercise_videos) ? (row.exercise_videos as DbRecord[]) : [];
  const primary = videos[0];
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    arabicName: row.arabic_name ? String(row.arabic_name) : undefined,
    muscleGroup: String(row.muscle_group ?? ""),
    secondaryMuscles: asStringArray(row.secondary_muscles),
    equipment: String(row.equipment ?? ""),
    trainingLocation: (row.training_location as Exercise["trainingLocation"]) ?? "both",
    category: row.category ? String(row.category) : undefined,
    movementPattern: (row.movement_pattern as Exercise["movementPattern"]) ?? undefined,
    difficulty: (row.difficulty as Exercise["difficulty"]) ?? "beginner",
    videoUrl: String(primary?.video_url ?? row.video_url ?? ""),
    sourceUrl: row.source_url ? String(row.source_url) : undefined,
    sourceName: row.source_name ? String(row.source_name) : undefined,
    approximateMatch: Boolean(row.approximate_match ?? false),
    thumbnail: String(primary?.thumbnail ?? row.thumbnail ?? ""),
    videoSource: (primary?.source as Exercise["videoSource"]) ?? "Seed placeholder",
    videoLinks: videos.slice(1).map((video) => ({
      title: String(video.source ?? "Technique video"),
      url: String(video.video_url ?? ""),
      source: "Manual"
    })),
    licenseNote: String(primary?.license_note ?? row.license_note ?? "Verify license before public use."),
    instructions: asStringArray(row.instructions),
    commonMistakes: asStringArray(row.common_mistakes),
    alternatives: asStringArray(row.alternatives)
  };
}

function exerciseRow(exercise: Exercise) {
  return {
    id: exercise.id,
    name: exercise.name,
    arabic_name: exercise.arabicName,
    muscle_group: exercise.muscleGroup,
    secondary_muscles: exercise.secondaryMuscles ?? [],
    equipment: exercise.equipment,
    training_location: exercise.trainingLocation ?? "both",
    category: exercise.category,
    movement_pattern: exercise.movementPattern,
    difficulty: exercise.difficulty,
    source_name: exercise.sourceName,
    source_url: exercise.sourceUrl,
    video_url: exercise.videoUrl,
    approximate_match: Boolean(exercise.approximateMatch),
    instructions: exercise.instructions,
    common_mistakes: exercise.commonMistakes,
    alternatives: exercise.alternatives,
    updated_at: new Date().toISOString()
  };
}

function mapFoodLog(row: DbRecord): FoodLog {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    date: String(row.log_date ?? row.date),
    mealName: String(row.meal_name ?? ""),
    source: (row.source as FoodLog["source"]) ?? "manual",
    mealId: row.meal_id ? String(row.meal_id) : undefined,
    foodItemId: row.food_item_id ? String(row.food_item_id) : undefined,
    mealTime: row.meal_time ? String(row.meal_time) : undefined,
    servingSize: row.serving_size ? String(row.serving_size) : undefined,
    quantity: row.quantity === undefined || row.quantity === null ? undefined : asNumber(row.quantity, 1),
    calories: asNumber(row.calories),
    protein: asNumber(row.protein),
    carbs: asNumber(row.carbs),
    fat: asNumber(row.fat),
    fiber: row.fiber === undefined || row.fiber === null ? undefined : asNumber(row.fiber),
    notes: row.notes ? String(row.notes) : undefined
  };
}

function foodLogRow(log: FoodLog | (Omit<FoodLog, "id"> & { id?: string })) {
  return compactRow({
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

function mapProgress(row: DbRecord): ProgressEntry {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    date: String(row.entry_date),
    weightKg: asNumber(row.weight_kg),
    waistCm: row.waist_cm === null || row.waist_cm === undefined ? undefined : asNumber(row.waist_cm),
    hipsCm: row.hips_cm === null || row.hips_cm === undefined ? undefined : asNumber(row.hips_cm),
    chestCm: row.chest_cm === null || row.chest_cm === undefined ? undefined : asNumber(row.chest_cm),
    underbustCm: row.underbust_cm === null || row.underbust_cm === undefined ? undefined : asNumber(row.underbust_cm),
    neckCm: row.neck_cm === null || row.neck_cm === undefined ? undefined : asNumber(row.neck_cm),
    shouldersCm: row.shoulders_cm === null || row.shoulders_cm === undefined ? undefined : asNumber(row.shoulders_cm),
    leftArmCm: row.left_arm_cm === null || row.left_arm_cm === undefined ? undefined : asNumber(row.left_arm_cm),
    rightArmCm: row.right_arm_cm === null || row.right_arm_cm === undefined ? undefined : asNumber(row.right_arm_cm),
    armCm: row.arm_cm === null || row.arm_cm === undefined ? undefined : asNumber(row.arm_cm),
    leftThighCm: row.left_thigh_cm === null || row.left_thigh_cm === undefined ? undefined : asNumber(row.left_thigh_cm),
    rightThighCm: row.right_thigh_cm === null || row.right_thigh_cm === undefined ? undefined : asNumber(row.right_thigh_cm),
    thighCm: row.thigh_cm === null || row.thigh_cm === undefined ? undefined : asNumber(row.thigh_cm),
    glutesCm: row.glutes_cm === null || row.glutes_cm === undefined ? undefined : asNumber(row.glutes_cm),
    calvesCm: row.calves_cm === null || row.calves_cm === undefined ? undefined : asNumber(row.calves_cm),
    caloriesAverage: row.calories_average === null || row.calories_average === undefined ? undefined : asNumber(row.calories_average),
    proteinAverage: row.protein_average === null || row.protein_average === undefined ? undefined : asNumber(row.protein_average),
    workoutConsistency: row.workout_consistency === null || row.workout_consistency === undefined ? undefined : asNumber(row.workout_consistency),
    notes: row.notes ? String(row.notes) : undefined,
    photoPath: row.photo_path ? String(row.photo_path) : undefined,
    photoUrl: row.photo_url ? String(row.photo_url) : undefined
  };
}

function progressRow(entry: ProgressEntry) {
  return compactRow({
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
    left_arm_cm: entry.leftArmCm,
    right_arm_cm: entry.rightArmCm,
    arm_cm: entry.armCm,
    left_thigh_cm: entry.leftThighCm,
    right_thigh_cm: entry.rightThighCm,
    thigh_cm: entry.thighCm,
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

function mapCheckin(row: DbRecord): WeeklyCheckin {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    weekStart: String(row.week_start),
    currentWeightKg: row.current_weight_kg === null || row.current_weight_kg === undefined ? undefined : asNumber(row.current_weight_kg),
    mood: asNumber(row.mood, 3),
    moodText: row.mood_text ? String(row.mood_text) : undefined,
    energy: asNumber(row.energy, 3),
    hunger: asNumber(row.hunger, 3),
    sleepHours: asNumber(row.sleep_hours, 7),
    sleepQuality: row.sleep_quality === null || row.sleep_quality === undefined ? undefined : asNumber(row.sleep_quality),
    trainingConsistency: row.training_consistency === null || row.training_consistency === undefined ? undefined : asNumber(row.training_consistency),
    dietConsistency: row.diet_consistency === null || row.diet_consistency === undefined ? undefined : asNumber(row.diet_consistency),
    trainingDifficulty: asNumber(row.training_difficulty, 3),
    notes: row.notes ? String(row.notes) : undefined,
    photoPath: row.photo_path ? String(row.photo_path) : undefined,
    photoUrl: row.photo_url ? String(row.photo_url) : undefined
  };
}

function checkinRow(checkin: WeeklyCheckin) {
  return compactRow({
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

function mapBodyMeasurement(row: DbRecord): BodyMeasurements {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    progressEntryId: row.progress_entry_id ? String(row.progress_entry_id) : undefined,
    measuredAt: String(row.measured_at),
    waistCm: row.waist_cm === null || row.waist_cm === undefined ? undefined : asNumber(row.waist_cm),
    hipsCm: row.hips_cm === null || row.hips_cm === undefined ? undefined : asNumber(row.hips_cm),
    chestCm: row.chest_cm === null || row.chest_cm === undefined ? undefined : asNumber(row.chest_cm),
    underbustCm: row.underbust_cm === null || row.underbust_cm === undefined ? undefined : asNumber(row.underbust_cm),
    neckCm: row.neck_cm === null || row.neck_cm === undefined ? undefined : asNumber(row.neck_cm),
    shouldersCm: row.shoulders_cm === null || row.shoulders_cm === undefined ? undefined : asNumber(row.shoulders_cm),
    leftArmCm: row.left_arm_cm === null || row.left_arm_cm === undefined ? undefined : asNumber(row.left_arm_cm),
    rightArmCm: row.right_arm_cm === null || row.right_arm_cm === undefined ? undefined : asNumber(row.right_arm_cm),
    leftThighCm: row.left_thigh_cm === null || row.left_thigh_cm === undefined ? undefined : asNumber(row.left_thigh_cm),
    rightThighCm: row.right_thigh_cm === null || row.right_thigh_cm === undefined ? undefined : asNumber(row.right_thigh_cm),
    glutesCm: row.glutes_cm === null || row.glutes_cm === undefined ? undefined : asNumber(row.glutes_cm),
    calvesCm: row.calves_cm === null || row.calves_cm === undefined ? undefined : asNumber(row.calves_cm),
    notes: row.notes ? String(row.notes) : undefined
  };
}

function bodyMeasurementRow(measurement: BodyMeasurements) {
  return compactRow({
    id: isUuid(measurement.id) ? measurement.id : undefined,
    user_id: measurement.userId,
    progress_entry_id: isUuid(measurement.progressEntryId) ? measurement.progressEntryId : undefined,
    measured_at: measurement.measuredAt,
    waist_cm: measurement.waistCm,
    hips_cm: measurement.hipsCm,
    chest_cm: measurement.chestCm,
    underbust_cm: measurement.underbustCm,
    neck_cm: measurement.neckCm,
    shoulders_cm: measurement.shouldersCm,
    left_arm_cm: measurement.leftArmCm,
    right_arm_cm: measurement.rightArmCm,
    left_thigh_cm: measurement.leftThighCm,
    right_thigh_cm: measurement.rightThighCm,
    glutes_cm: measurement.glutesCm,
    calves_cm: measurement.calvesCm,
    notes: measurement.notes
  });
}

function mapFoodItem(row: DbRecord): FoodItem {
  return {
    id: String(row.id),
    foodName: String(row.food_name ?? ""),
    servingSize: String(row.serving_size ?? "1 serving"),
    calories: asNumber(row.calories),
    proteinG: asNumber(row.protein_g),
    carbsG: asNumber(row.carbs_g),
    fatG: asNumber(row.fat_g),
    fiberG: row.fiber_g === null || row.fiber_g === undefined ? undefined : asNumber(row.fiber_g),
    category: row.category ? String(row.category) : undefined,
    cuisine: row.cuisine ? String(row.cuisine) : undefined,
    aliases: asStringArray(row.aliases),
    sourceType: (row.source_type as FoodItem["sourceType"]) ?? "seed",
    isGlobal: Boolean(row.is_global ?? true),
    createdBy: row.created_by ? String(row.created_by) : undefined
  };
}

function mapWorkoutPlan(row: DbRecord): WorkoutPlan {
  const plan = row.plan as Partial<WorkoutPlan>;
  return {
    id: String(row.id),
    name: String(row.name ?? plan?.name ?? "Workout plan"),
    userId: String(row.user_id),
    goal: (row.goal as WorkoutPlan["goal"]) ?? plan?.goal ?? "general_fitness",
    daysPerWeek: asNumber(row.days_per_week, plan?.daysPerWeek ?? 0),
    split: String(row.split ?? plan?.split ?? "Custom"),
    generatedAt: String(row.generated_at ?? plan?.generatedAt ?? new Date().toISOString()),
    days: Array.isArray(plan?.days) ? plan.days : []
  };
}

function mapMealPlan(row: DbRecord): MealPlan {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    name: String(row.name),
    planDate: row.plan_date ? String(row.plan_date) : undefined,
    meals: Array.isArray(row.meals) ? (row.meals as Meal[]) : [],
    shoppingList: asStringArray(row.shopping_list),
    note: row.note ? String(row.note) : undefined,
    createdAt: String(row.created_at)
  };
}

function mealPlanRow(plan: MealPlan) {
  return compactRow({
    id: isUuid(plan.id) ? plan.id : undefined,
    user_id: plan.userId,
    name: plan.name,
    plan_date: plan.planDate,
    meals: plan.meals,
    shopping_list: plan.shoppingList,
    note: plan.note,
    updated_at: new Date().toISOString()
  });
}

function mapWorkoutTemplate(row: DbRecord): WorkoutTemplate {
  return {
    id: String(row.id),
    name: String(row.name),
    goal: (row.goal as WorkoutTemplate["goal"]) ?? "general_fitness",
    daysPerWeek: asNumber(row.days_per_week, 3),
    split: String(row.split ?? "Template"),
    template: row.template as WorkoutPlan,
    createdBy: row.created_by ? String(row.created_by) : undefined,
    createdAt: row.created_at ? String(row.created_at) : undefined,
    updatedAt: row.updated_at ? String(row.updated_at) : undefined
  };
}

function workoutTemplateRow(template: WorkoutTemplate, userId?: string) {
  return compactRow({
    id: isUuid(template.id) ? template.id : undefined,
    name: template.name,
    goal: template.goal,
    days_per_week: template.daysPerWeek,
    split: template.split,
    template: template.template,
    created_by: userId ?? template.createdBy,
    updated_at: new Date().toISOString()
  });
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const client = db();
  if (!client) return null;
  const { data, error } = await client.from("profiles").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data ? mapProfile(data as DbRecord) : null;
}

export async function upsertProfile(profile: Profile): Promise<Profile> {
  const client = db();
  if (!client) return profile;
  const { data, error } = await client.from("profiles").upsert(profileRow(profile), { onConflict: "user_id" }).select("*").single();
  if (error) throw error;
  return mapProfile(data as DbRecord);
}

export async function markOnboardingComplete(userId: string, complete = true) {
  const client = db();
  if (!client) return;
  await client.from("users").update({ onboarding_complete: complete, updated_at: new Date().toISOString() }).eq("id", userId);
}

export async function saveOnboardingAnswers(profile: Profile): Promise<OnboardingAnswers | null> {
  const client = db();
  if (!client) return null;
  const { data, error } = await client
    .from("onboarding_answers")
    .insert({ user_id: profile.userId, answers: profile, completed_at: new Date().toISOString() })
    .select("*")
    .single();
  if (error) throw error;
  return {
    id: String(data.id),
    userId: String(data.user_id),
    answers: data.answers as Profile,
    completedAt: String(data.completed_at)
  };
}

export async function getLatestCalorieTarget(userId: string) {
  const client = db();
  if (!client) return null;
  const { data, error } = await client
    .from("calorie_targets")
    .select("*")
    .eq("user_id", userId)
    .order("starts_on", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data
    ? {
        calories: asNumber(data.calories),
        protein: asNumber(data.protein),
        carbs: asNumber(data.carbs),
        fat: asNumber(data.fat),
        fiber: data.fiber === null || data.fiber === undefined ? undefined : asNumber(data.fiber),
        waterMl: data.water_ml === null || data.water_ml === undefined ? undefined : asNumber(data.water_ml)
      }
    : null;
}

export async function saveCalorieTarget(profile: Profile) {
  const client = db();
  const target = estimateTargets(profile);
  if (!client) return target;
  const { error } = await client.from("calorie_targets").insert({
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
  const client = db();
  if (!client) return seedExercises;
  const { data, error } = await client.from("exercises").select("*, exercise_videos(*)").order("name");
  if (error) return seedExercises;
  const mapped = (data as DbRecord[]).map(mapExercise);
  return mapped.length ? mapped : seedExercises;
}

export async function upsertExercise(exercise: Exercise) {
  const client = db();
  if (!client) return exercise;
  const { data, error } = await client.from("exercises").upsert(exerciseRow(exercise), { onConflict: "id" }).select("*").single();
  if (error) throw error;
  if (exercise.videoUrl) {
    await client.from("exercise_videos").insert({
      exercise_id: exercise.id,
      video_url: exercise.videoUrl,
      thumbnail: exercise.thumbnail,
      source: exercise.videoSource,
      license_note: exercise.licenseNote,
      attribution: exercise.videoLinks?.[0]?.url,
      is_verified: false
    });
  }
  return mapExercise(data as DbRecord);
}

export async function deleteExercise(id: string) {
  const client = db();
  if (!client) return;
  const { error } = await client.from("exercises").delete().eq("id", id);
  if (error) throw error;
}

export async function listMeals(): Promise<Meal[]> {
  const client = db();
  if (!client) return seedMeals;
  const { data, error } = await client.from("meals").select("*, ingredients(name, amount, calories)").order("name");
  if (error) return seedMeals;
  return (data as DbRecord[]).map(mapMeal);
}

export async function upsertMeal(meal: Meal, userId?: string) {
  const client = db();
  if (!client) return meal;
  const { data, error } = await client.from("meals").upsert(mealRow(meal, userId), { onConflict: "id" }).select("*").single();
  if (error) throw error;
  await client.from("ingredients").delete().eq("meal_id", meal.id);
  if (meal.ingredients.length) {
    await client.from("ingredients").insert(meal.ingredients.map((ingredient) => ({ meal_id: meal.id, ...ingredient })));
  }
  return mapMeal({ ...(data as DbRecord), ingredients: meal.ingredients });
}

export async function deleteMeal(id: string) {
  const client = db();
  if (!client) return;
  const { error } = await client.from("meals").delete().eq("id", id);
  if (error) throw error;
}

export async function listFoodItems(options: { query?: string; cuisine?: string } = {}): Promise<FoodItem[]> {
  const client = db();
  if (!client) return [];
  let query = client.from("food_items").select("*").order("food_name");
  if (options.cuisine && options.cuisine !== "all") query = query.eq("cuisine", options.cuisine);
  if (options.query?.trim()) {
    const term = `%${options.query.trim()}%`;
    query = query.or(`food_name.ilike.${term},serving_size.ilike.${term},category.ilike.${term},cuisine.ilike.${term}`);
  }
  const { data, error } = await query.limit(250);
  if (error) return [];
  return (data as DbRecord[]).map(mapFoodItem);
}

export async function createFoodLog(log: Omit<FoodLog, "id"> & { id?: string }): Promise<FoodLog> {
  const client = db();
  if (!client) return { ...log, id: log.id ?? `log-${crypto.randomUUID()}` };
  const { data, error } = await client.from("food_logs").insert(foodLogRow(log)).select("*").single();
  if (error) throw error;
  return mapFoodLog(data as DbRecord);
}

export async function listFoodLogs(userId: string): Promise<FoodLog[]> {
  const client = db();
  if (!client) return [];
  const { data, error } = await client.from("food_logs").select("*").eq("user_id", userId).order("log_date", { ascending: false });
  if (error) throw error;
  return (data as DbRecord[]).map(mapFoodLog);
}

export async function updateFoodLog(id: string, patch: Partial<FoodLog>): Promise<FoodLog | null> {
  const client = db();
  if (!client || !isUuid(id)) return null;
  const row = foodLogRow({ ...(patch as FoodLog), id } as FoodLog);
  const { data, error } = await client.from("food_logs").update(row).eq("id", id).select("*").single();
  if (error) throw error;
  return mapFoodLog(data as DbRecord);
}

export async function deleteFoodLog(id: string) {
  const client = db();
  if (!client || !isUuid(id)) return;
  const { error } = await client.from("food_logs").delete().eq("id", id);
  if (error) throw error;
}

export async function getActiveWorkoutPlan(userId: string): Promise<WorkoutPlan | null> {
  const client = db();
  if (!client) return null;
  const { data, error } = await client
    .from("workout_plans")
    .select("*")
    .eq("user_id", userId)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? mapWorkoutPlan(data as DbRecord) : null;
}

export async function saveWorkoutPlan(plan: WorkoutPlan): Promise<WorkoutPlan> {
  const client = db();
  if (!client) return plan;
  const row = compactRow({
    id: isUuid(plan.id) ? plan.id : undefined,
    user_id: plan.userId,
    name: plan.name,
    goal: plan.goal,
    days_per_week: plan.daysPerWeek,
    split: plan.split,
    plan,
    generated_at: plan.generatedAt
  });
  const { data, error } = await client.from("workout_plans").upsert(row, { onConflict: "id" }).select("*").single();
  if (error) throw error;
  const saved = mapWorkoutPlan(data as DbRecord);
  if (saved.days.length) {
    await client.from("workouts").delete().eq("workout_plan_id", saved.id);
    await client.from("workouts").insert(
      saved.days.map((day) => ({
        workout_plan_id: saved.id,
        title: day.title,
        focus: day.focus,
        day_index: day.dayIndex,
        estimated_minutes: day.estimatedMinutes,
        exercises: day.exercises
      }))
    );
  }
  return saved;
}

export async function listWorkoutSessions(userId: string): Promise<WorkoutSession[]> {
  const client = db();
  if (!client) return [];
  const { data, error } = await client.from("workout_sessions").select("*").eq("user_id", userId).order("session_date", { ascending: false });
  if (error) throw error;
  return (data as DbRecord[]).map((row) => ({
    id: String(row.id),
    userId: String(row.user_id),
    workoutDayId: String(row.workout_day_id ?? ""),
    scheduledWorkoutId: row.scheduled_workout_id ? String(row.scheduled_workout_id) : undefined,
    date: String(row.session_date),
    difficultyRating: row.difficulty_rating === null || row.difficulty_rating === undefined ? undefined : asNumber(row.difficulty_rating),
    notes: row.notes ? String(row.notes) : undefined,
    sets: Array.isArray(row.sets) ? (row.sets as WorkoutSession["sets"]) : [],
    completedAt: row.completed_at ? String(row.completed_at) : undefined
  }));
}

export async function upsertWorkoutSession(session: WorkoutSession): Promise<WorkoutSession> {
  const client = db();
  if (!client) return session;
  const row = compactRow({
    id: isUuid(session.id) ? session.id : undefined,
    user_id: session.userId,
    workout_day_id: session.workoutDayId,
    scheduled_workout_id: session.scheduledWorkoutId,
    session_date: session.date,
    difficulty_rating: session.difficultyRating,
    notes: session.notes,
    sets: session.sets,
    completed_at: session.completedAt ?? new Date().toISOString()
  });
  const { data, error } = await client.from("workout_sessions").insert(row).select("*").single();
  if (error) throw error;
  return {
    id: String(data.id),
    userId: String(data.user_id),
    workoutDayId: String(data.workout_day_id ?? ""),
    scheduledWorkoutId: data.scheduled_workout_id ? String(data.scheduled_workout_id) : undefined,
    date: String(data.session_date),
    difficultyRating: data.difficulty_rating === null || data.difficulty_rating === undefined ? undefined : asNumber(data.difficulty_rating),
    notes: data.notes ? String(data.notes) : undefined,
    sets: Array.isArray(data.sets) ? (data.sets as WorkoutSession["sets"]) : [],
    completedAt: data.completed_at ? String(data.completed_at) : undefined
  };
}

export async function listProgressEntries(userId: string): Promise<ProgressEntry[]> {
  const client = db();
  if (!client) return [];
  const { data, error } = await client.from("progress_entries").select("*").eq("user_id", userId).order("entry_date", { ascending: true });
  if (error) throw error;
  return (data as DbRecord[]).map(mapProgress);
}

export async function upsertProgressEntry(entry: ProgressEntry): Promise<ProgressEntry> {
  const client = db();
  if (!client) return entry;
  const { data, error } = await client.from("progress_entries").upsert(progressRow(entry), { onConflict: "id" }).select("*").single();
  if (error) throw error;
  return mapProgress(data as DbRecord);
}

export async function deleteProgressEntry(id: string) {
  const client = db();
  if (!client || !isUuid(id)) return;
  const { error } = await client.from("progress_entries").delete().eq("id", id);
  if (error) throw error;
}

export async function listWeeklyCheckins(userId: string): Promise<WeeklyCheckin[]> {
  const client = db();
  if (!client) return [];
  const { data, error } = await client.from("weekly_checkins").select("*").eq("user_id", userId).order("week_start", { ascending: true });
  if (error) throw error;
  return (data as DbRecord[]).map(mapCheckin);
}

export async function upsertWeeklyCheckin(checkin: WeeklyCheckin): Promise<WeeklyCheckin> {
  const client = db();
  if (!client) return checkin;
  const { data, error } = await client.from("weekly_checkins").upsert(checkinRow(checkin), { onConflict: "id" }).select("*").single();
  if (error) throw error;
  return mapCheckin(data as DbRecord);
}

export async function uploadProgressPhoto(userId: string, file: File, label = "progress-photo") {
  const client = db();
  if (!client) throw new Error("Supabase Storage is not configured.");
  const extension = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${Date.now()}-${label.replace(/[^a-z0-9-]/gi, "-").toLowerCase()}.${extension}`;
  const { error } = await client.storage.from("progress-photos").upload(path, file, { upsert: false });
  if (error) throw error;
  const signed = await client.storage.from("progress-photos").createSignedUrl(path, 60 * 60 * 24 * 7);
  if (signed.error) throw signed.error;
  await client.from("progress_photos").insert({
    user_id: userId,
    storage_path: path,
    photo_url: signed.data.signedUrl,
    label
  });
  return { path, url: signed.data.signedUrl };
}

export async function listProgressPhotos(userId: string): Promise<ProgressPhoto[]> {
  const client = db();
  if (!client) return [];
  const { data, error } = await client.from("progress_photos").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) return [];
  return Promise.all(
    (data as DbRecord[]).map(async (row) => {
      const storagePath = String(row.storage_path);
      const signed = await client.storage.from("progress-photos").createSignedUrl(storagePath, 60 * 60 * 24 * 7);
      return {
        id: String(row.id),
        userId: String(row.user_id),
        progressEntryId: row.progress_entry_id ? String(row.progress_entry_id) : undefined,
        weeklyCheckinId: row.weekly_checkin_id ? String(row.weekly_checkin_id) : undefined,
        storagePath,
        photoUrl: signed.data?.signedUrl ?? (row.photo_url ? String(row.photo_url) : undefined),
        label: row.label ? String(row.label) : undefined,
        createdAt: String(row.created_at)
      };
    })
  );
}

export async function deleteProgressPhoto(photo: {
  id?: string;
  storagePath?: string;
  progressEntryId?: string;
  weeklyCheckinId?: string;
}) {
  const client = db();
  if (!client) return;

  if (photo.storagePath) {
    const { error: storageError } = await client.storage.from("progress-photos").remove([photo.storagePath]);
    if (storageError) throw storageError;
  }

  if (photo.id && isUuid(photo.id)) {
    const { error } = await client.from("progress_photos").delete().eq("id", photo.id);
    if (error) throw error;
  } else if (photo.storagePath) {
    const { error } = await client.from("progress_photos").delete().eq("storage_path", photo.storagePath);
    if (error) throw error;
  }

  if (photo.progressEntryId && isUuid(photo.progressEntryId)) {
    const { error } = await client.from("progress_entries").update({ photo_path: null, photo_url: null }).eq("id", photo.progressEntryId);
    if (error) throw error;
  } else if (photo.storagePath) {
    const { error } = await client.from("progress_entries").update({ photo_path: null, photo_url: null }).eq("photo_path", photo.storagePath);
    if (error) throw error;
  }

  if (photo.weeklyCheckinId && isUuid(photo.weeklyCheckinId)) {
    const { error } = await client.from("weekly_checkins").update({ photo_path: null, photo_url: null }).eq("id", photo.weeklyCheckinId);
    if (error) throw error;
  } else if (photo.storagePath) {
    const { error } = await client.from("weekly_checkins").update({ photo_path: null, photo_url: null }).eq("photo_path", photo.storagePath);
    if (error) throw error;
  }
}

export async function listScheduledWorkouts(userId: string): Promise<ScheduledWorkout[]> {
  const client = db();
  if (!client) return [];
  const { data, error } = await client.from("scheduled_workouts").select("*").eq("user_id", userId).order("scheduled_date");
  if (error) return [];
  return (data as DbRecord[]).map((row) => ({
    id: String(row.id),
    userId: String(row.user_id),
    workoutPlanId: row.workout_plan_id ? String(row.workout_plan_id) : undefined,
    workoutDayId: String(row.workout_day_id ?? ""),
    scheduledDate: String(row.scheduled_date),
    status: (row.status as ScheduledWorkout["status"]) ?? "scheduled",
    notes: row.notes ? String(row.notes) : undefined
  }));
}

export async function upsertScheduledWorkout(item: ScheduledWorkout) {
  const client = db();
  if (!client) return item;
  const { data, error } = await client
    .from("scheduled_workouts")
    .upsert(
      compactRow({
        id: isUuid(item.id) ? item.id : undefined,
        user_id: item.userId,
        workout_plan_id: isUuid(item.workoutPlanId) ? item.workoutPlanId : undefined,
        workout_day_id: item.workoutDayId,
        scheduled_date: item.scheduledDate,
        status: item.status,
        notes: item.notes
      })
    )
    .select("*")
    .single();
  if (error) throw error;
  return {
    id: String(data.id),
    userId: String(data.user_id),
    workoutPlanId: data.workout_plan_id ? String(data.workout_plan_id) : undefined,
    workoutDayId: String(data.workout_day_id ?? ""),
    scheduledDate: String(data.scheduled_date),
    status: (data.status as ScheduledWorkout["status"]) ?? "scheduled",
    notes: data.notes ? String(data.notes) : undefined
  };
}

export async function deleteScheduledWorkout(id: string) {
  const client = db();
  if (!client || !isUuid(id)) return;
  const { error } = await client.from("scheduled_workouts").delete().eq("id", id);
  if (error) throw error;
}

function scheduleDatesForPlan(plan: WorkoutPlan, daysAhead = 28) {
  const workoutDays = new Map(plan.days.map((day) => [day.dayIndex, day]));
  return Array.from({ length: daysAhead }, (_, offset) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    const iso = date.toISOString().slice(0, 10);
    const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
    const day = workoutDays.get(dayIndex);
    return day
      ? {
          id: `scheduled-${crypto.randomUUID()}`,
          userId: plan.userId,
          workoutPlanId: plan.id,
          workoutDayId: day.id,
          scheduledDate: iso,
          status: "scheduled" as const,
          notes: `${day.title} - ${day.focus}`
        }
      : null;
  }).filter(Boolean) as ScheduledWorkout[];
}

export async function createScheduledWorkoutsFromPlan(plan: WorkoutPlan, daysAhead = 28): Promise<ScheduledWorkout[]> {
  const client = db();
  if (!client || !isUuid(plan.id) || !plan.days.length) return [];
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = scheduleDatesForPlan(plan, daysAhead);

  await client.from("scheduled_workouts").delete().eq("user_id", plan.userId).gte("scheduled_date", today);

  const { error } = await client.from("scheduled_workouts").insert(
    upcoming.map((item) =>
      compactRow({
        user_id: item.userId,
        workout_plan_id: item.workoutPlanId,
        workout_day_id: item.workoutDayId,
        scheduled_date: item.scheduledDate,
        status: item.status,
        notes: item.notes
      })
    )
  );
  if (error) throw error;
  return listScheduledWorkouts(plan.userId);
}

export async function saveExerciseLogs(logs: ExerciseLog[]) {
  const client = db();
  if (!client || !logs.length) return logs;
  const { data, error } = await client
    .from("exercise_logs")
    .insert(
      logs.map((log) =>
        compactRow({
          id: isUuid(log.id) ? log.id : undefined,
          user_id: log.userId,
          workout_session_id: isUuid(log.workoutSessionId) ? log.workoutSessionId : undefined,
          exercise_id: log.exerciseId,
          exercise_name: log.exerciseName,
          planned_sets: log.plannedSets,
          planned_reps: log.plannedReps,
          actual_sets: log.actualSets,
          actual_reps: log.actualReps,
          weight_kg: log.weightKg,
          notes: log.notes,
          completed: log.completed
        })
      )
    )
    .select("*");
  if (error) throw error;
  return data as ExerciseLog[];
}

export async function saveMealPlan(plan: MealPlan) {
  const client = db();
  if (!client) return plan;
  const { data, error } = await client.from("meal_plans").upsert(mealPlanRow(plan), { onConflict: "id" }).select("*").single();
  if (error) throw error;
  return mapMealPlan(data as DbRecord);
}

export async function listMealPlans(userId: string): Promise<MealPlan[]> {
  const client = db();
  if (!client) return [];
  const { data, error } = await client.from("meal_plans").select("*").eq("user_id", userId).order("plan_date", { ascending: false });
  if (error) return [];
  return (data as DbRecord[]).map(mapMealPlan);
}

export async function deleteMealPlan(id: string) {
  const client = db();
  if (!client || !isUuid(id)) return;
  const { error } = await client.from("meal_plans").delete().eq("id", id);
  if (error) throw error;
}

export async function saveChatMessage(userId: string, message: ChatMessage) {
  const client = db();
  if (!client) return message;
  const { data, error } = await client
    .from("chat_messages")
    .insert({
      user_id: userId,
      role: message.role,
      content: message.content,
      parsed_food_log: message.parsedFoodLog
    })
    .select("*")
    .single();
  if (error) throw error;
  return {
    id: String(data.id),
    role: data.role as ChatMessage["role"],
    content: String(data.content),
    createdAt: String(data.created_at),
    parsedFoodLog: data.parsed_food_log as ChatMessage["parsedFoodLog"]
  };
}

export async function listAdminSettings(): Promise<AdminSetting[]> {
  const client = db();
  if (!client) return [];
  const { data, error } = await client.from("admin_settings").select("*").order("key");
  if (error) return [];
  return (data as DbRecord[]).map((row) => ({
    id: String(row.id),
    key: String(row.key),
    value: String(row.value),
    category: (row.category as AdminSetting["category"]) ?? "feature"
  }));
}

export async function upsertAdminSetting(setting: AdminSetting) {
  const client = db();
  if (!client) return setting;
  const { data, error } = await client
    .from("admin_settings")
    .upsert(compactRow({ id: isUuid(setting.id) ? setting.id : undefined, key: setting.key, value: setting.value, category: setting.category }), { onConflict: "key" })
    .select("*")
    .single();
  if (error) throw error;
  return {
    id: String(data.id),
    key: String(data.key),
    value: String(data.value),
    category: (data.category as AdminSetting["category"]) ?? "feature"
  };
}

export async function listUsers() {
  const client = db();
  if (!client) return [];
  const { data, error } = await client.from("users").select("id, email, name, role, onboarding_complete").order("created_at", { ascending: false });
  if (error) return [];
  return (data as DbRecord[]).map((row) => ({
    id: String(row.id),
    email: String(row.email),
    name: String(row.name),
    role: (row.role as "user" | "admin") ?? "user",
    onboardingComplete: Boolean(row.onboarding_complete)
  }));
}

export async function upsertUserRow(user: { id: string; email: string; name: string; role: "user" | "admin"; onboardingComplete: boolean }) {
  const client = db();
  if (!client) return user;
  const { data, error } = await client
    .from("users")
    .upsert(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        onboarding_complete: user.onboardingComplete,
        updated_at: new Date().toISOString()
      },
      { onConflict: "id" }
    )
    .select("id, email, name, role, onboarding_complete")
    .single();
  if (error) throw error;
  return {
    id: String(data.id),
    email: String(data.email),
    name: String(data.name),
    role: (data.role as "user" | "admin") ?? "user",
    onboardingComplete: Boolean(data.onboarding_complete)
  };
}

export async function listWorkoutTemplates(): Promise<WorkoutTemplate[]> {
  const client = db();
  if (!client) return [];
  const { data, error } = await client.from("workout_templates").select("*").order("name");
  if (error) return [];
  return (data as DbRecord[]).map(mapWorkoutTemplate);
}

export async function upsertWorkoutTemplate(template: WorkoutTemplate, userId?: string) {
  const client = db();
  if (!client) return template;
  const { data, error } = await client
    .from("workout_templates")
    .upsert(workoutTemplateRow(template, userId), { onConflict: "id" })
    .select("*")
    .single();
  if (error) throw error;
  return mapWorkoutTemplate(data as DbRecord);
}

export async function deleteWorkoutTemplate(id: string) {
  const client = db();
  if (!client || !isUuid(id)) return;
  const { error } = await client.from("workout_templates").delete().eq("id", id);
  if (error) throw error;
}

export async function saveAiGeneratedPlan(plan: Omit<AiGeneratedPlan, "id" | "createdAt">) {
  const client = db();
  if (!client) return null;
  const { data, error } = await client
    .from("ai_generated_plans")
    .insert({
      user_id: plan.userId,
      plan_type: plan.planType,
      provider: plan.provider,
      model: plan.model,
      prompt: plan.prompt,
      response: plan.response,
      validation_status: plan.validationStatus,
      validation_notes: plan.validationNotes
    })
    .select("*")
    .single();
  if (error) throw error;
  return {
    id: String(data.id),
    userId: String(data.user_id),
    planType: data.plan_type as AiGeneratedPlan["planType"],
    provider: data.provider as AiGeneratedPlan["provider"],
    model: String(data.model),
    prompt: String(data.prompt),
    response: data.response,
    validationStatus: data.validation_status as AiGeneratedPlan["validationStatus"],
    validationNotes: data.validation_notes ? String(data.validation_notes) : undefined,
    createdAt: String(data.created_at)
  };
}

export async function listNutritionReferenceTargets(): Promise<NutritionReferenceTarget[]> {
  const client = db();
  if (!client) return [];
  const { data, error } = await client.from("nutrition_reference_targets").select("*").order("nutrient");
  if (error) return [];
  return (data as DbRecord[]).map((row) => ({
    id: String(row.id),
    nutrient: row.nutrient as NutritionReferenceTarget["nutrient"],
    referenceBody: row.reference_body as NutritionReferenceTarget["referenceBody"],
    population: String(row.population),
    minValue: row.min_value === null || row.min_value === undefined ? undefined : asNumber(row.min_value),
    maxValue: row.max_value === null || row.max_value === undefined ? undefined : asNumber(row.max_value),
    unit: String(row.unit),
    note: String(row.note)
  }));
}

export async function saveBodyMeasurements(measurement: BodyMeasurements) {
  const client = db();
  if (!client) return measurement;
  const { data, error } = await client.from("body_measurements").upsert(bodyMeasurementRow(measurement), { onConflict: "id" }).select("*").single();
  if (error) throw error;
  return mapBodyMeasurement(data as DbRecord);
}

export async function listBodyMeasurements(userId: string): Promise<BodyMeasurements[]> {
  const client = db();
  if (!client) return [];
  const { data, error } = await client.from("body_measurements").select("*").eq("user_id", userId).order("measured_at", { ascending: true });
  if (error) return [];
  return (data as DbRecord[]).map(mapBodyMeasurement);
}

export async function deleteBodyMeasurement(id: string) {
  const client = db();
  if (!client || !isUuid(id)) return;
  const { error } = await client.from("body_measurements").delete().eq("id", id);
  if (error) throw error;
}
