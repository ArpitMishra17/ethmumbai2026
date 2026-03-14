import { SiweMessage } from "siwe";

const nonceStore = new Map<string, { nonce: string; expiresAt: number }>();

export function generateNonce(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let nonce = "";
  for (let i = 0; i < 16; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce;
}

export function storeNonce(address: string, nonce: string) {
  nonceStore.set(address.toLowerCase(), {
    nonce,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });
}

export function consumeNonce(address: string): string | null {
  const entry = nonceStore.get(address.toLowerCase());
  if (!entry || entry.expiresAt < Date.now()) {
    nonceStore.delete(address.toLowerCase());
    return null;
  }
  nonceStore.delete(address.toLowerCase());
  return entry.nonce;
}

export async function verifySiweMessage(message: string, signature: string) {
  const siweMessage = new SiweMessage(message);
  const result = await siweMessage.verify({ signature });
  return result;
}
