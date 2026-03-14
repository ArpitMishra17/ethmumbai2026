"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useSwitchChain, useWaitForTransactionReceipt } from "wagmi";
import { namehash } from "viem";
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
    <div className="border border-[#1a1a1a] rounded-md bg-[#0a0a0a] p-6 space-y-5">
      <div>
        <h3 className="text-[18px] font-semibold text-white font-heading mb-1">
          ENSIP-25 Verify
        </h3>
        <p className="text-[14px] text-[#d4d4d8]">
          Set ERC-7930 text record on ENS resolver at{" "}
          <span className="text-[#b5f542]">Eth Sepolia · 11155111</span>
        </p>
      </div>

      {/* Record preview — matching c1-record-box */}
      <div className="rounded border border-[#1a1a1a] bg-[#0d0d0d] p-4 space-y-3">
        <div>
          <div className="text-[14px] text-[#d4d4d8] uppercase tracking-[1px] mb-1">
            Text Record Key
          </div>
          <div className="text-[14px] text-[#b5f542] break-all font-mono bg-[#0a0a0a] border border-[#1a1a1a] p-3 rounded">
            {recordKey}
          </div>
        </div>
        <div>
          <div className="text-[14px] text-[#d4d4d8] uppercase tracking-[1px] mb-1">
            Value
          </div>
          <div className="text-[14px] text-[#b5f542] font-mono bg-[#0a0a0a] border border-[#1a1a1a] p-3 rounded">
            1
          </div>
        </div>
      </div>

      {step === "set-record" && (
        <button
          onClick={handleSetTextRecord}
          disabled={isLoading}
          className="w-full px-[22px] py-[11px] text-[14px] font-semibold rounded border border-[#b5f542] text-black bg-[#b5f542] hover:bg-[#c8fc5a] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer font-mono"
        >
          {isLoading ? "Setting text record..." : "Set Text Record on Eth Sepolia"}
        </button>
      )}

      {step === "verify" && (
        <button
          onClick={handleVerify}
          disabled={isLoading || (!receipt && !!txHash)}
          className="w-full px-[22px] py-[11px] text-[14px] font-semibold rounded border border-[#b5f542] text-black bg-[#b5f542] hover:bg-[#c8fc5a] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer font-mono"
        >
          {isLoading
            ? "Verifying..."
            : !receipt && txHash
              ? "Waiting for confirmation..."
              : "Verify Now"}
        </button>
      )}

      {error && <p className="text-[14px] text-[#ef4444]">{error}</p>}

      {chainId !== ETH_SEPOLIA_CHAIN_ID && step === "set-record" && (
        <p className="text-[14px] text-[#d4d4d8]">
          You will be prompted to switch to Ethereum Sepolia
        </p>
      )}
    </div>
  );
}
