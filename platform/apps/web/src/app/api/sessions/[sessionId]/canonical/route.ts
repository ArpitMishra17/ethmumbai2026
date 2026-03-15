import { NextResponse } from "next/server";

const DEFAULT_FILEVERSE_BACKEND_URL = "http://localhost:8000";

function extractJsonBlock(input: string): string | null {
  const fenced = input.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const trimmed = input.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;

  return null;
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await ctx.params;
  const backendUrl =
    process.env.FILEVERSE_BACKEND_URL ||
    process.env.NEXT_PUBLIC_FILEVERSE_BACKEND_URL ||
    DEFAULT_FILEVERSE_BACKEND_URL;

  try {
    const response = await fetch(
      `${backendUrl.replace(/\/$/, "")}/sessions/${encodeURIComponent(sessionId)}/doc`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return NextResponse.json(
        { error: text || "Failed to fetch canonical session" },
        { status: response.status }
      );
    }

    const payload = await response.json();
    const markdown =
      payload?.doc?.content ||
      payload?.content ||
      "";

    const jsonBlock = extractJsonBlock(String(markdown));
    if (!jsonBlock) {
      return NextResponse.json(
        { error: "Canonical session JSON not found in Fileverse document" },
        { status: 404 }
      );
    }

    const session = JSON.parse(jsonBlock) as Record<string, unknown>;
    return NextResponse.json({ session });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch canonical session",
      },
      { status: 500 }
    );
  }
}
