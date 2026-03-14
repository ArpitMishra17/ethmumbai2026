"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConnectWallet } from "@/components/connect-wallet";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const { session } = useAuth();

  return (
    <main className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <span className="text-xl font-bold">AgentCover</span>
          <div className="flex items-center gap-4">
            {session && (
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  Dashboard
                </Button>
              </Link>
            )}
            <ConnectWallet />
          </div>
        </div>
      </nav>

      <section className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-5xl font-bold tracking-tight mb-6">
          Insurance for
          <br />
          <span className="text-primary">AI Agents</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          On-chain coverage for autonomous AI agents. Register your agent,
          verify ownership via ENS, and get insured — all on-chain.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/onboarding">
            <Button size="lg">Get Covered</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="lg">
              Dashboard
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-24 text-left">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Multi-Chain</h3>
            <p className="text-sm text-muted-foreground">
              Agent registry on Base Sepolia, ENS identity on Ethereum Sepolia.
              Seamless cross-chain verification.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">ENSIP-25 Verified</h3>
            <p className="text-sm text-muted-foreground">
              Prove agent ownership through ENS text records using the
              ERC-7930 interoperable address standard.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">CLI Integration</h3>
            <p className="text-sm text-muted-foreground">
              Connect your agents programmatically with our CLI tool.
              Generate tokens and manage agents from your terminal.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
