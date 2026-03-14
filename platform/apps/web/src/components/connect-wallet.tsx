"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useAuth } from "@/hooks/use-auth";

export function ConnectWallet() {
  const { session, isConnected, signIn, signOut, isLoading } = useAuth();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { address } = useAccount();

  if (session) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-[14px] text-[#b5f542] font-mono">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
        <button
          onClick={() => { signOut(); disconnect(); }}
          className="px-4 py-1.5 text-[14px] font-semibold rounded text-[#b5f542] bg-transparent border border-transparent hover:bg-[rgba(181,245,66,0.06)] transition-all cursor-pointer font-mono"
        >
          Sign Out
        </button>
      </div>
    );
  }

  if (isConnected && !session) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-[14px] text-[#d4d4d8] font-mono">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
        <button
          onClick={signIn}
          disabled={isLoading}
          className="px-[22px] py-[11px] text-[14px] font-semibold rounded border border-[#b5f542] text-black bg-[#b5f542] hover:bg-[#c8fc5a] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer font-mono"
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {connectors.map((connector) => (
        <button
          key={connector.uid}
          onClick={() => connect({ connector })}
          className="px-[22px] py-[11px] text-[14px] font-semibold rounded border border-[#b5f542] text-[#b5f542] bg-transparent hover:bg-[rgba(181,245,66,0.06)] transition-all cursor-pointer font-mono"
        >
          {connector.name}
        </button>
      ))}
    </div>
  );
}
