import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function authenticateCliToken(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  const tokenHashed = hashToken(token);
  const cliToken = await prisma.cliToken.findUnique({
    where: { tokenHash: tokenHashed },
    include: { user: true },
  });

  if (!cliToken || cliToken.expiresAt < new Date()) return null;
  return cliToken;
}

export async function GET(req: NextRequest) {
  const cliToken = await authenticateCliToken(req);
  if (!cliToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const agents = await prisma.insuredAgent.findMany({
    where: { userId: cliToken.userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ agents });
}
