"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConnectWallet } from "@/components/connect-wallet";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const { session } = useAuth();

  return (
    <main className="min-h-screen bg-[#050505] font-mono">


      <section className="max-w-[1140px] mx-auto px-5 pt-28 pb-20">
        {/* Hero — 2 col grid */}
        <div className="grid md:grid-cols-2 gap-[60px] items-center mb-14">
          {/* Left — Copy */}
          <div>
            <div className="text-[14px] text-[#b5f542] tracking-[2px] uppercase font-semibold mb-4">
              Agent Insurance Protocol
            </div>
            <h1 className="text-[44px] font-bold leading-[1.08] text-white font-heading mb-5">
              Your agent runs on Base.<br />
              Its identity lives on ENS.<br />
              <span className="text-[#b5f542]">We cover the gap.</span>
            </h1>
            <p className="text-[14px] text-[#d4d4d8] leading-[1.8] mb-7">
              Register on{" "}
              <code className="text-[#b5f542] bg-[rgba(181,245,66,0.08)] px-1.5 py-0.5 rounded text-[14px]">
                AgentRegistry
              </code>{" "}
              (Base Sepolia 84532), claim a{" "}
              <code className="text-[#b5f542] bg-[rgba(181,245,66,0.08)] px-1.5 py-0.5 rounded text-[14px]">
                *.agentcover.eth
              </code>{" "}
              ENS subname, verify via{" "}
              <code className="text-[#b5f542] bg-[rgba(181,245,66,0.08)] px-1.5 py-0.5 rounded text-[14px]">
                ENSIP-25
              </code>{" "}
              text records. Coverage activates on-chain.
            </p>
            <div className="flex gap-2.5">
              <Link href="/onboarding">
                <button className="px-[22px] py-[11px] text-[14px] font-semibold rounded border border-[#b5f542] text-black bg-[#b5f542] hover:bg-[#c8fc5a] transition-all cursor-pointer font-mono">
                  Connect Wallet
                </button>
              </Link>
              <Link href="/dashboard">
                <button className="px-[22px] py-[11px] text-[14px] font-semibold rounded border border-[#b5f542] text-[#b5f542] bg-transparent hover:bg-[rgba(181,245,66,0.06)] transition-all cursor-pointer font-mono">
                  View Contracts
                </button>
              </Link>
            </div>
          </div>

          {/* Right — Cross-chain architecture diagram */}
          <div className="border border-[#1a1a1a] rounded-lg bg-[#0a0a0a] p-7 relative">
            <div className="text-[14px] text-[#d4d4d8] tracking-[2px] uppercase mb-5">
              Cross-Chain Architecture
            </div>

            {/* Chain row */}
            <div className="flex gap-3 mb-3">
              <div className="flex-1 p-4 rounded-md border border-[#1a1a1a] bg-[#0d0d0d]">
                <div className="text-[14px] text-[#d4d4d8] tracking-[1px] uppercase mb-2 flex items-center gap-1.5">
                  <span className="w-[5px] h-[5px] rounded-full bg-[#3b82f6]" />
                  Base Sepolia · 84532
                </div>
                <div className="text-[14px] text-[#e4e4e7] font-semibold">AgentRegistry</div>
                <div className="text-[14px] text-[#d4d4d8] font-mono break-all mt-1.5">0x7f3a...8b2c</div>
                <div className="text-[14px] text-[#d4d4d8] mt-1">registerAgent() · setMetadataURI()</div>
              </div>
              <div className="flex-1 p-4 rounded-md border border-[#1a1a1a] bg-[#0d0d0d]">
                <div className="text-[14px] text-[#d4d4d8] tracking-[1px] uppercase mb-2 flex items-center gap-1.5">
                  <span className="w-[5px] h-[5px] rounded-full bg-[#b5f542]" />
                  Eth Sepolia · 11155111
                </div>
                <div className="text-[14px] text-[#e4e4e7] font-semibold">ENS + Resolver</div>
                <div className="text-[14px] text-[#d4d4d8] font-mono break-all mt-1.5">*.agentcover.eth</div>
                <div className="text-[14px] text-[#d4d4d8] mt-1">setText() · ENSIP-25 records</div>
              </div>
            </div>

            {/* Bridge */}
            <div className="text-center py-2 text-[14px] text-[#b5f542] tracking-[1px] border-l border-r border-dashed border-[#1a1a1a] mx-10">
              ENSIP-25 ↔ ERC-7930
            </div>

            {/* Record box */}
            <div className="mt-3 p-3 rounded bg-[#0a0a0a] border border-[#1a1a1a]">
              <div className="text-[14px] text-[#d4d4d8] mb-1 uppercase tracking-[1px]">ENSIP-25 Text Record Key</div>
              <div className="text-[14px] text-[#b5f542] break-all font-mono">
                agent-registration[0x00010000030149...][3]
              </div>
            </div>
          </div>
        </div>

        {/* Onboarding pipeline — staircase */}
        <div className="flex gap-2 mb-14 items-start">
          {[
            { num: "01", title: "Connect", desc: "SIWE auth via injected or Coinbase Wallet", chain: "any chain" },
            { num: "02", title: "Claim ENS", desc: "Register {label}.agentcover.eth subname", chain: "eth sepolia" },
            { num: "03", title: "Register Agent", desc: "On-chain tx to AgentRegistry contract", chain: "base sepolia · 84532" },
            { num: "04", title: "ENSIP-25 Verify", desc: "Set ERC-7930 text record on ENS resolver", chain: "eth sepolia · 11155111" },
            { num: "05", title: "CLI Token", desc: "Generate bearer token for agentcover-cli", chain: "off-chain" },
          ].map((step, i, arr) => (
            <div key={step.num} className="flex-1 flex items-start" style={{ marginTop: `${i === 4 ? i * 56 + 30 : i * 56}px` }}>
              <div
                className="flex-1 py-5 px-4 rounded-md bg-[#0a0a0a] border border-[#1a1a1a] transition-all hover:border-[#b5f542] hover:bg-[rgba(181,245,66,0.02)]"
              >
                <div className="text-[14px] mb-2 text-[#d4d4d8]">{step.num}</div>
                <div className="text-[14px] text-[#b5f542] font-semibold mb-1">{step.title}</div>
                <div className="text-[14px] text-[#d4d4d8] leading-[1.5]">{step.desc}</div>
                <span className="inline-block mt-2 text-[14px] text-[#d4d4d8] bg-[rgba(255,255,255,0.03)] px-2 py-0.5 rounded">
                  {step.chain}
                </span>
              </div>
              {i < arr.length - 1 && (
                <div className="flex items-center self-center -mr-2 z-10">
                  <div className="w-3 h-px bg-[#b5f542]/40" />
                  <svg width="10" height="18" viewBox="0 0 10 18" fill="none" className="-ml-px">
                    <path d="M1 1L8 9L1 17" stroke="#b5f542" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Agents grid + CLI */}
        <div className="grid grid-cols-2 gap-4">
          {/* Agent card 1 */}
          <div className="p-5 border border-[#1a1a1a] rounded-md bg-[#0a0a0a] hover:border-[#2a2a2a] transition-all">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="text-[14px] text-[#e4e4e7] font-semibold">trading-bot-v2</div>
                <div className="text-[14px] text-[#b5f542] mt-0.5">trader.agentcover.eth</div>
              </div>
              <div className="text-[14px] py-0.5 px-2 rounded font-semibold tracking-[1px] uppercase text-[#b5f542] bg-[rgba(181,245,66,0.08)] border border-[rgba(181,245,66,0.15)]">
                Verified
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-[14px] text-[#d4d4d8] uppercase tracking-[1px]">Agent ID</div>
                <div className="text-[14px] text-[#d4d4d8] mt-0.5">#3</div>
              </div>
              <div>
                <div className="text-[14px] text-[#d4d4d8] uppercase tracking-[1px]">Registry</div>
                <div className="text-[14px] text-[#d4d4d8] mt-0.5">Base Sepolia</div>
              </div>
              <div>
                <div className="text-[14px] text-[#d4d4d8] uppercase tracking-[1px]">Coverage</div>
                <div className="text-[14px] text-[#d4d4d8] mt-0.5">$50,000 USDC</div>
              </div>
              <div>
                <div className="text-[14px] text-[#d4d4d8] uppercase tracking-[1px]">Premium</div>
                <div className="text-[14px] text-[#d4d4d8] mt-0.5">12.4 USDC/mo</div>
              </div>
            </div>
          </div>

          {/* Agent card 2 */}
          <div className="p-5 border border-[#1a1a1a] rounded-md bg-[#0a0a0a] hover:border-[#2a2a2a] transition-all">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="text-[14px] text-[#e4e4e7] font-semibold">sentinel-monitor</div>
                <div className="text-[14px] text-[#b5f542] mt-0.5">sentinel.agentcover.eth</div>
              </div>
              <div className="text-[14px] py-0.5 px-2 rounded font-semibold tracking-[1px] uppercase text-[#f59e0b] bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.15)]">
                Pending
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-[14px] text-[#d4d4d8] uppercase tracking-[1px]">Agent ID</div>
                <div className="text-[14px] text-[#d4d4d8] mt-0.5">#7</div>
              </div>
              <div>
                <div className="text-[14px] text-[#d4d4d8] uppercase tracking-[1px]">Registry</div>
                <div className="text-[14px] text-[#d4d4d8] mt-0.5">Base Sepolia</div>
              </div>
              <div>
                <div className="text-[14px] text-[#d4d4d8] uppercase tracking-[1px]">Coverage</div>
                <div className="text-[14px] text-[#d4d4d8] mt-0.5">—</div>
              </div>
              <div>
                <div className="text-[14px] text-[#d4d4d8] uppercase tracking-[1px]">Premium</div>
                <div className="text-[14px] text-[#d4d4d8] mt-0.5">—</div>
              </div>
            </div>
          </div>

          {/* CLI box — spans 2 cols */}
          <div className="col-span-2 rounded-lg overflow-hidden border border-[#2a2a2a] shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
            {/* Terminal title bar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#1a1a1a] border-b border-[#2a2a2a]">
              <div className="flex items-center gap-2">
                <div className="flex gap-[7px]">
                  <span className="w-[11px] h-[11px] rounded-full bg-[#ff5f57]" />
                  <span className="w-[11px] h-[11px] rounded-full bg-[#febc2e]" />
                  <span className="w-[11px] h-[11px] rounded-full bg-[#28c840]" />
                </div>
              </div>
              <div className="text-[12px] text-[#666] font-mono">agentcover — zsh — 80×24</div>
              <button
                className="text-[12px] text-[#666] hover:text-[#b5f542] transition-colors font-mono cursor-pointer"
                onClick={() => {
                  const text = `npm i -g @agentcover/cli\nagentcover setup --token <YOUR_TOKEN>\nagentcover agents --list`;
                  navigator.clipboard.writeText(text);
                }}
              >
                copy
              </button>
            </div>
            {/* Terminal body */}
            <div className="bg-[#0c0c0c] px-5 py-4 font-mono text-[13px] leading-[1.9] overflow-x-auto">
              <div>
                <span className="text-[#b5f542]">~</span>{" "}
                <span className="text-[#666]">❯</span>{" "}
                <span className="text-[#e4e4e7]">npm i -g</span>{" "}
                <span className="text-[#7dd3fc]">@agentcover/cli</span>
              </div>
              <div className="text-[#555] pl-0">added 42 packages in 3.2s</div>
              <div className="mt-1">
                <span className="text-[#b5f542]">~</span>{" "}
                <span className="text-[#666]">❯</span>{" "}
                <span className="text-[#e4e4e7]">agentcover setup</span>{" "}
                <span className="text-[#b5f542]">--token</span>{" "}
                <span className="text-[#a78bfa]">eyJhbG...</span>
              </div>
              <div className="text-[#d4d4d8] pl-0">
                <span className="text-[#22c55e]">✔</span> Authenticated as{" "}
                <span className="text-[#7dd3fc]">0x7f3a...8b2c</span>
              </div>
              <div className="text-[#d4d4d8] pl-0">
                <span className="text-[#22c55e]">✔</span> Config written to{" "}
                <span className="text-[#a78bfa]">~/.agentcover/config.json</span>
              </div>
              <div className="mt-1">
                <span className="text-[#b5f542]">~</span>{" "}
                <span className="text-[#666]">❯</span>{" "}
                <span className="text-[#e4e4e7]">agentcover agents</span>{" "}
                <span className="text-[#b5f542]">--list</span>
              </div>
              <div className="text-[#555] pl-0">
                <span className="text-[#666]">ID</span>{"    "}
                <span className="text-[#666]">NAME</span>{"               "}
                <span className="text-[#666]">ENS</span>{"                      "}
                <span className="text-[#666]">STATUS</span>
              </div>
              <div className="text-[#d4d4d8] pl-0">
                <span className="text-[#e4e4e7]">#3</span>{"    "}
                trading-bot-v2{"    "}
                <span className="text-[#7dd3fc]">trader.agentcover.eth</span>{"      "}
                <span className="text-[#22c55e]">verified</span>
              </div>
              <div className="text-[#d4d4d8] pl-0">
                <span className="text-[#e4e4e7]">#7</span>{"    "}
                sentinel-monitor{"  "}
                <span className="text-[#7dd3fc]">sentinel.agentcover.eth</span>{"    "}
                <span className="text-[#f59e0b]">pending</span>
              </div>
              <div className="mt-1">
                <span className="text-[#b5f542]">~</span>{" "}
                <span className="text-[#666]">❯</span>{" "}
                <span className="w-[7px] h-[15px] bg-[#b5f542] inline-block animate-pulse ml-0.5" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
