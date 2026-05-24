import { CalorieTracker } from "@/components/meals/calorie-tracker";
import { PageShell } from "@/components/ui/page-shell";

export default function CalorieTrackerPage() {
  return (
    <PageShell title="Calorie Tracker" description="Track calories and macros, edit logs, copy meals, and watch weekly averages.">
      <CalorieTracker />
    </PageShell>
  );
}
