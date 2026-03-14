import { BASE_SEPOLIA_CHAIN_ID } from "./constants";
import { readTextRecord } from "./ens";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { agentRegistryAbi } from "./contracts";
import { AGENT_REGISTRY_ADDRESS } from "./constants";

/**
 * ERC-7930 interoperable address encoding for EVM chains
 *
 * Format:
 *   0x0001           (version = 1)
 *   0x0000           (chainType = EVM)
 *   0x03             (chainRefLength = 3 bytes for Base Sepolia 84532)
 *   014a54           (chainRef = 84532 in big-endian hex)
 *   0x14             (addressLength = 20 bytes)
 *   <20-byte address>
 */
export function encodeErc7930Address(chainId: number, contractAddress: `0x${string}`): string {
  // Version: 0x0001
  const version = "0001";
  // Chain type: 0x0000 (EVM)
  const chainType = "0000";

  // Chain reference: encode chainId as big-endian minimal bytes
  const chainIdHex = chainId.toString(16);
  const paddedChainIdHex = chainIdHex.length % 2 === 0 ? chainIdHex : "0" + chainIdHex;
  const chainRefLength = (paddedChainIdHex.length / 2).toString(16).padStart(2, "0");

  // Address: 20 bytes
  const addressHex = contractAddress.slice(2).toLowerCase();
  const addressLength = "14"; // 20 in hex

  return `0x${version}${chainType}${chainRefLength}${paddedChainIdHex}${addressLength}${addressHex}`;
}

/**
 * Compute the ENSIP-25 text record key for agent verification
 * Format: agent-registration[<erc7930hex>][<agentId>]
 */
export function computeEnsip25RecordKey(registryAddress: `0x${string}`, agentId: number): string {
  const erc7930 = encodeErc7930Address(BASE_SEPOLIA_CHAIN_ID, registryAddress);
  return `agent-registration[${erc7930}][${agentId}]`;
}

/**
 * Verify ENSIP-25 by:
 * 1. Reading the text record from ENS on Sepolia
 * 2. Reading the agent from AgentRegistry on Base Sepolia
 * 3. Confirming both sides match: text record exists, agent is active,
 *    agent's ensName matches, and agent's owner matches the expected wallet
 */
export async function verifyEnsip25(
  ensName: string,
  registryAddress: `0x${string}`,
  agentId: number,
  expectedOwner?: string
): Promise<{ verified: boolean; reason?: string }> {
  const key = computeEnsip25RecordKey(registryAddress, agentId);

  // Read text record from ENS on Sepolia
  const textValue = await readTextRecord(ensName, key);
  if (!textValue) {
    return { verified: false, reason: "Text record not set" };
  }

  // Read agent from registry on Base Sepolia
  const baseSepoliaClient = createPublicClient({
    chain: baseSepolia,
    transport: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || "https://sepolia.base.org"),
  });

  try {
    const agent = await baseSepoliaClient.readContract({
      address: registryAddress,
      abi: agentRegistryAbi,
      functionName: "getAgent",
      args: [BigInt(agentId)],
    });

    if (!agent.isActive) {
      return { verified: false, reason: "Agent is deactivated" };
    }

    if (agent.ensName !== ensName) {
      return { verified: false, reason: "Agent ENS name does not match" };
    }

    if (expectedOwner && agent.owner.toLowerCase() !== expectedOwner.toLowerCase()) {
      return { verified: false, reason: "Agent owner does not match authenticated user" };
    }

    return { verified: true };
  } catch {
    return { verified: false, reason: "Agent not found in registry" };
  }
}
