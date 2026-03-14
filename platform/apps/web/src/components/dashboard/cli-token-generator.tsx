"use client";

import { useState } from "react";

export function CliTokenGenerator() {
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/cli/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "dashboard" }),
      });
      const data = await res.json();
      if (res.ok) setToken(data.token);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const copyToken = async () => {
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-[#1a1a1a] rounded-md bg-[#0a0a0a] p-5">
      <div className="flex justify-between items-center mb-3">
        <div className="text-[14px] text-[#e4e4e7] font-semibold">CLI Token</div>
        {token && (
          <div
            className="text-[14px] text-[#b5f542] cursor-pointer hover:underline"
            onClick={copyToken}
          >
            {copied ? "copied!" : "copy"}
          </div>
        )}
      </div>

      {token ? (
        <div className="space-y-3">
          {/* Terminal block */}
          <div className="space-y-0 text-[14px] leading-[2] font-mono">
            <div className="text-[#d4d4d8]">
              <span className="text-[#d4d4d8]">$</span>{" "}
              <span className="text-[#e4e4e7]">agentcover setup</span>{" "}
              <span className="text-[#b5f542]">--token</span>{" "}
              <span className="text-[#e4e4e7]">{token.slice(0, 12)}...</span>
            </div>
            <div className="text-[#d4d4d8]">
              <span className="text-[#22c55e]">✓</span>{" "}
              <span className="text-[#d4d4d8]">Token configured</span>
            </div>
          </div>

          <p className="text-[14px] text-[#ef4444]">
            Shown only once. Store it securely.
          </p>
        </div>
      ) : (
        <button
          onClick={generate}
          disabled={isLoading}
          className="w-full px-[22px] py-[11px] text-[14px] font-semibold rounded border border-[#b5f542] text-black bg-[#b5f542] hover:bg-[#c8fc5a] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer font-mono"
        >
          {isLoading ? "Generating..." : "Generate CLI Token"}
        </button>
      )}
    </div>
  );
}
