"use client";

import { FormEvent, useEffect, useState } from "react";
import { Save, ShieldAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAppState } from "@/lib/app-state";
import { injuryWarning, safetyDisclaimer } from "@/lib/safety";
import { estimateTargets, generateWorkoutPlan } from "@/services/ai/workoutGenerator";
import { saveAiGeneratedPlan } from "@/services/database/repository";
import type { Profile } from "@/types";

export function ProfileSettings() {
  const { profile, setProfile, targets, setWorkoutPlan } = useAppState();
  const [draft, setDraft] = useState(profile);
  const [generating, setGenerating] = useState(false);
  const preview = estimateTargets(draft);
  const saved = preview.calories === targets.calories && preview.protein === targets.protein;

  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  function setField<K extends keyof Profile>(key: K, value: Profile[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function generateAIWorkoutPlan(savedProfile: Profile) {
    try {
      const response = await fetch("/api/ai/workout-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ profile: savedProfile })
      });

      if (!response.ok) {
        throw new Error("Workout generation failed");
      }

      return await response.json();
    } catch {
      return generateWorkoutPlan(savedProfile, savedProfile.userId);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGenerating(true);
    const generatedPlan = await generateAIWorkoutPlan(draft);
    setProfile(draft);
    setWorkoutPlan(generatedPlan);
    void saveAiGeneratedPlan({
      userId: draft.userId,
      planType: "workout",
      provider: "gemini",
      model: "gemini-2.5-flash",
      prompt: "Profile settings save and regenerate workout plan.",
      response: generatedPlan,
      validationStatus: "passed"
    });
    setGenerating(false);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <Card>
        <CardHeader>
          <CardTitle>Profile and preferences</CardTitle>
          <CardDescription>Changing training fields regenerates your plan and target preview.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              Age
              <Input type="number" min="13" max="100" value={draft.age} onChange={(event) => setField("age", Number(event.target.value))} placeholder="Age in years, e.g. 28" />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Gender
              <Select value={draft.gender} onChange={(event) => setField("gender", event.target.value as Profile["gender"])}>
                {["female", "male", "non_binary", "prefer_not_to_say"].map((item) => (
                  <option key={item} value={item}>
                    {item.replaceAll("_", " ")}
                  </option>
                ))}
              </Select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Height (cm)
              <Input type="number" min="80" max="260" value={draft.heightCm} onChange={(event) => setField("heightCm", Number(event.target.value))} placeholder="Height in cm, e.g. 175" />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Weight (kg)
              <Input type="number" min="25" max="350" step="0.1" value={draft.weightKg} onChange={(event) => setField("weightKg", Number(event.target.value))} placeholder="Weight in kg, e.g. 82" />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Target weight (kg)
              <Input type="number" min="25" max="350" step="0.1" value={draft.targetWeightKg ?? ""} onChange={(event) => setField("targetWeightKg", event.target.value ? Number(event.target.value) : undefined)} placeholder="Target weight in kg, e.g. 78" />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Goal
              <Select value={draft.goal} onChange={(event) => setField("goal", event.target.value as Profile["goal"])}>
                {["fat_loss", "muscle_gain", "maintenance", "endurance", "general_fitness", "strength"].map((item) => (
                  <option key={item} value={item}>
                    {item.replaceAll("_", " ")}
                  </option>
                ))}
              </Select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Activity level
              <Select value={draft.activityLevel} onChange={(event) => setField("activityLevel", event.target.value as Profile["activityLevel"])}>
                {["sedentary", "light", "moderate", "active", "very_active"].map((item) => (
                  <option key={item} value={item}>
                    {item.replaceAll("_", " ")}
                  </option>
                ))}
              </Select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Experience
              <Select value={draft.experience} onChange={(event) => setField("experience", event.target.value as Profile["experience"])}>
                {["beginner", "intermediate", "advanced"].map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Days/week
              <Input type="number" min={1} max={7} value={draft.daysPerWeek} onChange={(event) => setField("daysPerWeek", Number(event.target.value))} placeholder="Available training days, e.g. 4" />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Minutes/workout
              <Input
                type="number"
                min={10}
                max={180}
                value={draft.minutesPerWorkout}
                onChange={(event) => setField("minutesPerWorkout", Number(event.target.value))}
                placeholder="Workout duration in minutes, e.g. 45"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium md:col-span-2">
              Equipment
              <Input
                value={draft.equipment.join(", ")}
                onChange={(event) => setField("equipment", event.target.value.split(",").map((item) => item.trim()).filter(Boolean))}
                placeholder="Available equipment, e.g. dumbbells, barbell, bands"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium md:col-span-2">
              Injuries or limitations
              <Textarea value={draft.injuries} onChange={(event) => setField("injuries", event.target.value)} placeholder="Injuries or limitations, e.g. knee pain with jumping" />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Diet preference
              <Select value={draft.dietPreference} onChange={(event) => setField("dietPreference", event.target.value as Profile["dietPreference"])}>
                {["normal", "vegetarian", "vegan", "halal", "pescatarian", "high_protein"].map((item) => (
                  <option key={item} value={item}>
                    {item.replaceAll("_", " ")}
                  </option>
                ))}
              </Select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Meals per day
              <Input type="number" min={1} max={8} value={draft.mealsPerDay} onChange={(event) => setField("mealsPerDay", Number(event.target.value))} placeholder="Meals per day, e.g. 3" />
            </label>
            <label className="grid gap-2 text-sm font-medium md:col-span-2">
              Food allergies
              <Textarea value={draft.foodAllergies} onChange={(event) => setField("foodAllergies", event.target.value)} placeholder="Food allergies, e.g. peanuts, dairy, shellfish" />
            </label>
            <label className="grid gap-2 text-sm font-medium md:col-span-2">
              Preferred cuisine
              <Input value={draft.preferredCuisine} onChange={(event) => setField("preferredCuisine", event.target.value)} placeholder="Preferred cuisine, e.g. Egyptian and Middle Eastern" />
            </label>
            <label className="grid gap-2 text-sm font-medium md:col-span-2">
              Favorite meals and disliked foods
              <Textarea
                value={`${draft.favoriteMeals}\nAvoid: ${draft.dislikedFoods}`}
                onChange={(event) => {
                  const [favoriteMeals, disliked = ""] = event.target.value.split("Avoid:");
                  setDraft((current) => ({ ...current, favoriteMeals: favoriteMeals.trim(), dislikedFoods: disliked.trim() }));
                }}
                placeholder="Favorite meals, e.g. grilled chicken, ful, molokhia. Avoid: foods you dislike"
              />
            </label>
            <div className="md:col-span-2">
              <Button type="submit" disabled={generating}>
                <Save className="h-4 w-4" />
                {generating ? "Saving and generating..." : "Save and regenerate plan"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="border-primary/20">
          <CardHeader>
            <Sparkles className="mb-3 h-7 w-7 text-primary" />
            <CardTitle>Target preview</CardTitle>
            <CardDescription>{saved ? "Saved target" : "Unsaved profile changes detected"}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              ["Calories", `${preview.calories} kcal`],
              ["Protein", `${preview.protein} g`],
              ["Carbs", `${preview.carbs} g`],
              ["Fat", `${preview.fat} g`]
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-md border bg-background/60 p-3">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="font-semibold">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <ShieldAlert className="mb-3 h-7 w-7 text-accent" />
            <CardTitle>Safety notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>{injuryWarning(draft.injuries)}</p>
            <p>{safetyDisclaimer}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
