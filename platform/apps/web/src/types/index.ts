export type OnboardingStatus =
  | "wallet_pending"
  | "ens_pending"
  | "agent_pending"
  | "verification_pending"
  | "collector_pending"
  | "completed";

export interface AuthSession {
  address: string;
  chainId: number;
  userId: string;
}

export interface AgentMetadata {
  name: string;
  description: string;
  image?: string;
  external_url?: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export interface InsuredAgentData {
  id: string;
  agentId: number;
  name: string;
  description: string;
  ensName: string | null;
  metadataURI: string | null;
  verificationStatus: "pending" | "verified" | "failed";
  isActive: boolean;
  createdAt: string;
}
