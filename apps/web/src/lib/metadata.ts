import type { AgentMetadata } from "@/types";

export function buildAgentMetadata(
  name: string,
  description: string,
  ensName: string,
  agentId: number,
  verificationStatus: string
): AgentMetadata {
  return {
    name,
    description,
    external_url: `https://agentcover.xyz/agents/${agentId}`,
    attributes: [
      { trait_type: "ENS Name", value: ensName },
      { trait_type: "Agent ID", value: agentId },
      { trait_type: "Verification Status", value: verificationStatus },
      { trait_type: "Platform", value: "AgentCover" },
    ],
  };
}
