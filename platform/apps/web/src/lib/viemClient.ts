import { createPublicClient, createWalletClient, http, type Abi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import sessionRegistryAbiJson from "@/lib/SessionRegistry.abi.json";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

export const sessionRegistryAbi = sessionRegistryAbiJson as Abi;
export const sessionRegistryAddress = requireEnv("CONTRACT_ADDRESS") as `0x${string}`;

const rpcUrl = process.env.BASE_RPC_URL || "https://sepolia.base.org";
const account = privateKeyToAccount(requireEnv("BACKEND_PRIVATE_KEY") as `0x${string}`);

export const walletClient = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http(rpcUrl),
});

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(rpcUrl),
});
