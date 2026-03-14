import { SiweMessage } from "siwe";
import { prisma } from "@/lib/prisma";

export function generateNonce(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let nonce = "";
  for (let i = 0; i < 16; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce;
}

export async function storeNonce(address: string, nonce: string) {
  await prisma.siweNonce.create({
    data: {
      address: address.toLowerCase(),
      nonce,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
  });
}

export async function consumeNonce(address: string, nonce: string): Promise<boolean> {
  const entry = await prisma.siweNonce.findUnique({ where: { nonce } });

  if (!entry) return false;
  if (entry.address !== address.toLowerCase()) return false;
  if (entry.expiresAt < new Date()) {
    await prisma.siweNonce.delete({ where: { id: entry.id } });
    return false;
  }
  if (entry.consumedAt) return false;

  // Atomically mark as consumed
  const updated = await prisma.siweNonce.updateMany({
    where: { id: entry.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  return updated.count === 1;
}

export async function verifySiweMessage(message: string, signature: string) {
  const siweMessage = new SiweMessage(message);
  const result = await siweMessage.verify({ signature });
  return result;
}
