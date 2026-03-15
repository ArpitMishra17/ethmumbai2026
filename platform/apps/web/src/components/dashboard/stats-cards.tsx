"use client";

import React, { useEffect, useState } from "react";

interface StatsData {
  sessions: {
    total: number;
    anchored: number;
    fileverse: number;
  };
  claims: {
    total: number;
    approved: number;
    rejected: number;
    review: number;
    payouts: number;
    successRate: string;
  };
}

export function StatsCards() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/stats");
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
        }
      } catch (error) {
        console.error("Failed to fetch statistics:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (isLoading) {
    return <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-24 bg-[#0a0a0a] border border-[#1a1a1a] rounded-md" />
      ))}
    </div>;
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
      {/* Payouts Card */}
      <div className="p-5 border border-[#1a1a1a] rounded-md bg-[#0a0a0a] hover:border-[rgba(181,245,66,0.3)] transition-all group">
        <div className="text-[12px] text-[#d4d4d8] uppercase tracking-[1px] mb-1">Total Payouts</div>
        <div className="text-[24px] font-bold text-[#b5f542] group-hover:drop-shadow-[0_0_8px_rgba(181,245,66,0.3)] transition-all">
          ${stats.claims.payouts.toLocaleString()}
        </div>
        <div className="text-[11px] text-[#525252] mt-1 italic">Approved evaluations</div>
      </div>

      {/* Logs Card */}
      <div className="p-5 border border-[#1a1a1a] rounded-md bg-[#0a0a0a] hover:border-[rgba(125,211,252,0.3)] transition-all group">
        <div className="text-[12px] text-[#d4d4d8] uppercase tracking-[1px] mb-1">Logs Anchored</div>
        <div className="text-[24px] font-bold text-[#7dd3fc] group-hover:drop-shadow-[0_0_8px_rgba(125,211,252,0.3)] transition-all">
          {stats.sessions.anchored}
        </div>
        <div className="text-[11px] text-[#525252] mt-1 italic">{stats.sessions.fileverse} on Fileverse</div>
      </div>

      {/* Success Rate Card */}
      <div className="p-5 border border-[#1a1a1a] rounded-md bg-[#0a0a0a] hover:border-[rgba(34,197,94,0.3)] transition-all group">
        <div className="text-[12px] text-[#d4d4d8] uppercase tracking-[1px] mb-1">Claim Success</div>
        <div className="text-[24px] font-bold text-[#22c55e] group-hover:drop-shadow-[0_0_8px_rgba(34,197,94,0.3)] transition-all">
          {stats.claims.successRate}%
        </div>
        <div className="text-[11px] text-[#525252] mt-1 italic">{stats.claims.approved} of {stats.claims.total} approved</div>
      </div>

      {/* Pending Reviews Card */}
      <div className="p-5 border border-[#1a1a1a] rounded-md bg-[#0a0a0a] hover:border-[rgba(245,158,11,0.3)] transition-all group">
        <div className="text-[12px] text-[#d4d4d8] uppercase tracking-[1px] mb-1">AI Reviews</div>
        <div className="text-[24px] font-bold text-[#f59e0b] group-hover:drop-shadow-[0_0_8px_rgba(245,158,11,0.3)] transition-all">
          {stats.claims.review}
        </div>
        <div className="text-[11px] text-[#525252] mt-1 italic">Need human verification</div>
      </div>
    </div>
  );
}
