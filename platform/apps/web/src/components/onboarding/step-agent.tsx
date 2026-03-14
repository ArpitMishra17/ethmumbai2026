"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount, useSwitchChain, useWaitForTransactionReceipt } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
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

  // Auto-proceed when registration receipt arrives
  useEffect(() => {
    if (receipt && status === "confirming") {
      handleReceiptReady();
    }
  }, [receipt, status]);

  // Auto-proceed when metadata receipt arrives
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

      // Set metadata URI on-chain
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

      // Persist to backend only after both txs confirmed
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
    <Card>
      <CardHeader>
        <CardTitle>Register Your Agent</CardTitle>
        <CardDescription>
          Register your AI agent on-chain (Base Sepolia) linked to {ensName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Agent Name</label>
          <Input
            placeholder="My AI Agent"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Description</label>
          <Input
            placeholder="A helpful assistant agent"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button
          onClick={handleRegister}
          disabled={!name || status !== "idle"}
          className="w-full"
        >
          {buttonText[status]}
        </Button>

        {chainId !== BASE_SEPOLIA_CHAIN_ID && status === "idle" && (
          <p className="text-xs text-muted-foreground">
            You will be prompted to switch to Base Sepolia
          </p>
        )}
      </CardContent>
    </Card>
  );
}
