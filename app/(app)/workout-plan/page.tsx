import { WorkoutPlanView } from "@/components/workouts/workout-plan-view";
import { PageShell } from "@/components/ui/page-shell";

export default function WorkoutPlanPage() {
  return (
    <PageShell title="Workout Plan" description="Your generated weekly program with sets, reps, rest, videos, mistakes, and alternatives.">
      <WorkoutPlanView />
    </PageShell>
  );
}
