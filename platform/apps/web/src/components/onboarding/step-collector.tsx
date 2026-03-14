"use client";

import { useState } from "react";

interface StepCollectorProps {
  onComplete: () => void;
}

export function StepCollector({ onComplete }: StepCollectorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  const generateToken = async () => {
    setIsGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/cli/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "onboarding" }),
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
      } else {
        setError(data.error || "Failed to generate token");
      }
    } catch {
      setError("Failed to generate token");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleComplete = async () => {
    try {
      await fetch("/api/onboarding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      onComplete();
    } catch {
      setError("Failed to complete onboarding");
    }
  };

  return (
    <div className="border border-[#1a1a1a] rounded-md bg-[#0a0a0a] p-6 space-y-5">
      <div>
        <h3 className="text-[18px] font-semibold text-white font-heading mb-1">
          CLI Token
        </h3>
        <p className="text-[14px] text-[#d4d4d8]">
          Generate bearer token for <span className="text-[#b5f542]">agentcover-cli</span>
        </p>
      </div>

      {!token ? (
        <button
          onClick={generateToken}
          disabled={isGenerating}
          className="w-full px-[22px] py-[11px] text-[14px] font-semibold rounded border border-[#b5f542] text-black bg-[#b5f542] hover:bg-[#c8fc5a] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer font-mono"
        >
          {isGenerating ? "Generating..." : "Generate CLI Token"}
        </button>
      ) : (
        <div className="space-y-3">
          {/* Terminal block — matching c1-cli-box */}
          <div className="border border-[#1a1a1a] rounded bg-[#0d0d0d] p-4 space-y-0 text-[14px] leading-[2] font-mono">
            <div className="text-[#d4d4d8]">
              <span className="text-[#d4d4d8]">$</span>{" "}
              <span className="text-[#e4e4e7]">agentcover setup</span>{" "}
              <span className="text-[#b5f542]">--token</span>{" "}
              <span className="text-[#e4e4e7]">{token.slice(0, 20)}...</span>
            </div>
            <div className="text-[#d4d4d8]">
              <span className="text-[#22c55e]">✓</span>{" "}
              <span className="text-[#d4d4d8]">Authenticated successfully</span>
            </div>
          </div>

          <p className="text-[14px] text-[#ef4444]">
            Token shown only once. Store it securely.
          </p>
        </div>
      )}

      {error && <p className="text-[14px] text-[#ef4444]">{error}</p>}

      <button
        onClick={handleComplete}
        className="w-full px-[22px] py-[11px] text-[14px] font-semibold rounded border border-[#b5f542] text-[#b5f542] bg-transparent hover:bg-[rgba(181,245,66,0.06)] transition-all cursor-pointer font-mono"
      >
        {token ? "Complete Setup" : "Skip for Now"}
      </button>
    </div>
  );
}
