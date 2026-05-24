export type Role = "user" | "admin";
export type Goal = "fat_loss" | "muscle_gain" | "maintenance" | "endurance" | "general_fitness" | "strength";
export type Experience = "beginner" | "intermediate" | "advanced";
export type TrainingLocation = "gym" | "home" | "both";
export type Difficulty = "beginner" | "intermediate" | "advanced";
export type Gender = "female" | "male" | "non_binary" | "prefer_not_to_say";
export type BudgetLevel = "low" | "medium" | "high";
export type Cuisine = "Egyptian" | "Middle Eastern" | "Mediterranean" | "International";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type DietPreference = "normal" | "vegetarian" | "vegan" | "halal" | "pescatarian" | "high_protein";

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  onboardingComplete: boolean;
};

export type Profile = {
  userId: string;
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  goal: Goal;
  experience: Experience;
  activityLevel: ActivityLevel;
  trainingLocation: TrainingLocation;
  equipment: string[];
  daysPerWeek: number;
  minutesPerWorkout: number;
  injuries: string;
  preferredTrainingStyle: string;
  dietPreference: DietPreference;
  foodAllergies: string;
  dislikedFoods: string;
  favoriteMeals: string;
  preferredCuisine: string;
  mealsPerDay: number;
  targetWeightKg?: number;
  budgetLevel: BudgetLevel;
  cookingTime: "quick" | "moderate" | "meal_prep";
};

export type MacroTarget = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  waterMl?: number;
};

export type Exercise = {
  id: string;
  name: string;
  arabicName?: string;
  muscleGroup: string;
  equipment: string;
  difficulty: Difficulty;
  videoUrl: string;
  thumbnail: string;
  videoSource: "Wikimedia Commons" | "Seed placeholder" | "wger compatible" | "YouTube Embed";
  videoLinks?: Array<{
    title: string;
    url: string;
    source: "Wikimedia Commons" | "YouTube" | "wger" | "Manual";
  }>;
  licenseNote: string;
  instructions: string[];
  commonMistakes: string[];
  alternatives: string[];
};

export type WorkoutExercise = {
  exerciseId: string;
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  targetMuscle: string;
  equipment: string;
  difficulty: Difficulty;
  videoUrl: string;
  instructions: string[];
  commonMistakes: string[];
  alternative: string;
};

export type WorkoutDay = {
  id: string;
  title: string;
  focus: string;
  dayIndex: number;
  estimatedMinutes: number;
  exercises: WorkoutExercise[];
  recoveryTips?: string[];
};

export type WorkoutPlan = {
  id: string;
  name: string;
  userId: string;
  goal: Goal;
  daysPerWeek: number;
  split: string;
  generatedAt: string;
  days: WorkoutDay[];
};

export type WorkoutSetLog = {
  exerciseId: string;
  completed: boolean;
  weightKg?: number;
  reps?: number;
  notes?: string;
};

export type WorkoutSession = {
  id: string;
  userId: string;
  workoutDayId: string;
  scheduledWorkoutId?: string;
  date: string;
  difficultyRating?: number;
  notes?: string;
  sets: WorkoutSetLog[];
  completedAt?: string;
};

export type Ingredient = {
  name: string;
  amount: string;
  calories?: number;
};

export type Meal = {
  id: string;
  name: string;
  arabicName?: string;
  aliases: string[];
  cuisine: Cuisine;
  tags: string[];
  portionSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  normalCalories?: string;
  fitnessCalories?: string;
  ingredients: Ingredient[];
  instructions: string[];
  healthierTips: string[];
  allergyNotes?: string;
  budgetLevel: BudgetLevel;
  cookingTimeMinutes: number;
};

export type FoodLog = {
  id: string;
  userId: string;
  date: string;
  mealName: string;
  source: "manual" | "chatbot" | "meal_plan" | "copy" | "egyptian_food" | "custom";
  mealId?: string;
  foodItemId?: string;
  mealTime?: string;
  servingSize?: string;
  quantity?: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  notes?: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  parsedFoodLog?: Omit<FoodLog, "id" | "userId" | "date" | "source">;
};

