import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session, claimText, requestedAmount } = body;

    if (!session || !claimText || typeof requestedAmount !== 'number') {
      return NextResponse.json(
        { error: "Missing required fields: session, claimText, or requestedAmount" },
        { status: 400 }
      );
    }

    console.log(`[EvaluateAPI] Proxying request to aieval microservice for: ${session.sessionId}`);

    // Call the standalone aieval microservice
    const aievalRes = await fetch("http://localhost:3001/evaluate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session,
        claimText,
        requestedAmount,
      }),
    });

    if (!aievalRes.ok) {
      const errorText = await aievalRes.text();
      console.error(`[EvaluateAPI] Microservice returned error: ${aievalRes.status}`, errorText);
      return NextResponse.json(
        { error: `AI Evaluation Service Error (${aievalRes.status})` },
        { status: aievalRes.status }
      );
    }

    const evaluationResult = await aievalRes.json();
    console.log(`[EvaluateAPI] Evaluation complete. Decision: ${evaluationResult.finalDecision.decision}`);

    // Persist claim to database
    try {
      const { prisma } = await import("@/db/prisma");
      const p = prisma as any;
      await p.claim.create({
        data: {
          sessionId: session.sessionId,
          agentId: String(session.agentId || ""),
          agentEns: String(session.agentEns || ""),
          walletAddress: String(session.walletId || "").toLowerCase(),
          requestedAmount: Number(requestedAmount),
          payoutAmount: Number(evaluationResult.finalDecision.recommendedPayout),
          decision: evaluationResult.finalDecision.decision,
          reason: evaluationResult.finalDecision.reason,
          evidence: JSON.stringify(evaluationResult.evaluatorOutput.evidence || []),
          status: evaluationResult.finalDecision.decision === 'approve' ? 'paid' : 
                  evaluationResult.finalDecision.decision === 'reject' ? 'rejected' : 'submitted',
        }
      });
      console.log(`[EvaluateAPI] Claim persisted for session: ${session.sessionId}`);
    } catch (dbError) {
      console.error("[EvaluateAPI] Failed to persist claim:", dbError);
      // We don't fail the request if DB persistence fails, but we log it
    }

    return NextResponse.json({
      success: true,
      decision: evaluationResult.finalDecision,
      evaluatorOutput: evaluationResult.evaluatorOutput,
      sessionSummary: evaluationResult.sessionSummary,
    });
  } catch (error: any) {
    console.error("[EvaluateAPI] Failed to proxy evaluation request:", error);
    return NextResponse.json(
      { error: "Internal Server Error during LLM Evaluation Proxy: " + (error.message || String(error)) },
      { status: 500 }
    );
  }
}
