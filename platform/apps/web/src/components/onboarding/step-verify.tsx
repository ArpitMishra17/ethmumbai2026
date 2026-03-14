"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useSwitchChain, useWaitForTransactionReceipt } from "wagmi";
import { namehash } from "viem";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { computeEnsip25RecordKey } from "@/lib/ensip25";
import { publicResolverAbi } from "@/lib/ens";
import { AGENT_REGISTRY_ADDRESS, ENS_PUBLIC_RESOLVER_ADDRESS, ETH_SEPOLIA_CHAIN_ID } from "@/lib/constants";

interface StepVerifyProps {
  ensName: string;
  agentId: number;
  agentDbId: string;
  onComplete: () => void;
}

export function StepVerify({ ensName, agentId, agentDbId, onComplete }: StepVerifyProps) {
  const { chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const [step, setStep] = useState<"set-record" | "verify">("set-record");
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { data: receipt } = useWaitForTransactionReceipt({ hash: txHash });

  const recordKey = computeEnsip25RecordKey(AGENT_REGISTRY_ADDRESS, agentId);
  const node = namehash(ensName);

  const handleSetTextRecord = async () => {
    setIsLoading(true);
    setError("");

    try {
      if (chainId !== ETH_SEPOLIA_CHAIN_ID) {
        switchChain({ chainId: ETH_SEPOLIA_CHAIN_ID });
        await new Promise((r) => setTimeout(r, 1000));
      }

      const hash = await writeContractAsync({
        address: ENS_PUBLIC_RESOLVER_ADDRESS,
        abi: publicResolverAbi,
        functionName: "setText",
        args: [node, recordKey, "1"],
        gas: BigInt(200_000),
      });

      setTxHash(hash);
      setStep("verify");
    } catch (err: any) {
      setError(err.message || "Failed to set text record");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentDbId }),
      });

      const data = await res.json();
      if (data.verified) {
        onComplete();
      } else {
        setError(data.reason || "Verification failed");
      }
    } catch {
      setError("Verification request failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verify Agent (ENSIP-25)</CardTitle>
        <CardDescription>
          Set a text record on your ENS name to prove ownership
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md bg-muted p-3 space-y-2">
          <p className="text-sm font-medium">Text Record Key:</p>
          <code className="text-xs break-all block bg-background p-2 rounded">
            {recordKey}
          </code>
          <p className="text-sm font-medium">Value:</p>
          <code className="text-xs block bg-background p-2 rounded">1</code>
        </div>

        {step === "set-record" && (
          <Button
            onClick={handleSetTextRecord}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Setting text record..." : "Set Text Record on Eth Sepolia"}
          </Button>
        )}

        {step === "verify" && (
          <Button
            onClick={handleVerify}
            disabled={isLoading || (!receipt && !!txHash)}
            className="w-full"
          >
            {isLoading
              ? "Verifying..."
              : !receipt && txHash
                ? "Waiting for confirmation..."
                : "Verify Now"}
          </Button>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        {chainId !== ETH_SEPOLIA_CHAIN_ID && step === "set-record" && (
          <p className="text-xs text-muted-foreground">
            You will be prompted to switch to Ethereum Sepolia
          </p>
        )}
      </CardContent>
    </Card>
  );
}
