import { ManageMeals } from "@/components/admin/admin-resources";
import { PageShell } from "@/components/ui/page-shell";

export default function AdminMealsPage() {
  return (
    <PageShell title="Manage Meals" description="Admin content management for meals, Egyptian food aliases, macros, and allergy notes.">
      <ManageMeals />
    </PageShell>
  );
}
