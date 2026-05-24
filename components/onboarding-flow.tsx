"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { coachQuestions } from "@/data/onboarding";
import { useAppState } from "@/lib/app-state";
import { useAuth } from "@/lib/auth-context";
import { estimateTargets, generateWorkoutPlan } from "@/services/ai/workoutGenerator";
import type { Profile } from "@/types";

const steps = [
  { title: "Body and goal", fields: ["age", "gender", "heightCm", "weightKg", "goal"] },
  { title: "Training setup", fields: ["experience", "trainingLocation", "equipment", "daysPerWeek", "minutesPerWorkout", "injuries", "preferredTrainingStyle"] },
  { title: "Food preferences", fields: ["foodAllergies", "dislikedFoods", "favoriteMeals", "preferredCuisine", "budgetLevel", "cookingTime"] }
];

function prettify(value: string) {
  return value.replaceAll("_", " ");
}

export function OnboardingFlow() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const { profile, setProfile, setWorkoutPlan } = useAppState();
  const [draft, setDraft] = useState<Profile>({ ...profile, userId: user?.id ?? profile.userId });
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);

  const visibleQuestions = useMemo(() => coachQuestions.filter((question) => steps[step].fields.includes(question.key)), [step]);
  const targets = estimateTargets(draft);
  const generatedPlan = generateWorkoutPlan(draft, user?.id ?? draft.userId);
  const progress = ((step + 1) / steps.length) * 100;

  function updateField(key: keyof Profile, value: string | number | string[]) {
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
    if (step < steps.length - 1) {
      setStep((current) => current + 1);
      return;
    }

    const savedProfile = { ...draft, userId: user?.id ?? draft.userId };
    setGenerating(true);
    const generatedWorkoutPlan = await generateAIWorkoutPlan(savedProfile);
    setProfile(savedProfile);
    setWorkoutPlan(generatedWorkoutPlan);
    if (user) setUser({ ...user, onboardingComplete: true });
    setGenerating(false);
    router.push("/dashboard");
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <Card>
        <CardHeader>
          <CardTitle>Coach intake</CardTitle>
          <CardDescription>Answer once, then refine anytime from Profile Settings.</CardDescription>
          <Progress value={progress} className="mt-4" />
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="grid gap-4"
              >
                <h2 className="text-xl font-semibold">{steps[step].title}</h2>
                {visibleQuestions.map((question) => {
                  const key = question.key as keyof Profile;
                  const value = draft[key];
                  return (
                    <label key={question.key} className="grid gap-2 text-sm font-medium">
                      {question.label}
                      {question.type === "select" ? (
                        <Select value={String(value)} onChange={(event) => updateField(key, event.target.value)}>
                          {("options" in question ? question.options : []).map((option) => (
                            <option key={option} value={option}>
                              {prettify(option)}
                            </option>
                          ))}
                        </Select>
                      ) : question.type === "textarea" ? (
                        <Textarea value={String(value ?? "")} onChange={(event) => updateField(key, event.target.value)} />
                      ) : question.type === "tags" ? (
                        <Input
                          value={Array.isArray(value) ? value.join(", ") : String(value ?? "")}
                          onChange={(event) =>
                            updateField(
                              key,
                              event.target.value
                                .split(",")
                                .map((item) => item.trim())
                                .filter(Boolean)
                            )
                          }
                          placeholder="Dumbbells, bands, bench"
                        />
                      ) : (
                        <Input
                          type={question.type === "number" ? "number" : "text"}
                          value={String(value ?? "")}
                          onChange={(event) => updateField(key, question.type === "number" ? Number(event.target.value) : event.target.value)}
                        />
                      )}
                      {"helper" in question && question.helper ? <span className="text-xs text-muted-foreground">{question.helper}</span> : null}
                    </label>
                  );
                })}
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-between pt-2">
              <Button type="button" variant="ghost" disabled={step === 0 || generating} onClick={() => setStep((current) => current - 1)}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button type="submit" disabled={generating}>
                {step === steps.length - 1 ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    {generating ? "Generating AI plan..." : "Generate my plan"}
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="border-primary/20">
          <CardHeader>
            <div className="grid h-11 w-11 place-items-center rounded-md bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <CardTitle>Live plan preview</CardTitle>
            <CardDescription>Your generated targets update as you answer.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border bg-background/60 p-4">
              <p className="text-sm text-muted-foreground">Daily calories</p>
              <p className="mt-1 text-2xl font-bold">{targets.calories}</p>
            </div>
            <div className="rounded-md border bg-background/60 p-4">
              <p className="text-sm text-muted-foreground">Protein target</p>
              <p className="mt-1 text-2xl font-bold">{targets.protein}g</p>
            </div>
            <div className="rounded-md border bg-background/60 p-4">
              <p className="text-sm text-muted-foreground">Workout split</p>
              <p className="mt-1 text-xl font-bold">{generatedPlan.split}</p>
            </div>
            <div className="rounded-md border bg-background/60 p-4">
              <p className="text-sm text-muted-foreground">Plan days</p>
              <p className="mt-1 text-xl font-bold">{generatedPlan.days.length} days/week</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Suggested meal direction</CardTitle>
            <CardDescription>Based on cuisine, budget, and cooking time.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Start with a high-protein Egyptian base: ful with eggs, cottage cheese, grilled chicken and rice, lentil soup, tuna plate, or lighter hawawshi.
            </p>
            <p>Allergy notes and disliked foods are saved to the profile so meal generation can avoid unsafe suggestions later.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
