import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const walletAddress = searchParams.get("walletAddress");

  const p = prisma as any;
  const agents = await p.insuredAgent.findMany({
    where: walletAddress ? { user: { address: walletAddress.toLowerCase() } } : { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  const agentsWithStats = await Promise.all(agents.map(async (agent: any) => { // Add type any for agent
    const claims = await p.claim.findMany({
      where: { 
        agentEns: agent.ensName || undefined,
        agentId: String(agent.agentId)
      }
    });

    const totalClaims = claims.length;
    const totalPayout = claims
      .filter((c: any) => c.decision === 'approve')
      .reduce((sum: number, c: any) => sum + c.payoutAmount, 0);
    
    // Calculate a trust score based on claim ratio (mock logic)
    const trustScore = totalClaims === 0 ? 98 : Math.max(70, 98 - (totalClaims * 5));

    return {
      ...agent,
      stats: {
        totalClaims,
        totalPayout,
        trustScore
      }
    };
  }));

  return NextResponse.json({ agents: agentsWithStats });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { agentId, name, description, ensName, txHash, metadataURI } = await req.json();

  if (!agentId || !name) {
    return NextResponse.json({ error: "agentId and name required" }, { status: 400 });
  }

  const agent = await prisma.insuredAgent.create({
    data: {
      userId: session.userId,
      agentId: Number(agentId),
      name,
      description: description || "",
      ensName: ensName || null,
      txHash: txHash || null,
      metadataURI: metadataURI || null,
    },
  });

  // Advance onboarding
  await prisma.onboardingSession.updateMany({
    where: { userId: session.userId, status: "agent_pending" },
    data: { status: "verification_pending" },
  });

  return NextResponse.json({ ok: true, agent });
}
