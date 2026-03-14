import "dotenv/config";

export const config = {
  llm: {
    groqApiKey: process.env.GROQ_API_KEY ?? "",
    model: process.env.LLM_MODEL ?? "llama-3.3-70b-versatile",
    maxTokens: Number(process.env.LLM_MAX_TOKENS ?? 4096),
  },
  chunking: {
    minEventsPerChunk: 8,
    maxEventsPerChunk: 20,
    maxChunksPerSession: 25,
  },
  retrieval: {
    maxSelectedChunks: 6,
  },
  routing: {
    confidenceThreshold: 0.7,
    reviewAmountThreshold: 5000,
    maxPayoutHardCap: 50000,
  },
} as const;
