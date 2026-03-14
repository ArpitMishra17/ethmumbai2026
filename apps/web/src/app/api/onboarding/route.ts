import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { OnboardingStatus } from "@/types";

const VALID_TRANSITIONS: Record<string, string[]> = {
  wallet_pending: ["ens_pending"],
  ens_pending: ["agent_pending"],
  agent_pending: ["verification_pending"],
  verification_pending: ["collector_pending"],
  collector_pending: ["completed"],
};

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const onboarding = await prisma.onboardingSession.findUnique({
    where: { userId: session.userId },
  });

  if (!onboarding) {
    return NextResponse.json({ status: "wallet_pending" as OnboardingStatus });
  }

  return NextResponse.json({ status: onboarding.status as OnboardingStatus });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { status } = await req.json();

  const onboarding = await prisma.onboardingSession.findUnique({
    where: { userId: session.userId },
  });

  if (!onboarding) {
    return NextResponse.json({ error: "No onboarding session" }, { status: 404 });
  }

  const allowed = VALID_TRANSITIONS[onboarding.status];
  if (!allowed || !allowed.includes(status)) {
    return NextResponse.json(
      { error: `Cannot transition from ${onboarding.status} to ${status}` },
      { status: 400 }
    );
  }

  await prisma.onboardingSession.update({
    where: { userId: session.userId },
    data: { status },
  });

  return NextResponse.json({ status });
}
