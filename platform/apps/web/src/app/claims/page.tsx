'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { parseClaudeCodeLogText } from '@/lib/pipeline/parseClaudeCodeLog';
import { parseCodexLogText } from '@/lib/pipeline/parseCodexLog';
import { normalize } from '@/lib/pipeline/normalize';
import { sanitize } from '@/lib/pipeline/sanitize';
import { simplify } from '@/lib/pipeline/simplify';
import { addHash } from '@/lib/pipeline/addHash';
import type { HashedSession } from '@/lib/pipeline/types';
import { getOnChainSessionHash } from './actions';
import { useAuth } from '@/hooks/use-auth';

type VerificationMetadata = {
  agentId: string;
  agentEns: string;
  walletId: string;
  userId: string;
  orgId: string;
};

function sessionMetadata(session: Pick<HashedSession, 'agentId' | 'agentEns' | 'walletId' | 'userId' | 'orgId'>): VerificationMetadata {
  return {
    agentId: String(session.agentId ?? ''),
    agentEns: String(session.agentEns ?? ''),
    walletId: String(session.walletId ?? ''),
    userId: String(session.userId ?? ''),
    orgId: String(session.orgId ?? ''),
  };
}

function diffMetadata(current: VerificationMetadata, canonical: VerificationMetadata): string[] {
  const labels: Record<keyof VerificationMetadata, string> = {
    agentId: 'Agent ID',
    agentEns: 'Agent ENS',
    walletId: 'Wallet Address',
    userId: 'User ID',
    orgId: 'Org ID',
  };

  return (Object.keys(labels) as Array<keyof VerificationMetadata>)
    .filter((key) => current[key].trim() !== canonical[key].trim())
    .map((key) => `${labels[key]}: "${current[key]}" -> "${canonical[key]}"`);
}

