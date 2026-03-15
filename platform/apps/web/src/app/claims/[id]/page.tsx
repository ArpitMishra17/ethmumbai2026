"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Claim {
  id: string;
  sessionId: string;
  agentId: string;
  agentEns: string;
  walletAddress: string;
  requestedAmount: number;
  payoutAmount: number;
  decision: string;
  reason: string;
  evidence: string; // JSON stringified
  status: string;
  createdAt: string;
}

export default function ClaimDetailsPage() {
  const { id } = useParams();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchClaim() {
      try {
        const res = await fetch(`/api/claims/${id}`);
        const data = await res.json();
        if (data.success) {
          setClaim(data.claim);
        }
      } catch (error) {
        console.error("Failed to fetch claim:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchClaim();
  }, [id]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#050505] flex items-center justify-center font-mono">
        <p className="text-[14px] text-[#d4d4d8] animate-phosphor-pulse">Loading verdict details...</p>
      </main>
    );
  }

  if (!claim) {
    return (
      <main className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-6 font-mono">
        <h1 className="text-[28px] font-bold text-white font-heading">Verdict not found</h1>
        <Link href="/dashboard">
          <button className="px-5 py-2 rounded bg-[#b5f542] text-black font-bold">Back to Dashboard</button>
        </Link>
      </main>
    );
  }

  const evidence = JSON.parse(claim.evidence || "[]");

  return (
    <main className="min-h-screen bg-[#050505] font-mono py-12">
      <div className="max-w-3xl mx-auto px-5">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <div className="text-[12px] text-[#b5f542] uppercase tracking-[2px] font-semibold mb-2">Claim Verdict</div>
            <h1 className="text-[32px] font-bold text-white font-heading">Case #{claim.id.slice(0, 8)}</h1>
          </div>
          <Link href="/dashboard" className="text-[14px] text-[#525252] hover:text-white transition-colors">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Status Banner */}
        <div className={`p-8 rounded-lg border mb-10 flex flex-col items-center text-center ${
          claim.decision === 'approve' ? 'bg-green-500/5 border-green-500/20 shadow-[0_0_50px_rgba(34,197,94,0.1)]' :
          claim.decision === 'reject' ? 'bg-red-500/5 border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.1)]' :
          'bg-yellow-500/5 border-yellow-500/20 shadow-[0_0_50px_rgba(245,158,11,0.1)]'
        }`}>
          <div className={`text-[12px] uppercase tracking-[3px] font-bold mb-3 ${
            claim.decision === 'approve' ? 'text-green-400' :
            claim.decision === 'reject' ? 'text-red-400' :
            'text-yellow-500'
          }`}>AI Final Decision</div>
          <div className={`text-[48px] font-black uppercase mb-4 tracking-[-1px] font-heading ${
            claim.decision === 'approve' ? 'text-green-400' :
            claim.decision === 'reject' ? 'text-red-400' :
            'text-yellow-500'
          }`}>{claim.decision}d</div>
          <div className="text-[18px] text-[#e4e4e7] max-w-lg mb-6 leading-relaxed italic">
            "{claim.reason}"
          </div>
          {claim.decision === 'approve' && (
            <div className="px-6 py-3 bg-[#b5f542] text-black rounded font-bold text-[20px]">
              Payout: ${claim.payoutAmount.toLocaleString()}
            </div>
          )}
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-8 mb-12">
          <div>
            <div className="text-[12px] text-[#525252] uppercase tracking-[1px] mb-2 font-bold">Agent Details</div>
            <div className="space-y-4">
              <div>
                <label className="text-[11px] text-[#525252] uppercase block">ENS Name</label>
                <div className="text-[15px] text-white">{claim.agentEns}</div>
              </div>
              <div>
                <label className="text-[11px] text-[#525252] uppercase block">Agent ID</label>
                <div className="text-[15px] text-white">#{claim.agentId}</div>
              </div>
            </div>
          </div>
          <div>
            <div className="text-[12px] text-[#525252] uppercase tracking-[1px] mb-2 font-bold">Session Info</div>
            <div className="space-y-4">
              <div>
                <label className="text-[11px] text-[#525252] uppercase block">Session Hash</label>
                <div className="text-[13px] text-white font-mono break-all line-clamp-1">{claim.sessionId}</div>
              </div>
              <div>
                <label className="text-[11px] text-[#525252] uppercase block">Evaluated At</label>
                <div className="text-[15px] text-white">{new Date(claim.createdAt).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Evidence Section */}
        <div>
          <div className="text-[12px] text-[#525252] uppercase tracking-[1px] mb-4 font-bold">AI Evidence Log</div>
          {evidence.length > 0 ? (
            <div className="space-y-3">
              {evidence.map((item: any, idx: number) => (
                <div key={idx} className="p-4 border border-[#1a1a1a] bg-[#0a0a0a] rounded flex gap-4">
                  <div className="text-[#525252] font-bold text-[14px]">0{idx + 1}</div>
                  <div>
                    <div className="text-[14px] text-[#e4e4e7] mb-1 font-semibold">{item.citation}</div>
                    <div className="text-[13px] text-[#525252] leading-relaxed">{item.explanation}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 border border-dashed border-[#1a1a1a] rounded text-center text-[#525252] text-[14px]">
              No granular evidence records for this case.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
