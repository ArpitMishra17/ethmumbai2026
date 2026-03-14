import type { SimplifiedSession, HashedSession } from './types';
import { computeSessionHash } from './hash';

export function addHash(session: SimplifiedSession): HashedSession {
  const contentHash = computeSessionHash(session);
  return {
    ...session,
    contentHash,
    hashVersion: '1',
  };
}
