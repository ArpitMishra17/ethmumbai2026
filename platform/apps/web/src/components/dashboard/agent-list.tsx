"use client";

import { useEffect, useState } from "react";
import type { InsuredAgentData } from "@/types";

export function AgentList() {
  const [agents, setAgents] = useState<InsuredAgentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/agents")
      .then((r) => r.json())
      .then((d) => setAgents(d.agents || []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <p className="text-[14px] text-[#d4d4d8] font-mono animate-phosphor-pulse">
        Loading agents...
      </p>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="border border-[#1a1a1a] rounded-md bg-[#0a0a0a] p-8 text-center">
        <p className="text-[14px] text-[#d4d4d8]">No agents registered yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {agents.map((agent) => {
        const isVerified = agent.verificationStatus === "verified";
        const isPending = agent.verificationStatus === "pending";

        return (
          <div
            key={agent.id}
            className="p-5 border border-[#1a1a1a] rounded-md bg-[#0a0a0a] hover:border-[#2a2a2a] transition-all"
          >
            {/* Head */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="text-[14px] text-[#e4e4e7] font-semibold">{agent.name}</div>
                {agent.ensName && (
                  <div className="text-[14px] text-[#b5f542] mt-0.5">{agent.ensName}</div>
                )}
              </div>
              <div
                className={`text-[14px] py-0.5 px-2 rounded font-semibold tracking-[1px] uppercase border ${
                  isVerified
                    ? "text-[#b5f542] bg-[rgba(181,245,66,0.08)] border-[rgba(181,245,66,0.15)]"
                    : isPending
                      ? "text-[#f59e0b] bg-[rgba(245,158,11,0.08)] border-[rgba(245,158,11,0.15)]"
                      : "text-[#ef4444] bg-[rgba(239,68,68,0.08)] border-[rgba(239,68,68,0.15)]"
                }`}
              >
                {agent.verificationStatus}
              </div>
            </div>

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-[14px] text-[#d4d4d8] uppercase tracking-[1px]">Agent ID</div>
                <div className="text-[14px] text-[#d4d4d8] mt-0.5">#{agent.agentId}</div>
              </div>
              <div>
                <div className="text-[14px] text-[#d4d4d8] uppercase tracking-[1px]">Registry</div>
                <div className="text-[14px] text-[#d4d4d8] mt-0.5">Base Sepolia</div>
              </div>
              {agent.description && (
                <div className="col-span-2">
                  <div className="text-[14px] text-[#d4d4d8] uppercase tracking-[1px]">Description</div>
                  <div className="text-[14px] text-[#d4d4d8] mt-0.5">{agent.description}</div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
