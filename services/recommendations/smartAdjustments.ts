import type { FoodLog, ProgressEntry, SmartRecommendation, WeeklyCheckin, WorkoutSession } from "@/types";

export function generateSmartRecommendations(input: {
  progress: ProgressEntry[];
  foodLogs: FoodLog[];
  sessions: WorkoutSession[];
  checkins: WeeklyCheckin[];
  proteinTarget: number;
}): SmartRecommendation[] {
  const recommendations: SmartRecommendation[] = [];
  const recentProgress = input.progress.slice(-3);
  const lastCheckin = input.checkins.at(-1);
  const recentLogs = input.foodLogs.slice(-14);
  const avgProtein = recentLogs.length
    ? recentLogs.reduce((sum, log) => sum + log.protein, 0) / Math.max(1, new Set(recentLogs.map((log) => log.date)).size)
    : 0;

  if (recentProgress.length >= 3) {
    const first = recentProgress[0].weightKg;
    const last = recentProgress.at(-1)!.weightKg;
    if (Math.abs(first - last) < 0.3) {
      recommendations.push({
        id: "weight-plateau",
        title: "Weight trend has paused",
        reason: "Your last three check-ins are within 0.3 kg.",
        action: "Adjust calories by 150-200 kcal or add two 20-minute walks this week.",
        priority: "medium"
      });
    }
  }

  if (input.sessions.length < 2) {
    recommendations.push({
      id: "missed-workouts",
      title: "Make the schedule easier to win",
      reason: "Workout consistency is low this week.",
      action: "Use the 20-minute workout option and aim for three sessions before adding volume.",
      priority: "high"
    });
  }

  if (lastCheckin && lastCheckin.trainingDifficulty >= 5) {
    recommendations.push({
      id: "too-hard",
      title: "Reduce volume this week",
      reason: "Your latest check-in marked training as very hard.",
      action: "Remove one set from each exercise and keep two reps in reserve.",
      priority: "high"
    });
  }

  if (lastCheckin && lastCheckin.trainingDifficulty <= 2 && input.sessions.length >= 3) {
    recommendations.push({
      id: "too-easy",
      title: "Progress the plan gently",
      reason: "Training feels easy and adherence is solid.",
      action: "Add 2.5-5 kg where form is clean or add one set to the first exercise.",
      priority: "low"
    });
  }

  if (avgProtein > 0 && avgProtein < input.proteinTarget * 0.75) {
    recommendations.push({
      id: "low-protein",
      title: "Protein is running low",
      reason: `Your recent average is around ${Math.round(avgProtein)} g/day.`,
      action: "Add one high-protein Egyptian option such as cottage cheese, tuna, grilled chicken, or lentil soup with yogurt.",
      priority: "medium"
    });
  }

  if (!recommendations.length) {
    recommendations.push({
      id: "steady",
      title: "Keep the current plan",
      reason: "Your recent markers look balanced.",
      action: "Keep logging meals, training, sleep, and weekly weight so future adjustments are more precise.",
      priority: "low"
    });
  }

  return recommendations;
}
