"use client";

import { useAuth } from "@/hooks/use-auth";
import { ConnectWallet } from "@/components/connect-wallet";
import { AgentList } from "@/components/dashboard/agent-list";
import { CliTokenGenerator } from "@/components/dashboard/cli-token-generator";
import { ClaimList } from "@/components/dashboard/claim-list";
import { StatsCards } from "@/components/dashboard/stats-cards";
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
      <div className="max-w-[1140px] mx-auto px-5 pt-10 pb-20">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="text-[14px] text-[#b5f542] tracking-[2px] uppercase font-semibold mb-2">
              Dashboard
            </div>
            <div className="text-[14px] text-[#d4d4d8] font-mono">
              {session.address.slice(0, 6)}...{session.address.slice(-4)}
            </div>
          </div>
          {/* <Link href="/onboarding">
            <button className="px-[22px] py-[11px] text-[14px] font-semibold rounded border border-[#b5f542] text-black bg-[#b5f542] hover:bg-[#c8fc5a] transition-all cursor-pointer font-mono">
              Add Agent
            </button>
          </Link> */}
        </div>

        {/* Statistics Overview */}
        <StatsCards />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-12">
            {/* Agents Section */}
            <div>
              <div className="text-[14px] text-[#d4d4d8] tracking-[2px] uppercase mb-4">
                Your Agents
              </div>
              <AgentList />
            </div>

            {/* Claims History Section */}
            <div>
              <div className="text-[14px] text-[#d4d4d8] tracking-[2px] uppercase mb-4">
                Recent AI Claim Verdicts
              </div>
              <ClaimList walletAddress={session.address} />
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-12">
            {/* CLI Section */}
            <div>
              <div className="text-[14px] text-[#d4d4d8] tracking-[2px] uppercase mb-4">
                Developer Tools
              </div>
              <CliTokenGenerator />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
