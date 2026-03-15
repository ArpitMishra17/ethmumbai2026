import express from "express";
import cors from "cors";
import { runClaimEvaluation } from "./index.js";
import { NormalizedSessionSchema } from "./types.js";
import { z } from "zod";

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const EvaluationRequestSchema = z.object({
  session: NormalizedSessionSchema,
  claimText: z.string(),
  requestedAmount: z.number(),
});

app.post("/evaluate", async (req, res) => {
  console.log(`[AiEvalServer] Received evaluation request`);
  
  try {
    const parseResult = EvaluationRequestSchema.safeParse(req.body);
    
    if (!parseResult.success) {
      console.error(`[AiEvalServer] Invalid request body:`, parseResult.error.format());
      return res.status(400).json({ 
        error: "Invalid request body", 
        details: parseResult.error.format() 
      });
    }

    const { session, claimText, requestedAmount } = parseResult.data;

    console.log(`[AiEvalServer] Evaluating session: ${session.sessionId}`);
    console.log(`[AiEvalServer] Amount: ${requestedAmount}`);

    const result = await runClaimEvaluation({
      session,
      claimText,
      requestedAmount,
    });

    console.log(`[AiEvalServer] Evaluation complete: ${result.finalDecision.decision}`);
    
    res.json(result);
  } catch (error: any) {
    console.error(`[AiEvalServer] Error during evaluation:`, error);
    res.status(500).json({ 
      error: "Internal Server Error", 
      message: error.message || String(error) 
    });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`[AiEvalServer] Service running at http://localhost:${port}`);
});
