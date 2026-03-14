import { createHash } from 'crypto';
import type { SimplifiedSession } from './types';

/**
 * Compute a deterministic SHA-256 hash of a SimplifiedSession.
 * Keys are sorted before serialization to guarantee stability.
 */
export function computeSessionHash(session: SimplifiedSession): string {
  const sorted = sortKeys(session);
  const canonical = JSON.stringify(sorted);
  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}

export function hashMatches(session: SimplifiedSession, expected: string): boolean {
  return computeSessionHash(session) === expected;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = sortKeys((value as Record<string, unknown>)[k]);
        return acc;
      }, {});
  }
  return value;
}
