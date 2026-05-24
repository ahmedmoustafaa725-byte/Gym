import { ManageUsers } from "@/components/admin/admin-resources";
import { PageShell } from "@/components/ui/page-shell";

export default function AdminUsersPage() {
  return (
    <PageShell title="Manage Users" description="Admin overview for users and roles.">
      <ManageUsers />
    </PageShell>
  );
}
