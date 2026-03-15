import { processSession } from '../src/processSession';
import { loadConfig, getMappedAgent } from '../src/config';
import * as path from 'path';
import { createHash } from 'crypto';
import { simplify } from '../src/pipeline/simplify';
import { sanitize } from '../src/pipeline/sanitize';
import { normalize } from '../src/pipeline/normalize';
import { parseClaudeCodeLog } from '../src/adapters/parseClaudeCodeLog';
import { computeSessionHash } from '../src/pipeline/hash';

async function main() {
  const logFilePath = path.join(__dirname, 'malicious_session.jsonl');
  const config = loadConfig();
  const agent = Object.values(config.agentMap)[0] || { agentId: '11', ensName: 'codex2.agentcover.eth' };
  
  const baseOpts = {
    logFilePath,
    agentId: String(agent.agentId),
    agentEns: agent.ensName,
    walletId: config.walletAddress,
    userId: config.userId,
    orgId: config.walletAddress,
  };

  const scenarios = [
    { name: 'Actual CLI Logic', opts: baseOpts },
    { name: 'Lowercased WalletID', opts: { ...baseOpts, walletId: baseOpts.walletId.toLowerCase() } },
    { name: 'Lowercased OrgID',    opts: { ...baseOpts, orgId: baseOpts.orgId.toLowerCase() } },
    { name: 'Lowercased Both',      opts: { ...baseOpts, walletId: baseOpts.walletId.toLowerCase(), orgId: baseOpts.orgId.toLowerCase() } },
    { name: 'Everything Lower',    opts: { ...baseOpts, walletId: baseOpts.walletId.toLowerCase(), orgId: baseOpts.orgId.toLowerCase(), userId: baseOpts.userId.toLowerCase() } },
    { name: 'Filename Workspace', opts: baseOpts, useFileName: true },
    { name: 'Lower + Filename WS', opts: { ...baseOpts, walletId: baseOpts.walletId.toLowerCase(), orgId: baseOpts.orgId.toLowerCase() }, useFileName: true },
  ];

  const targetHashPrefix = 'c1adbc0f';

  for (const scenario of scenarios) {
    const raw = parseClaudeCodeLog(scenario.opts);
    if (scenario.useFileName) {
        raw.workspacePath = 'malicious_session.jsonl';
    }
    const hashed = computeSessionHash(simplify(sanitize(normalize(raw))));
    const fullHash = `0x${hashed}`;
    console.log(`[${scenario.name}] ${fullHash}`);
    if (hashed.startsWith(targetHashPrefix)) {
        console.log(`\n!!! MATCH FOUND: ${scenario.name} !!!\n`);
    }
  }
}

main();
