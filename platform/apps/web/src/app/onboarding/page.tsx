import { OnboardingWizard } from "@/components/onboarding/wizard";
import Link from "next/link";

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-[#050505] font-mono">
      {/* Nav */}
      <nav className="border-b border-[rgba(255,255,255,0.06)] bg-[#050505]/85 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1140px] mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="text-base font-bold text-white font-heading tracking-tight">
            AgentCover
          </Link>
          <Link href="/dashboard" className="text-[14px] text-[#d4d4d8] hover:text-white transition-colors">
            Dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-5 py-12">
        <div className="text-center mb-10">
          <div className="text-[14px] text-[#b5f542] tracking-[2px] uppercase font-semibold mb-3">
            Onboarding
          </div>
          <h1 className="text-[32px] font-bold text-white font-heading leading-[1.08]">
            Set Up Agent Coverage
          </h1>
          <p className="text-[14px] text-[#d4d4d8] mt-2 max-w-md mx-auto leading-[1.8]">
            Register and verify your AI agent in five on-chain steps
          </p>
        </div>
        <OnboardingWizard />
      </div>
    </main>
  );
}
