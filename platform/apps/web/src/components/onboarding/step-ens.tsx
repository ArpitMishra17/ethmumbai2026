"use client";

import { useState } from "react";
import { ENS_PARENT_NAME } from "@/lib/constants";

interface StepEnsProps {
  onComplete: (ensName: string) => void;
}

export function StepEns({ onComplete }: StepEnsProps) {
  const [label, setLabel] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState("");

  const checkAvailability = async () => {
    if (!label) return;
    setIsChecking(true);
    setError("");
    try {
      const res = await fetch(`/api/ens/check?label=${label}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        setAvailable(null);
      } else {
        setAvailable(data.available);
        if (!data.available) setError("Name already taken");
      }
    } catch {
      setError("Failed to check availability");
    } finally {
      setIsChecking(false);
    }
  };

  const registerName = async () => {
    setIsRegistering(true);
    setError("");
    try {
      const res = await fetch("/api/ens/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
      } else {
        onComplete(data.ensName);
      }
    } catch {
      setError("Failed to register name");
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="border border-[#1a1a1a] rounded-md bg-[#0a0a0a] p-6 space-y-5">
      <div>
        <h3 className="text-[18px] font-semibold text-white font-heading mb-1">
          Choose Your ENS Name
        </h3>
        <p className="text-[14px] text-[#d4d4d8]">
          Register a subname under{" "}
          <span className="text-[#b5f542]">{ENS_PARENT_NAME}</span>{" "}
          on Eth Sepolia
        </p>
      </div>

      <div className="flex gap-2 items-center">
        <input
          placeholder="myagent"
          value={label}
          onChange={(e) => {
            setLabel(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
            setAvailable(null);
            setError("");
          }}
          className="flex-1 h-10 rounded border border-[#1a1a1a] bg-[#0d0d0d] px-4 text-[14px] text-[#e4e4e7] font-mono placeholder:text-[#d4d4d8] focus:outline-none focus:ring-1 focus:ring-[#b5f542] focus:border-[rgba(181,245,66,0.15)] transition-colors"
        />
        <span className="text-[14px] text-[#d4d4d8] whitespace-nowrap font-mono">
          .{ENS_PARENT_NAME}
        </span>
        <button
          onClick={checkAvailability}
          disabled={!label || isChecking}
          className="px-4 py-2 text-[14px] font-semibold rounded border border-[#b5f542] text-[#b5f542] bg-transparent hover:bg-[rgba(181,245,66,0.06)] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer font-mono"
        >
          {isChecking ? "..." : "Check"}
        </button>
      </div>

      {available === true && (
        <p className="text-[14px] text-[#b5f542] font-mono">
          {label}.{ENS_PARENT_NAME} is available
        </p>
      )}

      {error && <p className="text-[14px] text-[#ef4444]">{error}</p>}

      <button
        onClick={registerName}
        disabled={!available || isRegistering}
        className="w-full px-[22px] py-[11px] text-[14px] font-semibold rounded border border-[#b5f542] text-black bg-[#b5f542] hover:bg-[#c8fc5a] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer font-mono"
      >
        {isRegistering ? "Registering..." : `Register ${label}.${ENS_PARENT_NAME}`}
      </button>
    </div>
  );
}
