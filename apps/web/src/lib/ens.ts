import { createPublicClient, http, namehash, labelhash, keccak256, encodePacked } from "viem";
import { sepolia } from "viem/chains";
import {
  ENS_REGISTRY_ADDRESS,
  ENS_PUBLIC_RESOLVER_ADDRESS,
  ENS_PARENT_NAME,
} from "./constants";

export const sepoliaClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC || "https://rpc.sepolia.org"),
});

export const ensRegistryAbi = [
  {
    type: "function",
    name: "setSubnodeRecord",
    inputs: [
      { name: "node", type: "bytes32" },
      { name: "label", type: "bytes32" },
      { name: "owner", type: "address" },
      { name: "resolver", type: "address" },
      { name: "ttl", type: "uint64" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "owner",
    inputs: [{ name: "node", type: "bytes32" }],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
] as const;

export const publicResolverAbi = [
  {
    type: "function",
    name: "text",
    inputs: [
      { name: "node", type: "bytes32" },
      { name: "key", type: "string" },
    ],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "setText",
    inputs: [
      { name: "node", type: "bytes32" },
      { name: "key", type: "string" },
      { name: "value", type: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "addr",
    inputs: [{ name: "node", type: "bytes32" }],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
] as const;

export function getParentNamehash(): `0x${string}` {
  return namehash(ENS_PARENT_NAME) as `0x${string}`;
}

export function getLabelHash(label: string): `0x${string}` {
  return keccak256(encodePacked(["string"], [label])) as `0x${string}`;
}

export async function checkSubnameAvailable(label: string): Promise<boolean> {
  const fullName = `${label}.${ENS_PARENT_NAME}`;
  const node = namehash(fullName);

  try {
    const owner = await sepoliaClient.readContract({
      address: ENS_REGISTRY_ADDRESS,
      abi: ensRegistryAbi,
      functionName: "owner",
      args: [node],
    });
    return owner === "0x0000000000000000000000000000000000000000";
  } catch {
    return true;
  }
}

export async function readTextRecord(ensName: string, key: string): Promise<string> {
  const node = namehash(ensName);
  try {
    const value = await sepoliaClient.readContract({
      address: ENS_PUBLIC_RESOLVER_ADDRESS,
      abi: publicResolverAbi,
      functionName: "text",
      args: [node, key],
    });
    return value;
  } catch {
    return "";
  }
}
