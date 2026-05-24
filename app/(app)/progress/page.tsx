import { ProgressDashboard } from "@/components/progress/progress-dashboard";
import { PageShell } from "@/components/ui/page-shell";

export default function ProgressPage() {
  return (
    <PageShell title="Progress" description="Track body metrics, strength, consistency, check-ins, and smart plan adjustments.">
      <ProgressDashboard />
    </PageShell>
  );
}
