import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { PageShell } from "@/components/ui/page-shell";

export default function DashboardPage() {
  return (
    <PageShell title="Dashboard" description="Your daily training, nutrition, and progress snapshot.">
      <DashboardOverview />
    </PageShell>
  );
}
