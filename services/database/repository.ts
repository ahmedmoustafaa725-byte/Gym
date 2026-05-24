import { exercises } from "@/data/exercises";
import { meals } from "@/data/meals";
import { supabase } from "@/lib/supabase";
import type { Exercise, FoodLog, Meal } from "@/types";

export async function listExercises(): Promise<Exercise[]> {
  if (!supabase) return exercises;
  const { data, error } = await supabase.from("exercises").select("*").order("name");
  if (error) throw error;
  return data as Exercise[];
}

export async function listMeals(): Promise<Meal[]> {
  if (!supabase) return meals;
  const { data, error } = await supabase.from("meals").select("*").order("name");
  if (error) throw error;
  return data as Meal[];
}

export async function saveFoodLog(log: FoodLog) {
  if (!supabase) return log;
  const { data, error } = await supabase.from("food_logs").insert(log).select().single();
  if (error) throw error;
  return data as FoodLog;
}
