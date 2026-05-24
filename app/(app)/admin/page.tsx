import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { PageShell } from "@/components/ui/page-shell";

export default function AdminPage() {
  return (
    <PageShell title="Admin Dashboard" description="Manage free platform content, templates, users, and AI prompts.">
      <AdminDashboard />
    </PageShell>
  );
}
