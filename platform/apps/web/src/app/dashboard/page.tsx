"use client";

import { useAuth } from "@/hooks/use-auth";
import { ConnectWallet } from "@/components/connect-wallet";
import { AgentList } from "@/components/dashboard/agent-list";
import { CliTokenGenerator } from "@/components/dashboard/cli-token-generator";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardPage() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Sign in to view your dashboard</h1>
        <ConnectWallet />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {session.address.slice(0, 6)}...{session.address.slice(-4)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/onboarding">
              <Button variant="outline" size="sm">
                Add Agent
              </Button>
            </Link>
            <ConnectWallet />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Your Agents</h2>
            <AgentList />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-4">Tools</h2>
            <CliTokenGenerator />
          </div>
        </div>
      </div>
    </main>
  );
}
