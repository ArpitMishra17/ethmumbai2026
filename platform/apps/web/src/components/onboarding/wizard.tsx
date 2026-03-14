"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useOnboarding } from "@/hooks/use-onboarding";
import { ConnectWallet } from "@/components/connect-wallet";
import { StepEns } from "./step-ens";
import { StepAgent } from "./step-agent";
import { StepVerify } from "./step-verify";
import { StepCollector } from "./step-collector";
import { useRouter } from "next/navigation";

const STEPS = [
  { key: "wallet_pending", label: "Connect", chain: "any chain" },
  { key: "ens_pending", label: "Claim ENS", chain: "eth sepolia" },
  { key: "agent_pending", label: "Register", chain: "base sepolia" },
  { key: "verification_pending", label: "Verify", chain: "eth sepolia" },
  { key: "collector_pending", label: "CLI Token", chain: "off-chain" },
] as const;

export function OnboardingWizard() {
  const router = useRouter();
  const { session, isConnected } = useAuth();
  const { status, isLoading, fetchStatus } = useOnboarding();
  const [ensName, setEnsName] = useState("");
  const [agentDbId, setAgentDbId] = useState("");
  const [agentId, setAgentId] = useState(0);

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
        <p className="text-[14px] text-[#d4d4d8] animate-phosphor-pulse">Loading...</p>
      </div>
    );
  }

  const currentStepIndex = STEPS.findIndex((s) => s.key === status);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Pipeline — matching c1-pipeline exactly */}
      <div className="flex gap-0.5">
        {STEPS.map((step, i) => {
          const isActive = i === currentStepIndex;
          const isDone = i < currentStepIndex;
          return (
            <div
              key={step.key}
              className={`flex-1 py-5 px-4 bg-[#0a0a0a] border transition-all ${
                isActive
                  ? "border-[#b5f542] bg-[rgba(181,245,66,0.04)]"
                  : isDone
                    ? "border-[rgba(181,245,66,0.15)] bg-[rgba(181,245,66,0.02)]"
                    : "border-[#1a1a1a]"
              } ${i === 0 ? "rounded-l-md" : ""} ${
                i === STEPS.length - 1 ? "rounded-r-md" : ""
              }`}
            >
              <div className={`text-[14px] mb-1 ${isActive || isDone ? "text-[#b5f542]" : "text-[#d4d4d8]"}`}>
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className={`text-[14px] font-semibold ${isActive || isDone ? "text-[#e4e4e7]" : "text-[#d4d4d8]"}`}>
                {step.label}
              </div>
              <span className={`inline-block mt-1.5 text-[14px] ${
                isActive || isDone ? "text-[#d4d4d8]" : "text-[#d4d4d8]"
              } bg-[rgba(255,255,255,0.03)] px-2 py-0.5 rounded`}>
                {step.chain}
              </span>
            </div>
          );
        })}
      </div>

      {/* Step content */}
      {status === "wallet_pending" && (
        <div className="border border-[#1a1a1a] rounded-md bg-[#0a0a0a] p-8 text-center space-y-5">
          <h3 className="text-[18px] font-semibold text-white font-heading">
            Connect Your Wallet
          </h3>
          <p className="text-[14px] text-[#d4d4d8]">
            SIWE auth via injected or Coinbase Wallet
          </p>
          <div className="flex justify-center">
            <ConnectWallet />
          </div>
        </div>
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
