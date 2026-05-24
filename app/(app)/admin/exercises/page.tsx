import { ManageExercises } from "@/components/admin/admin-resources";
import { PageShell } from "@/components/ui/page-shell";

export default function AdminExercisesPage() {
  return (
    <PageShell title="Manage Exercises" description="Admin content management for exercise database and video metadata.">
      <ManageExercises />
    </PageShell>
  );
}
