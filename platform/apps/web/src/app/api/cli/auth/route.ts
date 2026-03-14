import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID, createHash } from "crypto";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { name } = await req.json().catch(() => ({ name: "default" }));

  const token = randomUUID();
  const tokenHashed = hashToken(token);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await prisma.cliToken.create({
    data: {
      userId: session.userId,
      tokenHash: tokenHashed,
      name: name || "default",
      expiresAt,
    },
  });

  // Return plaintext token only once — it is not stored
  return NextResponse.json({ token, expiresAt: expiresAt.toISOString() });
}

export async function GET(req: NextRequest) {
  // Validate CLI token from Authorization header
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const tokenHashed = hashToken(token);
  const cliToken = await prisma.cliToken.findUnique({
    where: { tokenHash: tokenHashed },
    include: { user: true },
  });

  if (!cliToken || cliToken.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  return NextResponse.json({
    userId: cliToken.userId,
    address: cliToken.user.address,
  });
}
