import Groq from "groq-sdk";
import { config } from "../config.js";
import type {
  ChunkSummary,
  ClaimInput,
  SessionChunk,
  SessionSummary,
} from "../types.js";
import type { EvaluateClaimInput } from "../pipeline/evaluateClaim.js";
import {
  buildChunkSummaryPrompt,
  buildEvaluationPrompt,
  buildRetrievalPrompt,
  buildSessionSummaryPrompt,
} from "./prompts.js";
import { extractJson } from "../utils/json.js";

// ── Groq client singleton ──

let _client: Groq | null = null;

function getClient(): Groq {
  if (!_client) {
    _client = new Groq({ apiKey: config.llm.groqApiKey });
  }
  return _client;
}

async function callLLM(prompt: string): Promise<string> {
  const client = getClient();
  const response = await client.chat.completions.create({
    model: config.llm.model,
    max_tokens: config.llm.maxTokens,
    messages: [
      {
        role: "system",
        content:
          "You are a precise JSON-only responder. Always respond with valid JSON matching the requested schema. No markdown fences, no commentary — just the JSON object.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.1,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No content in Groq response");
  }
  return content;
}

// ── Exported LLM methods used by pipeline stages ──

export async function llmSummarizeChunk(
  chunk: SessionChunk
): Promise<ChunkSummary> {
  const prompt = buildChunkSummaryPrompt(chunk.chunkId, chunk.rawText);
  const raw = await callLLM(prompt);
  return JSON.parse(extractJson(raw));
}

export async function llmSummarizeSession(
  sessionId: string,
  chunkSummaries: ChunkSummary[]
): Promise<SessionSummary> {
  const prompt = buildSessionSummaryPrompt(sessionId, chunkSummaries);
  const raw = await callLLM(prompt);
  return JSON.parse(extractJson(raw));
}

export async function llmRetrieveRelevantChunks(
  claim: ClaimInput,
  sessionSummary: SessionSummary,
  chunkSummaries: ChunkSummary[]
): Promise<unknown> {
  const prompt = buildRetrievalPrompt(claim, sessionSummary, chunkSummaries);
  const raw = await callLLM(prompt);
  return JSON.parse(extractJson(raw));
}

export async function llmEvaluateClaim(
  input: EvaluateClaimInput
): Promise<unknown> {
  const prompt = buildEvaluationPrompt(input);
  const raw = await callLLM(prompt);
  return JSON.parse(extractJson(raw));
}
