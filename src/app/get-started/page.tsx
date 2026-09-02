import type { Metadata } from "next";
import { AuthShell } from "@/components/layout/auth-shell";
import { OnboardingFlow } from "@/components/auth/onboarding-flow";

export const metadata: Metadata = { title: "Get started" };

export default function GetStartedPage() {
  return (
    <AuthShell>
      <OnboardingFlow />
    </AuthShell>
  );
}
