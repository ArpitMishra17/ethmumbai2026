"use client";

import { useAuth } from "@/hooks/use-auth";
import { ConnectWallet } from "@/components/connect-wallet";
import { AgentList } from "@/components/dashboard/agent-list";
import { CliTokenGenerator } from "@/components/dashboard/cli-token-generator";
import Link from "next/link";

export default function DashboardPage() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#050505] flex items-center justify-center font-mono">
        <p className="text-[14px] text-[#d4d4d8] animate-phosphor-pulse">Loading...</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-6 font-mono">
        <h1 className="text-[28px] font-bold text-white font-heading">
          Sign in to view your dashboard
        </h1>
        <p className="text-[14px] text-[#d4d4d8]">Connect your wallet and sign with Ethereum</p>
        <ConnectWallet />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] font-mono">
      {/* Nav */}
      <nav className="border-b border-[rgba(255,255,255,0.06)] bg-[#050505]/85 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1140px] mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="text-base font-bold text-white font-heading tracking-tight">
            AgentCover
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/claims" className="text-[14px] text-[#d4d4d8] hover:text-white transition-colors">
              Verify Claims
            </Link>
            <ConnectWallet />
          </div>
        </div>
      </nav>

      <div className="max-w-[1140px] mx-auto px-5 pt-10 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="text-[14px] text-[#b5f542] tracking-[2px] uppercase font-semibold mb-2">
              Dashboard
            </div>
            <div className="text-[14px] text-[#d4d4d8] font-mono">
              {session.address.slice(0, 6)}...{session.address.slice(-4)}
            </div>
          </div>
          <Link href="/onboarding">
            <button className="px-[22px] py-[11px] text-[14px] font-semibold rounded border border-[#b5f542] text-black bg-[#b5f542] hover:bg-[#c8fc5a] transition-all cursor-pointer font-mono">
              Add Agent
            </button>
          </Link>
        </div>

        {/* Agents section */}
        <div className="mb-8">
          <div className="text-[14px] text-[#d4d4d8] tracking-[2px] uppercase mb-4">
            Your Agents
          </div>
          <AgentList />
        </div>

        {/* CLI section */}
        <div>
          <div className="text-[14px] text-[#d4d4d8] tracking-[2px] uppercase mb-4">
            Tools
          </div>
          <div className="max-w-md">
            <CliTokenGenerator />
          </div>
        </div>
      </div>
    </main>
  );
}
