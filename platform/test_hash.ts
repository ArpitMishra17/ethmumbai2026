import * as fs from 'fs';
import * as path from 'path';
import crypto from 'crypto';

// Ensure global.crypto is available for the browser pipeline in Node
if (!globalThis.crypto) {
  (globalThis as any).crypto = webcrypto;
}

// PACKAGENPM Imports
import { parseCodexLog } from '../packagenpm/src/adapters/parseCodexLog';
import { normalize as normalizeNpm } from '../packagenpm/src/pipeline/normalize';
import { sanitize as sanitizeNpm } from '../packagenpm/src/pipeline/sanitize';
import { simplify as simplifyNpm } from '../packagenpm/src/pipeline/simplify';
import { computeSessionHash as hashNpm } from '../packagenpm/src/pipeline/hash';

// FRONTEND Imports
import { parseCodexLogText } from './apps/web/src/lib/pipeline/parseCodexLog';
import { normalize as normalizeWeb } from './apps/web/src/lib/pipeline/normalize';
import { sanitize as sanitizeWeb } from './apps/web/src/lib/pipeline/sanitize';
import { simplify as simplifyWeb } from './apps/web/src/lib/pipeline/simplify';
import { computeSessionHash as hashWeb } from './apps/web/src/lib/pipeline/hash';

async function main() {
  const logFilePath = "C:\\Users\\Lenovo\\.codex\\sessions\\2026\\03\\15\\rollout-2026-03-15T01-18-38-019cede4-c46d-7031-bad0-07259549cdf9.jsonl";
  
  const opts = {
    agentId: "123",
    agentEns: "test.eth",
    walletId: "0xabc",
    userId: "user-1",
    orgId: "org-1",
  };

  console.log("=== Running packagenpm Pipeline ===");
  const parsedNpm = parseCodexLog({ logFilePath, ...opts });
  const simplifiedNpm = simplifyNpm(sanitizeNpm(normalizeNpm(parsedNpm)));
  const npmHash = hashNpm(simplifiedNpm);
  console.log("NPM Hash:", npmHash);

  console.log("\n=== Running Frontend Pipeline ===");
  const text = fs.readFileSync(logFilePath, 'utf-8');
  const parsedWeb = await parseCodexLogText({ text, fileName: path.basename(logFilePath), ...opts });
  const simplifiedWeb = simplifyWeb(sanitizeWeb(normalizeWeb(parsedWeb)));
  const webHash = await hashWeb(simplifiedWeb);
  console.log("Web Hash:", webHash);
  
  fs.writeFileSync('npm.json', JSON.stringify(simplifiedNpm, null, 2));
  fs.writeFileSync('web.json', JSON.stringify(simplifiedWeb, null, 2));

  console.log(`\nHashes match? ${npmHash === webHash ? '✅ YES' : '❌ NO'}`);
}

main().catch(console.error);