export type ProgressEntry = {
  id: string;
  userId: string;
  date: string;
  weightKg: number;
  waistCm?: number;
  hipsCm?: number;
  chestCm?: number;
  underbustCm?: number;
  neckCm?: number;
  shouldersCm?: number;
  leftArmCm?: number;
  rightArmCm?: number;
  armCm?: number;
  leftThighCm?: number;
  rightThighCm?: number;
  thighCm?: number;
  glutesCm?: number;
  calvesCm?: number;
  caloriesAverage?: number;
  proteinAverage?: number;
  workoutConsistency?: number;
  notes?: string;
  photoPath?: string;
  photoUrl?: string;
};

export type WeeklyCheckin = {
  id: string;
  userId: string;
  weekStart: string;
  currentWeightKg?: number;
  mood: number;
  moodText?: string;
  energy: number;
  hunger: number;
  sleepHours: number;
  sleepQuality?: number;
  trainingConsistency?: number;
  dietConsistency?: number;
  trainingDifficulty: number;
  notes?: string;
  photoPath?: string;
  photoUrl?: string;
};

export type SmartRecommendation = {
  id: string;
  title: string;
  reason: string;
  action: string;
  priority: "low" | "medium" | "high";
};

export type AdminSetting = {
  id: string;
  key: string;
  value: string;
  category: "ai_prompt" | "safety" | "feature";
};

export type OnboardingAnswers = {
  id: string;
  userId: string;
  answers: Profile;
  completedAt: string;
};

export type ScheduledWorkout = {
  id: string;
  userId: string;
  workoutPlanId?: string;
  workoutDayId: string;
  scheduledDate: string;
  status: "scheduled" | "completed" | "missed" | "rest";
  notes?: string;
};

export type ExerciseLog = {
  id: string;
  userId: string;
  workoutSessionId: string;
  exerciseId: string;
  exerciseName: string;
  plannedSets?: number;
  plannedReps?: string;
  actualSets?: number;
  actualReps?: number;
  weightKg?: number;
  notes?: string;
  completed: boolean;
};

export type MealPlan = {
  id: string;
  userId: string;
  name: string;
  planDate?: string;
  meals: Meal[];
  shoppingList: string[];
  note?: string;
  createdAt: string;
};

export type FoodItem = {
  id: string;
  foodName: string;
  servingSize: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
  category?: string;
  cuisine?: string;
  aliases?: string[];
  sourceType: "seed" | "user_provided_approximate_macro_table" | "admin" | "user";
  isGlobal: boolean;
  createdBy?: string;
};

export type ProgressPhoto = {
  id: string;
  userId: string;
  progressEntryId?: string;
  weeklyCheckinId?: string;
  storagePath: string;
  photoUrl?: string;
  label?: string;
  createdAt: string;
};

export type BodyMeasurements = {
  id: string;
  userId: string;
  progressEntryId?: string;
  measuredAt: string;
  waistCm?: number;
  hipsCm?: number;
  chestCm?: number;
  underbustCm?: number;
  neckCm?: number;
  shouldersCm?: number;
  leftArmCm?: number;
  rightArmCm?: number;
  leftThighCm?: number;
  rightThighCm?: number;
  glutesCm?: number;
  calvesCm?: number;
  notes?: string;
};

export type NutritionReferenceTarget = {
  id: string;
  nutrient: "calories" | "protein" | "carbs" | "fat" | "fiber" | "water";
  referenceBody: "WHO" | "EFSA" | "USDA" | "ISSN" | "Dietary Guidelines";
  population: string;
  minValue?: number;
  maxValue?: number;
  unit: string;
  note: string;
};

export type DailyNutritionRecommendation = {
  id: string;
  userId: string;
  targetDate: string;
  caloriesStatus: "below" | "within" | "above";
  proteinStatus: "below" | "within" | "above";
  carbsStatus: "below" | "within" | "above";
  fatStatus: "below" | "within" | "above";
  message: string;
  createdAt: string;
};

export type AiGeneratedPlan = {
  id: string;
  userId: string;
  planType: "workout" | "diet" | "nutrition" | "checkin";
  provider: "gemini" | "fallback";
  model: string;
  prompt: string;
  response: unknown;
  validationStatus: "passed" | "failed";
  validationNotes?: string;
  createdAt: string;
};
