import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildAgentMetadata } from "@/lib/metadata";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Look up by either DB id or agentId (on-chain ID)
  const agent = await prisma.insuredAgent.findFirst({
    where: {
      OR: [
        { id },
        { agentId: isNaN(Number(id)) ? -1 : Number(id) },
      ],
    },
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const metadata = buildAgentMetadata(
    agent.name,
    agent.description,
    agent.ensName || "",
    agent.agentId,
    agent.verificationStatus
  );

  return NextResponse.json(metadata, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=60",
    },
  });
}
