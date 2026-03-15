import type { SimplifiedSession, HashedSession } from './types';
import { computeSessionHash } from './hash';

export async function addHash(session: SimplifiedSession): Promise<HashedSession> {
  const contentHash = await computeSessionHash(session);
  return {
    ...session,
    contentHash,
    hashVersion: '1',
  };
}