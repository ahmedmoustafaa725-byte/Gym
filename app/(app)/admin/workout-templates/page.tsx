import { ManageWorkoutTemplates } from "@/components/admin/admin-resources";
import { PageShell } from "@/components/ui/page-shell";

export default function AdminWorkoutTemplatesPage() {
  return (
    <PageShell title="Manage Workout Templates" description="Admin templates used by the personalized workout generator.">
      <ManageWorkoutTemplates />
    </PageShell>
  );
}
