'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { parseClaudeCodeLogText } from '@/lib/pipeline/parseClaudeCodeLog';
import { parseCodexLogText } from '@/lib/pipeline/parseCodexLog';
import { normalize } from '@/lib/pipeline/normalize';
import { sanitize } from '@/lib/pipeline/sanitize';
import { simplify } from '@/lib/pipeline/simplify';
import { addHash } from '@/lib/pipeline/addHash';
import { getOnChainSessionHash } from './actions';

export default function ClaimsPage() {
  const [fileText, setFileText] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [toolType, setToolType] = useState<'claude_code' | 'codex'>('claude_code');

  const [agentIdInput, setAgentIdInput] = useState('');
  const [agentEnsInput, setAgentEnsInput] = useState('');
  const [walletIdInput, setWalletIdInput] = useState('');
  const [userIdInput, setUserIdInput] = useState('');
  const [orgIdInput, setOrgIdInput] = useState('');

  const [status, setStatus] = useState<'idle' | 'processing' | 'verified' | 'tampered' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const [computedHash, setComputedHash] = useState('');
  const [onChainHash, setOnChainHash] = useState('');
  const [sessionIdStr, setSessionIdStr] = useState('');

  const handleVerify = async () => {
    if (!fileText || !fileName || !agentIdInput || !agentEnsInput || !walletIdInput || !userIdInput || !orgIdInput) {
      setErrorMsg('All fields are required to reconstruct the exact hash block.');
      setStatus('error');
      return;
    }

    setStatus('processing');
    setErrorMsg('');

    try {
      const parseOptions = {
        text: fileText,
        fileName: fileName,
        agentId: agentIdInput.trim(),
        agentEns: agentEnsInput.trim(),
        walletId: walletIdInput.trim(),
        userId: userIdInput.trim(),
        orgId: orgIdInput.trim(),
      };

      let normalizedSession;
      if (toolType === 'claude_code') {
        normalizedSession = await parseClaudeCodeLogText(parseOptions);
      } else {
        normalizedSession = await parseCodexLogText(parseOptions);
      }

      const sanitizedSession = sanitize(normalize(normalizedSession));
      const simplifiedSession = simplify(sanitizedSession);
      const hashedSession = await addHash(simplifiedSession);

      setComputedHash(hashedSession.contentHash);
      setSessionIdStr(hashedSession.sessionId);

      const actualOnChainHash = await getOnChainSessionHash(
        hashedSession.sessionId,
        agentEnsInput.trim(),
        walletIdInput.trim()
      );
      console.log(actualOnChainHash);
      if (!actualOnChainHash) {
        setOnChainHash("Not found on chain");
        setStatus('tampered');
      } else {
        setOnChainHash(actualOnChainHash);
        const normalizedLocalHash = hashedSession.contentHash.startsWith('0x')
          ? hashedSession.contentHash
          : `0x${hashedSession.contentHash}`;
        console.log(normalizedLocalHash);
        console.log(actualOnChainHash);

        if (normalizedLocalHash.toLowerCase() === actualOnChainHash.toLowerCase()) {
          setStatus('verified');
        } else {
          setStatus('tampered');
        }
      }
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.message || 'An error occurred during verification');
    }
  };

  const inputClass = "w-full h-10 rounded border border-[#1a1a1a] bg-[#0d0d0d] px-4 text-[14px] text-[#e4e4e7] font-mono placeholder:text-[#d4d4d8] focus:outline-none focus:ring-1 focus:ring-[#b5f542] focus:border-[rgba(181,245,66,0.15)] transition-colors";

  return (
    <main className="min-h-screen bg-[#050505] font-mono">
      {/* Nav */}
      <nav className="border-b border-[rgba(255,255,255,0.06)] bg-[#050505]/85 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1140px] mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="text-base font-bold text-white font-heading tracking-tight">
            AgentCover
          </Link>
          <Link href="/dashboard" className="text-[14px] text-[#d4d4d8] hover:text-white transition-colors">
            Dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-5 py-12">
        <div className="text-center mb-10">
          <div className="text-[14px] text-[#b5f542] tracking-[2px] uppercase font-semibold mb-3">
            Verification
          </div>
          <h1 className="text-[32px] font-bold text-white font-heading leading-[1.08]">
            Verify Claim Evidence
          </h1>
          <p className="text-[14px] text-[#d4d4d8] mt-2 max-w-md mx-auto leading-[1.8]">
            Upload a raw session log and verify its integrity against on-chain records
          </p>
        </div>

        <div className="border border-[#1a1a1a] rounded-md bg-[#0a0a0a] p-6 space-y-5">
          {/* Tool type */}
          <div>
            <div className="text-[14px] text-[#d4d4d8] uppercase tracking-[1px] mb-2">Tool Type</div>
            <select
              value={toolType}
              onChange={e => setToolType(e.target.value as any)}
              className={inputClass}
            >
              <option value="claude_code">Claude Code (*.jsonl)</option>
              <option value="codex">Codex (*.jsonl)</option>
            </select>
          </div>

          {/* File upload */}
          <div>
            <div className="text-[14px] text-[#d4d4d8] uppercase tracking-[1px] mb-2">Raw Log File</div>
            <input
              type="file"
              accept=".jsonl"
              onChange={async (e) => {
                const selectedFile = e.target.files?.[0];
                if (selectedFile) {
                  setFileName(selectedFile.name);
                  const text = await selectedFile.text();
                  setFileText(text);
                } else {
                  setFileName('');
                  setFileText(null);
                }
              }}
              className="w-full text-[14px] text-[#e4e4e7] font-mono file:mr-4 file:py-2 file:px-4 file:rounded file:border file:border-[rgba(181,245,66,0.15)] file:text-[14px] file:font-semibold file:bg-[rgba(181,245,66,0.04)] file:text-[#b5f542] hover:file:bg-[rgba(181,245,66,0.08)] file:cursor-pointer file:transition-colors"
            />
          </div>

          {/* Agent ID + ENS */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[14px] text-[#d4d4d8] uppercase tracking-[1px] mb-2">Agent ID</div>
              <input type="text" value={agentIdInput} onChange={e => setAgentIdInput(e.target.value)} placeholder="e.g. 2" className={inputClass} />
            </div>
            <div>
              <div className="text-[14px] text-[#d4d4d8] uppercase tracking-[1px] mb-2">Agent ENS</div>
              <input type="text" value={agentEnsInput} onChange={e => setAgentEnsInput(e.target.value)} placeholder="myagent.agentcover.eth" className={inputClass} />
            </div>
          </div>

          {/* Wallet / User / Org */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-[14px] text-[#d4d4d8] uppercase tracking-[1px] mb-2">Wallet Address</div>
              <input type="text" value={walletIdInput} onChange={e => setWalletIdInput(e.target.value)} placeholder="0x..." className={inputClass} />
            </div>
            <div>
              <div className="text-[14px] text-[#d4d4d8] uppercase tracking-[1px] mb-2">User ID</div>
              <input type="text" value={userIdInput} onChange={e => setUserIdInput(e.target.value)} placeholder="UUID" className={inputClass} />
            </div>
            <div>
              <div className="text-[14px] text-[#d4d4d8] uppercase tracking-[1px] mb-2">Org ID</div>
              <input type="text" value={orgIdInput} onChange={e => setOrgIdInput(e.target.value)} placeholder="UUID" className={inputClass} />
            </div>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="p-4 rounded border border-[rgba(239,68,68,0.15)] bg-[rgba(239,68,68,0.04)] text-[14px] text-[#ef4444]">
              {errorMsg}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleVerify}
            disabled={!fileText || status === 'processing'}
            className="w-full px-[22px] py-[11px] text-[14px] font-semibold rounded border border-[#b5f542] text-black bg-[#b5f542] hover:bg-[#c8fc5a] disabled:bg-[#0a0a0a] disabled:text-[#d4d4d8] disabled:border-[#1a1a1a] transition-all cursor-pointer font-mono"
          >
            {status === 'processing' ? 'Processing locally...' : 'Verify Log Integrity'}
          </button>
        </div>

        {/* Results */}
        {(status === 'verified' || status === 'tampered') && (
          <div className={`mt-6 p-6 rounded-md border ${
            status === 'verified'
              ? 'bg-[rgba(181,245,66,0.04)] border-[rgba(181,245,66,0.15)]'
              : 'bg-[rgba(239,68,68,0.04)] border-[rgba(239,68,68,0.15)]'
          }`}>
            <h2 className={`text-[18px] font-bold mb-4 font-heading ${
              status === 'verified' ? 'text-[#b5f542]' : 'text-[#ef4444]'
            }`}>
              {status === 'verified' ? '✓ VERIFIED — Authentic Log' : '✗ TAMPERED — Log altered'}
            </h2>

            <div className="space-y-3 font-mono text-[14px]">
              <div className="grid grid-cols-3 gap-4 text-[#d4d4d8]">
                <span className="col-span-1 uppercase tracking-[1px]">Session ID</span>
                <span className="col-span-2 text-[#e4e4e7] truncate" title={sessionIdStr}>{sessionIdStr}</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-[#d4d4d8]">
                <span className="col-span-1 uppercase tracking-[1px]">Your Hash</span>
                <span className="col-span-2 text-[#e4e4e7] truncate" title={computedHash.startsWith('0x') ? computedHash : `0x${computedHash}`}>
                  {computedHash.startsWith('0x') ? computedHash : `0x${computedHash}`}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-[#d4d4d8]">
                <span className="col-span-1 uppercase tracking-[1px]">On-Chain Hash</span>
                <span className="col-span-2 text-[#e4e4e7] truncate" title={onChainHash}>{onChainHash}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
