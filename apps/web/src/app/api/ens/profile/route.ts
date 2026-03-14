import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const profile = await prisma.ensProfile.findUnique({
    where: { userId: session.userId },
  });

  return NextResponse.json({ ensName: profile?.ensName || null });
}
