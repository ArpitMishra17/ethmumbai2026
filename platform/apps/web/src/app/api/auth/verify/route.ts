import { NextRequest, NextResponse } from "next/server";
import { verifySiweMessage, consumeNonce } from "@/lib/siwe";
import { createSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { message, signature } = await req.json();
    if (!message || !signature) {
      return NextResponse.json({ error: "Message and signature required" }, { status: 400 });
    }

    const result = await verifySiweMessage(message, signature);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const { address, chainId, nonce } = result.data;
    const nonceValid = await consumeNonce(address, nonce);
    if (!nonceValid) {
      return NextResponse.json({ error: "Invalid or expired nonce" }, { status: 401 });
    }

    let user = await prisma.user.findUnique({ where: { address } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          address,
          onboardingSession: { create: { status: "ens_pending" } },
        },
      });
    }

    const session = await createSession({
      address,
      chainId,
      userId: user.id,
    });

    return NextResponse.json({ ok: true, address, userId: user.id });
  } catch (error) {
    console.error("SIWE verify error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
