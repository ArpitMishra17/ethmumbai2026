import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";

export async function GET(req: NextRequest) {
  try {
    // Optionally filter by wallet if provided in query
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get("wallet");

    const p = prisma as any;
    const claims = await p.claim.findMany({
      where: wallet ? { walletAddress: wallet.toLowerCase() } : {},
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({ success: true, claims });
  } catch (error: any) {
    console.error("[ClaimsAPI] Failed to fetch claims:", error);
    return NextResponse.json(
      { error: "Internal Server Error fetching claims" },
      { status: 500 }
    );
  }
}
