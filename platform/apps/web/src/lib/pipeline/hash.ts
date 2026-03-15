import type { SimplifiedSession } from './types';

/**
 * Compute a deterministic SHA-256 hash of a SimplifiedSession
 * using the browser's Web Crypto API.
 * Keys are sorted before serialization to guarantee stability.
 */
export async function computeSessionHash(session: SimplifiedSession): Promise<string> {
  const sorted = sortKeys(session);
  const canonical = JSON.stringify(sorted);
  
  const encoder = new TextEncoder();
  const data = encoder.encode(canonical);
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // Convert ArrayBuffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

export async function hashMatches(session: SimplifiedSession, expected: string): Promise<boolean> {
  const hash = await computeSessionHash(session);
  return hash === expected;
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