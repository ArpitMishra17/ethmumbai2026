"use client";

import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { decodeEventLog } from "viem";
import { agentRegistryConfig, agentRegistryAbi } from "@/lib/contracts";
import { AGENT_REGISTRY_ADDRESS } from "@/lib/constants";
import { useState, useCallback } from "react";

export function useAgentRegistry() {
  const { writeContractAsync } = useWriteContract();
  const [pendingTxHash, setPendingTxHash] = useState<`0x${string}` | undefined>();

  const { data: receipt } = useWaitForTransactionReceipt({
    hash: pendingTxHash,
  });

  const registerAgent = useCallback(
    async (name: string, ensName: string) => {
      const hash = await writeContractAsync({
        ...agentRegistryConfig,
        functionName: "registerAgent",
        args: [name, ensName],
      });
      setPendingTxHash(hash);
      return hash;
    },
    [writeContractAsync]
  );

  const setMetadataURI = useCallback(
    async (agentId: bigint, uri: string) => {
      const hash = await writeContractAsync({
        ...agentRegistryConfig,
        functionName: "setMetadataURI",
        args: [agentId, uri],
      });
      return hash;
    },
    [writeContractAsync]
  );

  const deactivateAgent = useCallback(
    async (agentId: bigint) => {
      const hash = await writeContractAsync({
        ...agentRegistryConfig,
        functionName: "deactivateAgent",
        args: [agentId],
      });
      return hash;
    },
    [writeContractAsync]
  );

  const parseAgentRegisteredEvent = useCallback((logs: any[]) => {
    for (const log of logs) {
      try {
        const decoded = decodeEventLog({
          abi: agentRegistryAbi,
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === "AgentRegistered") {
          return (decoded.args as any).agentId;
        }
      } catch {
        continue;
      }
    }
    return null;
  }, []);

  return {
    registerAgent,
    setMetadataURI,
    deactivateAgent,
    parseAgentRegisteredEvent,
    pendingTxHash,
    receipt,
  };
}

export function useAgentData(agentId: number | undefined) {
  return useReadContract({
    ...agentRegistryConfig,
    functionName: "getAgent",
    args: agentId !== undefined ? [BigInt(agentId)] : undefined,
    query: { enabled: agentId !== undefined },
  });
}
