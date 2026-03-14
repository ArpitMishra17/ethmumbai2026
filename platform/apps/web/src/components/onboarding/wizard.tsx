"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useOnboarding } from "@/hooks/use-onboarding";
import { ConnectWallet } from "@/components/connect-wallet";
import { StepEns } from "./step-ens";
import { StepAgent } from "./step-agent";
import { StepVerify } from "./step-verify";
import { StepCollector } from "./step-collector";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";

const STEPS = [
  { key: "wallet_pending", label: "Connect Wallet" },
  { key: "ens_pending", label: "ENS Name" },
  { key: "agent_pending", label: "Register Agent" },
  { key: "verification_pending", label: "Verify" },
  { key: "collector_pending", label: "CLI Setup" },
] as const;

export function OnboardingWizard() {
  const router = useRouter();
  const { session, isConnected } = useAuth();
  const { status, isLoading, fetchStatus } = useOnboarding();
  const [ensName, setEnsName] = useState("");
  const [agentDbId, setAgentDbId] = useState("");
  const [agentId, setAgentId] = useState(0);

  // Fetch existing user data so verification step works even after refresh
  const fetchUserData = useCallback(async () => {
    try {
      const [agentsRes, ensRes] = await Promise.all([
        fetch("/api/agents"),
        fetch("/api/ens/profile"),
      ]);

      if (ensRes.ok) {
        const { ensName: name } = await ensRes.json();
        if (name) setEnsName(name);
      }

      if (agentsRes.ok) {
        const { agents } = await agentsRes.json();
        if (agents && agents.length > 0) {
          const latest = agents[0];
          setAgentDbId(latest.id);
          setAgentId(latest.agentId);
          if (latest.ensName) setEnsName(latest.ensName);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchStatus();
      fetchUserData();
    }
  }, [session, fetchStatus, fetchUserData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const currentStepIndex = STEPS.findIndex((s) => s.key === status);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress */}
      <div className="flex gap-2">
        {STEPS.map((step, i) => (
          <div
            key={step.key}
            className={`flex-1 h-2 rounded-full ${
              i <= currentStepIndex ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        Step {currentStepIndex + 1} of {STEPS.length}: {STEPS[currentStepIndex]?.label}
      </p>

      {/* Step content */}
      {status === "wallet_pending" && (
        <Card>
          <CardHeader>
            <CardTitle>Connect Your Wallet</CardTitle>
            <CardDescription>Connect and sign in to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <ConnectWallet />
          </CardContent>
        </Card>
      )}

      {status === "ens_pending" && (
        <StepEns
          onComplete={(name) => {
            setEnsName(name);
            fetchStatus();
          }}
        />
      )}

      {status === "agent_pending" && (
        <StepAgent
          ensName={ensName}
          onComplete={(dbId, id) => {
            setAgentDbId(dbId);
            setAgentId(id);
            fetchStatus();
          }}
        />
      )}

      {status === "verification_pending" && (
        <StepVerify
          ensName={ensName}
          agentId={agentId}
          agentDbId={agentDbId}
          onComplete={() => fetchStatus()}
        />
      )}

      {status === "collector_pending" && (
        <StepCollector
          onComplete={() => router.push("/dashboard")}
        />
      )}
    </div>
  );
}
