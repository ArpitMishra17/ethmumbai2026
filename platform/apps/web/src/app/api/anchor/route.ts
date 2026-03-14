import { createHash } from "crypto";
import * as fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { publicClient, sessionRegistryAbi, sessionRegistryAddress, walletClient } from "@/lib/viemClient";

type AnchorRequestBody = {
  sessionHash?: string;
  sessionId?: string;
  agentEns?: string;
  userId?: string;
  fileverseRowId?: string | null;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function isHexBytes32(value: string): value is `0x${string}` {
  return /^0x[a-fA-F0-9]{64}$/.test(value);
}

function isAddress(value: string): value is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
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

  if (!cliToken || cliToken.expiresAt < new Date()) {
    return null;
  }

  return cliToken;
}

function parseReason(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown anchoring error";
}

const sessionModel = (prisma as typeof prisma & {
  session: {
    findUnique: (args: {
      where: { sessionId: string };
    }) => Promise<{ baseTxHash: string | null } | null>;
    upsert: (args: {
      where: { sessionId: string };
      create: {
        sessionId: string;
        sessionHash: string;
        fileverseRowId: string | null;
        baseTxHash: string;
        anchoredAt: Date;
      };
      update: {
        sessionHash: string;
        fileverseRowId: string | null;
        baseTxHash: string;
        anchoredAt: Date;
      };
    }) => Promise<unknown>;
  };
}).session;

export async function POST(req: NextRequest) {
  try {
    const cliToken = await authenticateCliToken(req);
    if (!cliToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: AnchorRequestBody;
    try {
      body = (await req.json()) as AnchorRequestBody;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { sessionHash, sessionId, agentEns, userId, fileverseRowId } = body;

    if (!sessionHash || !sessionId || !agentEns || !userId) {
      return NextResponse.json(
        { error: "sessionHash, sessionId, agentEns, and userId are required" },
        { status: 400 }
      );
    }

    if (!isHexBytes32(sessionHash)) {
      return NextResponse.json({ error: "sessionHash must be a bytes32 hex string" }, { status: 400 });
    }

    const authenticatedWallet = cliToken.user.address as `0x${string}`;
    if (isAddress(userId) && userId.toLowerCase() !== authenticatedWallet.toLowerCase()) {
      return NextResponse.json(
        { error: "userId does not match the authenticated CLI wallet" },
        { status: 403 }
      );
    }

    const existingSession = await sessionModel.findUnique({
      where: { sessionId },
    });

    if (existingSession?.baseTxHash) {
      return NextResponse.json({ txHash: existingSession.baseTxHash });
    }

    const txHash = await walletClient.writeContract({
      address: sessionRegistryAddress,
      abi: sessionRegistryAbi,
      functionName: "anchor",
      args: [sessionHash, sessionId, agentEns, authenticatedWallet],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    if (receipt.status !== "success") {
      return NextResponse.json({ error: "Base transaction failed on-chain" }, { status: 500 });
    }

    await sessionModel.upsert({
      where: { sessionId },
      create: {
        sessionId,
        sessionHash,
        fileverseRowId: fileverseRowId ?? null,
        baseTxHash: txHash,
        anchoredAt: new Date(),
      },
      update: {
        sessionHash,
        fileverseRowId: fileverseRowId ?? null,
        baseTxHash: txHash,
        anchoredAt: new Date(),
      },
    });

    return NextResponse.json({ txHash });
  } catch (error) {
    console.error("Session anchor error:", error);
    try {
      fs.appendFileSync("c:/Ayan/Coding/Web Development/Project/ethmumbai/ethmumbai2026/anchor-error.log", String(error) + "\n" + JSON.stringify(error, Object.getOwnPropertyNames(error)) + "\n");
    } catch (e) {}
    return NextResponse.json({ error: parseReason(error) }, { status: 500 });
  }
}
