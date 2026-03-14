import { type ZodSchema, ZodError } from "zod";

/**
 * Parse a JSON string and validate it against a Zod schema.
 * Throws a descriptive error on failure.
 */
export function parseAndValidate<T>(
  raw: string,
  schema: ZodSchema<T>,
  label: string
): T {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`${label}: invalid JSON — ${raw.slice(0, 200)}`);
  }
  const result = schema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`${label}: schema validation failed\n${issues}`);
  }
  return result.data;
}

/**
 * Try to extract JSON from LLM output that may contain markdown fences.
 */
export function extractJson(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) return fenceMatch[1].trim();
  // Try to find raw JSON object or array
  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) return jsonMatch[1].trim();
  return text.trim();
}