function summarizeSessionDiff(local: Record<string, any>, canonical: Record<string, any>): string[] {
  const diffs: string[] = [];
  const keys = ['sessionId', 'workspacePath', 'startedAt', 'endedAt', 'summary', 'tokenEstimate', 'toolCallCount'];

  for (const key of keys) {
    if (JSON.stringify(local[key]) !== JSON.stringify(canonical[key])) {
      diffs.push(`${key}: ${JSON.stringify(local[key])} != ${JSON.stringify(canonical[key])}`);
    }
  }

  if (JSON.stringify(local.messages) !== JSON.stringify(canonical.messages)) {
    diffs.push(`messages differ (${local.messages?.length ?? 0} local vs ${canonical.messages?.length ?? 0} canonical)`);
  }

  if (JSON.stringify(local.toolCalls) !== JSON.stringify(canonical.toolCalls)) {
    diffs.push(`toolCalls differ (${local.toolCalls?.length ?? 0} local vs ${canonical.toolCalls?.length ?? 0} canonical)`);
  }

  return diffs.slice(0, 6);
}

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
  const [debugNotes, setDebugNotes] = useState<string[]>([]);

  // Evaluation state
  const [requestedAmount, setRequestedAmount] = useState<string>('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<any>(null);
  const [normalizedSessionObj, setNormalizedSessionObj] = useState<any>(null);
  const [claimTextStr, setClaimTextStr] = useState('');

  // Auto-population state
  const { session } = useAuth();
  const [registeredAgents, setRegisteredAgents] = useState<any[]>([]);

  React.useEffect(() => {
    if (session) {
      if (session.userId) setUserIdInput(session.userId);
      if (session.address) {
        setWalletIdInput(session.address);
        setOrgIdInput(session.address); // Org ID is same as wallet address
      }
    }

    // Fetch registered agents
    fetch('/api/agents')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.agents) {
          setRegisteredAgents(data.agents);
        }
      })
      .catch(err => console.error('Failed to fetch agents:', err));
  }, [session]);

  const buildHashedSession = async (metadata: VerificationMetadata): Promise<HashedSession> => {
    const parseOptions = {
      text: fileText || '',
      fileName: fileName,
      agentId: metadata.agentId.trim(),
      agentEns: metadata.agentEns.trim(),
      walletId: metadata.walletId.trim(),
      userId: metadata.userId.trim(),
      orgId: metadata.orgId.trim(),
    };

    const normalizedSession = toolType === 'claude_code'
      ? await parseClaudeCodeLogText(parseOptions)
      : await parseCodexLogText(parseOptions);

    const sanitizedSession = sanitize(normalize(normalizedSession));
    const simplifiedSession = simplify(sanitizedSession);
    return addHash(simplifiedSession);
  };

  const fetchCanonicalSession = async (sessionId: string): Promise<HashedSession | null> => {
    const res = await fetch(`/api/sessions/${encodeURIComponent(sessionId)}/canonical`, {
      cache: 'no-store',
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data?.session ?? null;
  };

  const handleSelectAgent = (agent: any) => {
    if (!agent) return;
    setAgentIdInput(String(agent.agentId));
    setAgentEnsInput(agent.ensName || '');
  };

  const handleVerify = async () => {
    if (!fileText || !fileName || !agentIdInput || !agentEnsInput || !walletIdInput || !userIdInput || !orgIdInput) {
      setErrorMsg('All fields are required to reconstruct the exact hash block.');
      setStatus('error');
      return;
    }

    setStatus('processing');
    setErrorMsg('');
    setDebugNotes([]);

    try {
      const enteredMetadata: VerificationMetadata = {
        agentId: agentIdInput,
        agentEns: agentEnsInput,
        walletId: walletIdInput,
        userId: userIdInput,
        orgId: orgIdInput,
      };

      const initialSession = await buildHashedSession(enteredMetadata);
      const canonicalSession = await fetchCanonicalSession(initialSession.sessionId);

      let hashedSession = initialSession;
      const notes: string[] = [];

      if (canonicalSession) {
        const canonicalMetadata = sessionMetadata(canonicalSession);
        const metadataChanges = diffMetadata(enteredMetadata, canonicalMetadata);

        if (metadataChanges.length > 0) {
          hashedSession = await buildHashedSession(canonicalMetadata);
          notes.push('Used canonical anchored metadata from Fileverse for verification.');
          notes.push(...metadataChanges);

          setAgentIdInput(canonicalMetadata.agentId);
          setAgentEnsInput(canonicalMetadata.agentEns);
          setWalletIdInput(canonicalMetadata.walletId);
          setUserIdInput(canonicalMetadata.userId);
          setOrgIdInput(canonicalMetadata.orgId);
        }

        if (hashedSession.contentHash !== canonicalSession.contentHash) {
          notes.push('Uploaded log still reconstructs a different hash than the canonical stored session.');
          notes.push(...summarizeSessionDiff(hashedSession, canonicalSession));
        }
      }

      setComputedHash(hashedSession.contentHash);
      setSessionIdStr(hashedSession.sessionId);
      setNormalizedSessionObj(hashedSession);
      setClaimTextStr(JSON.stringify(hashedSession));
      setDebugNotes(notes);

      const actualOnChainHash = await getOnChainSessionHash(
        hashedSession.sessionId,
        hashedSession.agentEns,
        hashedSession.walletId
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

  const handleEvaluate = async () => {
    if (!requestedAmount || isNaN(Number(requestedAmount))) {
      setErrorMsg('Please enter a valid requested payout amount.');
      return;
    }

    setIsEvaluating(true);
    setErrorMsg('');
    setEvalResult(null);

    try {
      const res = await fetch('/api/claims/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session: normalizedSessionObj,
          claimText: claimTextStr,
          requestedAmount: Number(requestedAmount),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Evaluation failed');
      }

      setEvalResult(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred during evaluation');
    } finally {
      setIsEvaluating(false);
    }
  };

  const inputClass = "w-full h-10 rounded border border-[#1a1a1a] bg-[#0d0d0d] px-4 text-[14px] text-[#e4e4e7] font-mono placeholder:text-[#d4d4d8] focus:outline-none focus:ring-1 focus:ring-[#b5f542] focus:border-[rgba(181,245,66,0.15)] transition-colors";

  return (
    <main className="min-h-screen bg-[#050505] font-mono">

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
          {/* Quick Select */}
          {registeredAgents.length > 0 && (
            <div>
              <div className="text-[12px] text-[#b5f542] uppercase tracking-[1px] mb-2 font-semibold">Quick Select: Your Registered Agents</div>
              <div className="flex flex-wrap gap-2">
                {registeredAgents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => handleSelectAgent(agent)}
                    className="px-3 py-1.5 rounded border border-[rgba(181,245,66,0.2)] bg-[rgba(181,245,66,0.05)] text-[12px] text-[#b5f542] hover:bg-[rgba(181,245,66,0.1)] transition-colors font-mono"
                  >
                    {agent.name} ({agent.ensName || `#${agent.agentId}`})
                  </button>
                ))}
              </div>
            </div>
          )}

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

                  // Extract metadata from the first few lines of jsonl
                  const lines = text.split('\n');
                  for (let i = 0; i < Math.min(lines.length, 10); i++) {
                    try {
                      const line = JSON.parse(lines[i]);
                      if (line.agentId) setAgentIdInput(line.agentId);
                      if (line.agentEns) setAgentEnsInput(line.agentEns);
                      if (line.walletId) setWalletIdInput(line.walletId);
                      if (line.userId) setUserIdInput(line.userId);
                      if (line.orgId) setOrgIdInput(line.orgId);
                      if (line.tool) setToolType(line.tool === 'claude_code' || line.tool === 'codex' ? line.tool : 'claude_code');
                    } catch (e) {
                      // skip invalid json lines
                    }
                  }
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
          <div className="space-y-6">
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

            {status === 'verified' && !evalResult && (
              <div className="border border-[#1a1a1a] rounded-md bg-[#0a0a0a] p-6 space-y-5">
                <div>
                  <h3 className="text-[18px] font-bold text-white font-heading mb-1">Evaluate Claim with AI</h3>
                  <p className="text-[14px] text-[#d4d4d8]">Review this authenticated session log for warranty clause violations.</p>
                </div>

                <div>
                  <div className="text-[14px] text-[#d4d4d8] uppercase tracking-[1px] mb-2">Requested Payout Amount</div>
                  <input
                    type="number"
                    value={requestedAmount}
                    onChange={e => setRequestedAmount(e.target.value)}
                    placeholder="e.g. 5000"
                    className={inputClass}
                  />
                  <p className="text-[11px] text-[#525252] mt-2 italic">Claim Text is automatically extracted from the authenticated session.</p>
                </div>

                <button
                  onClick={handleEvaluate}
                  disabled={isEvaluating}
                  className="w-full px-[22px] py-[11px] text-[14px] font-semibold rounded border border-[#b5f542] text-black bg-[#b5f542] hover:bg-[#c8fc5a] disabled:bg-[#0a0a0a] disabled:text-[#d4d4d8] disabled:border-[#1a1a1a] transition-all cursor-pointer font-mono"
                >
                  {isEvaluating ? 'AI Evaluator working...' : 'Evaluate Claim Integrity'}
                </button>
              </div>
            )}

            {evalResult && (
              <div className="border border-[#1a1a1a] rounded-md bg-[#0a0a0a] p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-4">
                  <h3 className="text-[20px] font-bold text-white font-heading uppercase tracking-[1px]">AI Verdict Dashboard</h3>
                  <div className={`px-3 py-1 rounded text-[12px] font-bold border uppercase ${
                    evalResult.decision.decision === 'approve' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                    evalResult.decision.decision === 'reject' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                    'bg-yellow-500/10 border-yellow-500/30 text-yellow-500'
                  }`}>
                    {evalResult.decision.decision}
                  </div>
                </div>

                <div className="space-y-4 font-mono text-[14px]">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[#d4d4d8] uppercase">Recommended Payout</span>
                    <span className="text-white text-[18px] font-bold">${evalResult.decision.recommendedPayout}</span>
                  </div>

                  <div>
                    <div className="text-[#d4d4d8] uppercase mb-2">Verdict Reason</div>
                    <div className="bg-[#050505] p-4 rounded border border-[#1a1a1a] text-[#e4e4e7] leading-relaxed">
                      {evalResult.decision.reason}
                    </div>
                  </div>

                  {evalResult.evaluatorOutput.evidence && evalResult.evaluatorOutput.evidence.length > 0 && (
                    <div>
                      <div className="text-[#d4d4d8] uppercase mb-3">Key Evidence Citations</div>
                      <div className="space-y-3">
                        {evalResult.evaluatorOutput.evidence.map((ev: any, i: number) => (
                          <div key={i} className="bg-[#0d0d0d] p-3 rounded border border-[#1a1a1a] border-l-[#b5f542] border-l-2">
                            <p className="text-[12px] text-[#525252] mb-1 italic">...{ev.excerpt}...</p>
                            <p className="text-[13px] text-[#d4d4d8]">{ev.relevance}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {debugNotes.length > 0 && (
              <div className="border border-[#1a1a1a] rounded-md bg-[#0a0a0a] p-6 space-y-3">
                <h3 className="text-[18px] font-bold text-white font-heading">Verification Notes</h3>
                <div className="space-y-2 font-mono text-[13px] text-[#d4d4d8]">
                  {debugNotes.map((note, idx) => (
                    <div key={idx} className="break-words">{note}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
