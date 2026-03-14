'use client';

import React, { useState } from 'react';
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


  // Required fields for hash reconstruction that aren't in the raw log natively
  const [agentIdInput, setAgentIdInput] = useState('');
  const [agentEnsInput, setAgentEnsInput] = useState('');
  const [walletIdInput, setWalletIdInput] = useState('');
  const [userIdInput, setUserIdInput] = useState('');
  const [orgIdInput, setOrgIdInput] = useState('');

  const [status, setStatus] = useState<'idle' | 'processing' | 'verified' | 'tampered' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Results
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

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-8">Verify Claim Evidence</h1>

      <div className="bg-white/5 p-6 rounded-xl border border-white/10 mb-8 space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2 text-white/70">Tool Type</label>
          <select
            value={toolType}
            onChange={e => setToolType(e.target.value as any)}
            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white"
          >
            <option value="claude_code">Claude Code (*.jsonl)</option>
            <option value="codex">Codex (*.jsonl)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-white/70">Raw Log File</label>
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
            className="w-full text-white/80 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-white/10 file:text-white hover:file:bg-white/20"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-white/70">Agent ID</label>
            <input type="text" value={agentIdInput} onChange={e => setAgentIdInput(e.target.value)} placeholder="e.g. 2" className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-white/70">Agent ENS</label>
            <input type="text" value={agentEnsInput} onChange={e => setAgentEnsInput(e.target.value)} placeholder="e.g. myagent.agentcover.eth" className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-white/70">Wallet Address</label>
            <input type="text" value={walletIdInput} onChange={e => setWalletIdInput(e.target.value)} placeholder="0x..." className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-white/70">User ID</label>
            <input type="text" value={userIdInput} onChange={e => setUserIdInput(e.target.value)} placeholder="UUID" className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-white/70">Org ID</label>
            <input type="text" value={orgIdInput} onChange={e => setOrgIdInput(e.target.value)} placeholder="UUID" className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white text-sm" />
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {errorMsg}
          </div>
        )}

        <button
          onClick={handleVerify}
          disabled={!fileText || status === 'processing'}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-white/10 disabled:text-white/50 text-white font-bold py-3 px-4 rounded-lg transition"
        >
          {status === 'processing' ? 'Processing locally...' : 'Verify Log Integrity'}
        </button>
      </div>

      {(status === 'verified' || status === 'tampered') && (
        <div className={`p-6 rounded-xl border ${status === 'verified' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
          <h2 className={`text-xl font-bold mb-4 flex items-center gap-3 ${status === 'verified' ? 'text-green-400' : 'text-red-400'}`}>
            {status === 'verified' ? '✅ VERIFIED — Authentic Log' : '❌ TAMPERED — Log altered'}
          </h2>

          <div className="space-y-3 font-mono text-sm">
            <div className="grid grid-cols-3 gap-4 text-white/70">
              <span className="col-span-1">Session ID:</span>
              <span className="col-span-2 text-white truncate" title={sessionIdStr}>{sessionIdStr}</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-white/70">
              <span className="col-span-1">Your Hash:</span>
              <span className="col-span-2 text-white truncate" title={computedHash.startsWith('0x') ? computedHash : `0x${computedHash}`}>
                {computedHash.startsWith('0x') ? computedHash : `0x${computedHash}`}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-white/70">
              <span className="col-span-1">On-Chain Hash:</span>
              <span className="col-span-2 text-white truncate" title={onChainHash}>{onChainHash}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
