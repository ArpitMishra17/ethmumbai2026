import { OnboardingWizard } from "@/components/onboarding/wizard";

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">AgentCover Onboarding</h1>
          <p className="text-muted-foreground mt-2">
            Set up insurance coverage for your AI agent in a few steps
          </p>
        </div>
        <OnboardingWizard />
      </div>
    </main>
  );
}
