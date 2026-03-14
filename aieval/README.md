# @agentcover/aieval

AI evaluation layer for AgentCover claim processing. Takes a verified normalized session log plus claim data, evaluates it against warranty clauses, and returns a structured decision.

## Pipeline Stages

1. **chunkSession** — Split session into deterministic event-based chunks
2. **summarizeChunk** — LLM-powered structured summary per chunk
3. **summarizeSession** — Session-level summary from chunk summaries
4. **retrieveRelevantChunks** — Identify chunks most relevant to the claim
5. **evaluateClaim** — Match claim against clauses using raw chunk evidence
6. **routeDecision** — Deterministic business-rule routing (no LLM)

## Setup

```bash
cd aieval
pnpm install
cp .env.example .env  # Add your API key
```

## Usage

```typescript
import { runClaimEvaluation } from "@agentcover/aieval";

const result = await runClaimEvaluation({
  session: verifiedNormalizedSession,
  claimText: "The agent deleted my files without approval",
  requestedAmount: 5000,
});

// result.finalDecision.decision → "approve" | "reject" | "review"
```

## Testing

```bash
pnpm test
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GROQ_API_KEY` | Groq API key | — |
| `LLM_MODEL` | Groq model identifier | `llama-3.3-70b-versatile` |
| `LLM_MAX_TOKENS` | Max output tokens | `4096` |
