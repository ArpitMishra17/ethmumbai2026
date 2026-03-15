import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";

export async function GET(req: NextRequest) {
  try {
    // 1. Fetch Fileverse/Session stats
    const p = prisma as any;
    const totalSessions = await p.session.count();
    const anchoredSessions = await p.session.count({
      where: { anchoredAt: { not: null } },
    });
    const fileverseLogs = await p.session.count({
      where: { fileverseRowId: { not: null } },
    });

    // 2. Fetch Claim stats
    const totalClaims = await p.claim.count();
    const approvedClaims = await p.claim.count({
      where: { decision: "approve" },
    });
    const rejectedClaims = await p.claim.count({
      where: { decision: "reject" },
    });
    const reviewRequired = await p.claim.count({
      where: { decision: "review" },
    });

    const totalPayoutsResult = await p.claim.aggregate({
      _sum: {
        payoutAmount: true,
      },
      where: {
        decision: "approve",
      },
    });

    const totalPayouts = totalPayoutsResult._sum.payoutAmount || 0;
    const successRate = totalClaims > 0 ? (approvedClaims / totalClaims) * 100 : 0;

    return NextResponse.json({
      success: true,
      stats: {
        sessions: {
          total: totalSessions,
          anchored: anchoredSessions,
          fileverse: fileverseLogs,
        },
        claims: {
          total: totalClaims,
          approved: approvedClaims,
          rejected: rejectedClaims,
          review: reviewRequired,
          payouts: totalPayouts,
          successRate: successRate.toFixed(1),
        },
      },
    });
  } catch (error: any) {
    console.error("[StatsAPI] Failed to fetch statistics:", error);
    return NextResponse.json(
      { error: "Internal Server Error fetching statistics" },
      { status: 500 }
    );
  }
}
