import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const p = prisma as any;
    const claim = await p.claim.findUnique({
      where: { id },
    });

    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, claim });
  } catch (error: any) {
    console.error("[ClaimAPI] Failed to fetch claim:", error);
    return NextResponse.json(
      { error: "Internal Server Error fetching claim" },
      { status: 500 }
    );
  }
}
