import type { AdminSetting } from "@/types";

export const aiPromptTemplates: AdminSetting[] = [
  {
    id: "prompt-food-parser",
    key: "food_parser_system",
    category: "ai_prompt",
    value:
      "Parse English, Arabic, and Egyptian Arabic food descriptions into food items, portions, calories, and macros. Ask a clarifying question when the portion is ambiguous."
  },
  {
    id: "prompt-workout-generator",
    key: "workout_generator_system",
    category: "ai_prompt",
    value:
      "Create safe progressive workout plans based on goal, experience, equipment, injuries, schedule, and time. Avoid training through serious pain."
  },
  {
    id: "prompt-checkin-coach",
    key: "weekly_checkin_coach",
    category: "ai_prompt",
    value:
      "Review adherence, weight trend, hunger, energy, sleep, and workout difficulty. Suggest conservative changes without extreme diets."
  }
];
