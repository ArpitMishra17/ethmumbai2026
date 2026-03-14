import { NextRequest, NextResponse } from "next/server";
import { checkSubnameAvailable } from "@/lib/ens";

export async function GET(req: NextRequest) {
  const label = req.nextUrl.searchParams.get("label");
  if (!label) {
    return NextResponse.json({ error: "Label required" }, { status: 400 });
  }

  if (!/^[a-z0-9-]+$/.test(label) || label.length < 3 || label.length > 32) {
    return NextResponse.json(
      { error: "Label must be 3-32 chars, lowercase alphanumeric and hyphens only" },
      { status: 400 }
    );
  }

  const available = await checkSubnameAvailable(label);
  return NextResponse.json({ label, available });
}
