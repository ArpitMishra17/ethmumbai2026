import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyEnsip25 } from "@/lib/ensip25";
import { AGENT_REGISTRY_ADDRESS } from "@/lib/constants";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { agentDbId } = await req.json();
  if (!agentDbId) {
    return NextResponse.json({ error: "agentDbId required" }, { status: 400 });
  }

  const agent = await prisma.insuredAgent.findFirst({
    where: { id: agentDbId, userId: session.userId },
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  if (!agent.ensName) {
    return NextResponse.json({ error: "Agent has no ENS name" }, { status: 400 });
  }

  const result = await verifyEnsip25(agent.ensName, AGENT_REGISTRY_ADDRESS, agent.agentId, session.address);

  const newStatus = result.verified ? "verified" : "failed";
  await prisma.insuredAgent.update({
    where: { id: agentDbId },
    data: { verificationStatus: newStatus },
  });

  if (result.verified) {
    await prisma.onboardingSession.updateMany({
      where: { userId: session.userId, status: "verification_pending" },
      data: { status: "collector_pending" },
    });
  }

  return NextResponse.json({ ...result, status: newStatus });
}
