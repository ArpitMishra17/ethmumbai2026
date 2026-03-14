import { NextRequest, NextResponse } from "next/server";
import { generateNonce, storeNonce } from "@/lib/siwe";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  if (!address) {
    return NextResponse.json({ error: "Address required" }, { status: 400 });
  }

  const nonce = generateNonce();
  await storeNonce(address, nonce);

  return NextResponse.json({ nonce });
}
