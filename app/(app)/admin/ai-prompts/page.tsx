import { ManageAIPrompts } from "@/components/admin/admin-resources";
import { PageShell } from "@/components/ui/page-shell";

export default function AdminAIPromptsPage() {
  return (
    <PageShell title="Manage AI Prompts" description="Admin prompt templates for food parsing, workout generation, and check-ins.">
      <ManageAIPrompts />
    </PageShell>
  );
}
