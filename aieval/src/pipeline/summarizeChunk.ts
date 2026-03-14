import { ChunkSummarySchema, type ChunkSummary, type SessionChunk } from "../types.js";
import { llmSummarizeChunk } from "../llm/client.js";

/**
 * Summarize a single session chunk into structured fields via LLM.
 * Validates output with zod before returning.
 */
export async function summarizeChunk(chunk: SessionChunk): Promise<ChunkSummary> {
  const raw = await llmSummarizeChunk(chunk);
  return ChunkSummarySchema.parse(raw);
}

/**
 * Summarize all chunks in parallel with concurrency control.
 */
export async function summarizeAllChunks(
  chunks: SessionChunk[],
  concurrency = 3
): Promise<ChunkSummary[]> {
  const results: ChunkSummary[] = new Array(chunks.length);
  const queue = chunks.map((chunk, i) => ({ chunk, i }));

  async function worker() {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;
      results[item.i] = await summarizeChunk(item.chunk);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, chunks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}
