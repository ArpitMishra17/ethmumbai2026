/**
 * Sanitize step — strips secrets, env vars, and credentials from all
 * string fields in the session before it leaves the local machine.
 */
import type { NormalizedSession } from './types';
import { sanitizeSession } from './redact';

export function sanitize(session: NormalizedSession): NormalizedSession {
  return sanitizeSession(session);
}