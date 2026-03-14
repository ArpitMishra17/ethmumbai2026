import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const agents = await prisma.insuredAgent.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ agents });
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
