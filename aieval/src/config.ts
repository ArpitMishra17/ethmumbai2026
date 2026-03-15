import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { config as dotenvConfig } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", ".env");
console.log(`[AiEvalConfig] Loading .env from: ${envPath}`);
const result = dotenvConfig({ path: envPath });

if (result.error) {
  console.warn(`[AiEvalConfig] Warning: Failed to load .env file at ${envPath}:`, result.error.message);
} else {
  console.log(`[AiEvalConfig] Successfully loaded .env from ${envPath}`);
}

const key = process.env.GROQ_API_KEY ?? "";
console.log(`[AiEvalConfig] GROQ_API_KEY loaded: ${key ? (key.slice(0, 8) + "...") : "MISSING"}`);

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
