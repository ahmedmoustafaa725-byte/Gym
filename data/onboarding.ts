import type { Profile } from "@/types";

export const defaultProfile: Profile = {
  userId: "demo-user",
  age: 28,
  gender: "prefer_not_to_say",
  heightCm: 175,
  weightKg: 82,
  goal: "fat_loss",
  experience: "beginner",
  trainingLocation: "both",
  equipment: ["Dumbbells", "Bench", "Resistance bands"],
  daysPerWeek: 4,
  minutesPerWorkout: 45,
  injuries: "",
  preferredTrainingStyle: "Strength with short conditioning finishers",
  foodAllergies: "",
  dislikedFoods: "",
  favoriteMeals: "Hawawshi, grilled chicken, lentil soup",
  preferredCuisine: "Egyptian and Middle Eastern",
  budgetLevel: "medium",
  cookingTime: "moderate"
};

export const coachQuestions = [
  { key: "age", label: "Age", type: "number", helper: "Used for calorie estimates and recovery guidance." },
  { key: "gender", label: "Gender", type: "select", options: ["female", "male", "non_binary", "prefer_not_to_say"] },
  { key: "heightCm", label: "Height (cm)", type: "number" },
  { key: "weightKg", label: "Weight (kg)", type: "number" },
  { key: "goal", label: "Goal", type: "select", options: ["fat_loss", "muscle_gain", "maintenance", "endurance", "general_fitness"] },
  { key: "experience", label: "Training experience", type: "select", options: ["beginner", "intermediate", "advanced"] },
  { key: "trainingLocation", label: "Training location", type: "select", options: ["gym", "home", "both"] },
  { key: "equipment", label: "Available equipment", type: "tags", helper: "Example: dumbbells, barbell, bands, treadmill." },
  { key: "daysPerWeek", label: "Days available per week", type: "number" },
  { key: "minutesPerWorkout", label: "Minutes per workout", type: "number" },
  { key: "injuries", label: "Injuries or limitations", type: "textarea" },
  { key: "preferredTrainingStyle", label: "Preferred training style", type: "textarea" },
  { key: "foodAllergies", label: "Food allergies", type: "textarea" },
  { key: "dislikedFoods", label: "Foods you dislike", type: "textarea" },
  { key: "favoriteMeals", label: "Favorite meals", type: "textarea" },
  { key: "preferredCuisine", label: "Preferred cuisine", type: "text" },
  { key: "budgetLevel", label: "Budget level", type: "select", options: ["low", "medium", "high"] },
  { key: "cookingTime", label: "Cooking time preference", type: "select", options: ["quick", "moderate", "meal_prep"] }
] as const;
