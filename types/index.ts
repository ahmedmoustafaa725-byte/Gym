export type Role = "user" | "admin";
export type Goal = "fat_loss" | "muscle_gain" | "maintenance" | "endurance" | "general_fitness";
export type Experience = "beginner" | "intermediate" | "advanced";
export type TrainingLocation = "gym" | "home" | "both";
export type Difficulty = "beginner" | "intermediate" | "advanced";
export type Gender = "female" | "male" | "non_binary" | "prefer_not_to_say";
export type BudgetLevel = "low" | "medium" | "high";
export type Cuisine = "Egyptian" | "Middle Eastern" | "Mediterranean" | "International";

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
  trainingLocation: TrainingLocation;
  equipment: string[];
  daysPerWeek: number;
  minutesPerWorkout: number;
  injuries: string;
  preferredTrainingStyle: string;
  foodAllergies: string;
  dislikedFoods: string;
  favoriteMeals: string;
  preferredCuisine: string;
  budgetLevel: BudgetLevel;
  cookingTime: "quick" | "moderate" | "meal_prep";
};

export type MacroTarget = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
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
  date: string;
  difficultyRating?: number;
  notes?: string;
  sets: WorkoutSetLog[];
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
  source: "manual" | "chatbot" | "meal_plan" | "copy";
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
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
  caloriesAverage?: number;
  proteinAverage?: number;
  workoutConsistency?: number;
  photoUrl?: string;
};

export type WeeklyCheckin = {
  id: string;
  userId: string;
  weekStart: string;
  mood: number;
  energy: number;
  hunger: number;
  sleepHours: number;
  trainingDifficulty: number;
  notes?: string;
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
