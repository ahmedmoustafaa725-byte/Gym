import { TodayWorkout } from "@/components/workouts/today-workout";
import { PageShell } from "@/components/ui/page-shell";

export default function TodayPage() {
  return (
    <PageShell title="Today's Workout" description="Start today's training, log sets, save notes, or switch to a shorter workout.">
      <TodayWorkout />
    </PageShell>
  );
}
