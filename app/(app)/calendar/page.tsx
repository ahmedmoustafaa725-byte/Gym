import { TrainingCalendar } from "@/components/calendar/training-calendar";
import { PageShell } from "@/components/ui/page-shell";

export default function CalendarPage() {
  return (
    <PageShell title="Calendar" description="Scheduled workouts, rest days, completed sessions, missed workouts, and logged meals.">
      <TrainingCalendar />
    </PageShell>
  );
}
