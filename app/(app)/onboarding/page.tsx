import { OnboardingFlow } from "@/components/onboarding-flow";
import { PageShell } from "@/components/ui/page-shell";

export default function OnboardingPage() {
  return (
    <PageShell title="Onboarding" description="Build your first personalized training and nutrition profile.">
      <OnboardingFlow />
    </PageShell>
  );
}
