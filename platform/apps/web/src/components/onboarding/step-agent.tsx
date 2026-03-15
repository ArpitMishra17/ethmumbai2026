"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount, useSwitchChain, useWaitForTransactionReceipt } from "wagmi";
import { useAgentRegistry } from "@/hooks/use-agent-registry";
import { BASE_SEPOLIA_CHAIN_ID } from "@/lib/constants";

interface StepAgentProps {
  ensName: string;
  onComplete: (agentDbId: string, agentId: number) => void;
}

export function StepAgent({ ensName, onComplete }: StepAgentProps) {
  const { chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { registerAgent, setMetadataURI, parseAgentRegisteredEvent } = useAgentRegistry();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "confirming" | "setting_metadata" | "confirming_metadata" | "completing" | "done">("idle");
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [metadataTxHash, setMetadataTxHash] = useState<`0x${string}` | undefined>();
  const [error, setError] = useState("");
  const agentIdRef = useRef<bigint | null>(null);

  const { data: receipt } = useWaitForTransactionReceipt({ hash: txHash, confirmations: 2 });
  const { data: metadataReceipt } = useWaitForTransactionReceipt({ hash: metadataTxHash });

  useEffect(() => {
    if (receipt && status === "confirming") {
      handleReceiptReady();
    }
  }, [receipt, status]);

  useEffect(() => {
    if (metadataReceipt && status === "confirming_metadata") {
      handleMetadataConfirmed();
    }
  }, [metadataReceipt, status]);

  const handleRegister = async () => {
    if (!name) return;
    setStatus("sending");
    setError("");

    try {
      if (chainId !== BASE_SEPOLIA_CHAIN_ID) {
        switchChain({ chainId: BASE_SEPOLIA_CHAIN_ID });
        await new Promise((r) => setTimeout(r, 1000));
      }

      const hash = await registerAgent(name, ensName);
      setTxHash(hash);
      setStatus("confirming");
    } catch (err: any) {
      setError(err.message || "Failed to register agent");
      setStatus("idle");
    }
  };

  const handleReceiptReady = async () => {
    if (!receipt) return;

    if (receipt.status !== "success") {
      setError("Agent registration transaction failed on-chain");
      setStatus("idle");
      return;
    }

    setStatus("setting_metadata");
    setError("");

    try {
      const agentId = parseAgentRegisteredEvent(receipt.logs);
      if (!agentId) {
        setError("Could not find AgentRegistered event");
        setStatus("idle");
        return;
      }

      agentIdRef.current = agentId;
      const agentIdNum = Number(agentId);
      const metadataUri = `${window.location.origin}/api/agents/${agentIdNum}/metadata`;

      // Wait a few seconds to let RPC nodes perfectly sync the state of the first transaction.
      // Otherwise `setMetadataURI` reverts with 'Not agent owner' because the node thinks the agent doesn't exist yet.
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const metaHash = await setMetadataURI(agentId, metadataUri);
      setMetadataTxHash(metaHash);
      setStatus("confirming_metadata");
    } catch (err: any) {
      setError(err.message || "Failed to set metadata URI. You can retry.");
      setStatus("idle");
    }
  };

  const handleMetadataConfirmed = async () => {
    if (!metadataReceipt || !receipt || !agentIdRef.current) return;

    if (metadataReceipt.status !== "success") {
      setError("Metadata transaction failed on-chain. You can retry.");
      setStatus("idle");
      return;
    }

    setStatus("completing");
    setError("");

    try {
      const agentIdNum = Number(agentIdRef.current);
      const metadataUri = `${window.location.origin}/api/agents/${agentIdNum}/metadata`;

      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: agentIdNum,
          name,
          description,
          ensName,
          txHash: receipt.transactionHash,
          metadataURI: metadataUri,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus("done");
        onComplete(data.agent.id, agentIdNum);
      } else {
        setError(data.error || "Failed to save agent");
        setStatus("idle");
      }
    } catch (err: any) {
      setError(err.message || "Failed to complete agent registration");
      setStatus("idle");
    }
  };

  const buttonText = {
    idle: "Register Agent on Base Sepolia",
    sending: "Confirm in wallet...",
    confirming: "Waiting for confirmation...",
    setting_metadata: "Setting metadata (confirm in wallet)...",
    confirming_metadata: "Waiting for metadata confirmation...",
    completing: "Completing registration...",
    done: "Done!",
  };

  return (
    <div className="border border-[#1a1a1a] rounded-md bg-[#0a0a0a] p-6 space-y-5">
      <div>
        <h3 className="text-[18px] font-semibold text-white font-heading mb-1">
          Register Your Agent
        </h3>
        <p className="text-[14px] text-[#d4d4d8]">
          On-chain tx to AgentRegistry contract on{" "}
          <span className="text-[#b5f542]">Base Sepolia · 84532</span>{" "}
          linked to {ensName}
        </p>
      </div>

      <div>
        <div className="text-[14px] text-[#d4d4d8] uppercase tracking-[1px] mb-2">Agent Name</div>
        <input
          placeholder="My AI Agent"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full h-10 rounded border border-[#1a1a1a] bg-[#0d0d0d] px-4 text-[14px] text-[#e4e4e7] font-mono placeholder:text-[#d4d4d8] focus:outline-none focus:ring-1 focus:ring-[#b5f542] focus:border-[rgba(181,245,66,0.15)] transition-colors"
        />
      </div>
      <div>
        <div className="text-[14px] text-[#d4d4d8] uppercase tracking-[1px] mb-2">Description</div>
        <input
          placeholder="A helpful assistant agent"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full h-10 rounded border border-[#1a1a1a] bg-[#0d0d0d] px-4 text-[14px] text-[#e4e4e7] font-mono placeholder:text-[#d4d4d8] focus:outline-none focus:ring-1 focus:ring-[#b5f542] focus:border-[rgba(181,245,66,0.15)] transition-colors"
        />
      </div>

      {error && <p className="text-[14px] text-[#ef4444]">{error}</p>}

      <button
        onClick={handleRegister}
        disabled={!name || status !== "idle"}
        className="w-full px-[22px] py-[11px] text-[14px] font-semibold rounded border border-[#b5f542] text-black bg-[#b5f542] hover:bg-[#c8fc5a] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer font-mono"
      >
        {buttonText[status]}
      </button>

      {chainId !== BASE_SEPOLIA_CHAIN_ID && status === "idle" && (
        <p className="text-[14px] text-[#d4d4d8]">
          You will be prompted to switch to Base Sepolia
        </p>
      )}
    </div>
  );
}
