"use server";

import { publicClient, sessionRegistryAbi, sessionRegistryAddress } from "@/lib/viemClient";

export async function getOnChainSessionHash(
  sessionId: string,
  agentEns: string,
  walletAddress: string
): Promise<string | null> {
  try {
    const hash = await publicClient.readContract({
      address: sessionRegistryAddress,
      abi: sessionRegistryAbi,
      functionName: "getSessionHash",
      args: [sessionId, agentEns, walletAddress as `0x${string}`],
    }) as string;

    // The contract returns bytes32, which defaults to zero hash if not found
    if (
      !hash ||
      hash === "0x0000000000000000000000000000000000000000000000000000000000000000"
    ) {
      return null;
    }

    return hash;
  } catch (error) {
    console.error("Failed to fetch on-chain session hash:", error);
    return null;
  }
}
