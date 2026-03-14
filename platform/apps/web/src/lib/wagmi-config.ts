"use client";

import { http, createConfig } from "wagmi";
import { baseSepolia, sepolia } from "wagmi/chains";
import { injected, coinbaseWallet } from "wagmi/connectors";

export const config = createConfig({
  chains: [baseSepolia, sepolia],
  connectors: [
    injected(),
    coinbaseWallet({ appName: "AgentCover" }),
  ],
  transports: {
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || "https://sepolia.base.org"),
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC || "https://rpc.sepolia.org"),
  },
  ssr: true,
});
