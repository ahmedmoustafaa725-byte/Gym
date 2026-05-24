import { ExerciseLibrary } from "@/components/workouts/exercise-library";
import { PageShell } from "@/components/ui/page-shell";

export default function ExerciseLibraryPage() {
  return (
    <PageShell title="Exercise Library" description="Search exercises by muscle, equipment, and difficulty. Each entry includes video source guidance.">
      <ExerciseLibrary />
    </PageShell>
  );
}
