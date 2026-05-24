import { MealPlanner } from "@/components/meals/meal-planner";
import { PageShell } from "@/components/ui/page-shell";

export default function MealPlannerPage() {
  return (
    <PageShell title="Meal Planner" description="Search Egyptian and Middle Eastern meals, create custom meals, build a plan, and log food.">
      <MealPlanner />
    </PageShell>
  );
}
