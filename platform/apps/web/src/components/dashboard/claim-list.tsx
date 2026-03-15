"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface Claim {
  id: string;
  sessionId: string;
  agentEns: string;
  requestedAmount: number;
  payoutAmount: number;
  decision: string;
  status: string;
  createdAt: string;
}

export function ClaimList({ walletAddress }: { walletAddress?: string }) {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchClaims() {
      try {
        const url = walletAddress ? `/api/claims?wallet=${walletAddress}` : "/api/claims";
        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
          setClaims(data.claims);
        }
      } catch (error) {
        console.error("Failed to fetch claims:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchClaims();
  }, [walletAddress]);

  if (isLoading) {
    return <div className="text-[14px] text-[#525252] font-mono">Loading claims...</div>;
  }

  if (claims.length === 0) {
    return (
      <div className="p-8 border border-dashed border-[#1a1a1a] rounded-md text-center">
        <p className="text-[14px] text-[#525252] font-mono">No claims submitted yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {claims.map((claim) => (
        <Link
          key={claim.id}
          href={`/claims/${claim.id}`}
          className="block p-4 border border-[#1a1a1a] rounded-md bg-[#0a0a0a] hover:border-[#b5f542]/40 hover:bg-[#0f0f12] transition-all flex items-center justify-between group"
        >
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-[14px] text-[#e4e4e7] font-semibold group-hover:text-[#b5f542] transition-colors">
                {claim.agentEns}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-[1px] ${
                claim.decision === 'approve' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                claim.decision === 'reject' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
              }`}>
                {claim.decision}
              </span>
            </div>
            <div className="text-[12px] text-[#525252] font-mono">
              Session: {claim.sessionId.slice(0, 12)}...
            </div>
          </div>
          <div className="text-right">
            <div className="text-[14px] text-white font-bold">
              ${claim.payoutAmount.toLocaleString()}
            </div>
            <div className="text-[10px] text-[#525252] uppercase tracking-[1px]">
              {new Date(claim.createdAt).toLocaleDateString()}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
