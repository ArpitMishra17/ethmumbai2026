import { AGENT_REGISTRY_ADDRESS } from "./constants";

export const agentRegistryAbi = [
  {
    type: "function",
    name: "registerAgent",
    inputs: [
      { name: "name", type: "string" },
      { name: "ensName", type: "string" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setMetadataURI",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "uri", type: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "deactivateAgent",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getAgent",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "owner", type: "address" },
          { name: "name", type: "string" },
          { name: "ensName", type: "string" },
          { name: "metadataURI", type: "string" },
          { name: "isActive", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getOwnerAgentIds",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "nextAgentId",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "AgentRegistered",
    inputs: [
      { name: "agentId", type: "uint256", indexed: true },
      { name: "owner", type: "address", indexed: true },
      { name: "name", type: "string", indexed: false },
      { name: "ensName", type: "string", indexed: false },
    ],
  },
  {
    type: "event",
    name: "MetadataURISet",
    inputs: [
      { name: "agentId", type: "uint256", indexed: true },
      { name: "metadataURI", type: "string", indexed: false },
    ],
  },
  {
    type: "event",
    name: "AgentDeactivated",
    inputs: [{ name: "agentId", type: "uint256", indexed: true }],
  },
] as const;

export const agentRegistryConfig = {
  address: AGENT_REGISTRY_ADDRESS,
  abi: agentRegistryAbi,
} as const;
