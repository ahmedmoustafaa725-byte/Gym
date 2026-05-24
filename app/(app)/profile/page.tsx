import { ProfileSettings } from "@/components/profile/profile-settings";
import { PageShell } from "@/components/ui/page-shell";

export default function ProfilePage() {
  return (
    <PageShell title="Profile Settings" description="Manage your training profile, meal preferences, targets, and safety notes.">
      <ProfileSettings />
    </PageShell>
  );
}
