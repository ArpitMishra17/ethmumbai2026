# AgentCover Collector

CLI tool that captures AI coding session logs (Claude Code, Codex) and prepares them as verifiable evidence for the AgentCover warranty platform.

## Install

```bash
npm install -g agentcover-collector
```

## Quick Start

```bash
# 1. Login to AgentCover platform
agentcover login

# 2. Run your AI agent with evidence collection
agentcover codex
# or
agentcover claude
```

## Commands

| Command | Description |
|---------|-------------|
| `agentcover login` | Login via platform token, map agents to tools |
| `agentcover status` | Show current login and agent mappings |
| `agentcover codex` | Run Codex with session log collection |
| `agentcover claude` | Run Claude Code with session log collection |
| `agentcover init` | Alias for `login` |

## How It Works

```
agentcover codex
    │
    ├─ 1. Load config (token + agent mapping)
    ├─ 2. Snapshot existing session logs
    ├─ 3. Launch Codex (you work normally)
    ├─ 4. Codex exits
    ├─ 5. Detect new session logs (diff)
    └─ 6. Report evidence (agent ENS + log files)
```

The collector wraps your AI tool, detects any new session logs created during the run, and tags them with your registered agent's ENS identity.

## Login Flow

1. Run `agentcover login`
2. Open the AgentCover platform in your browser
3. Generate a CLI token from the dashboard
4. Paste the token into the CLI
5. Map your registered agents to Claude / Codex
6. Done — config saved to `~/.agentcover/config.json`

## Supported Agents

| Agent | Log Location | Format |
|-------|-------------|--------|
| Claude Code | `~/.claude/projects/*/sessions/*.jsonl` | Line-delimited JSON events |
| Codex | `~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl` | Line-delimited JSON events |

## Evidence Payload

When new logs are detected, the CLI outputs the full evidence payload:

```json
{
  "agentEns": "myagent.agentcover.eth",
  "agentId": 1,
  "userWallet": "0x1234...5678",
  "toolType": "codex",
  "sessionFiles": [
    {
      "fileName": "rollout-2026-03-14T04-36-27.jsonl",
      "fileSize": 31685,
      "lineCount": 14
    }
  ],
  "workspacePath": "/path/to/project",
  "timestamp": 1710408600000
}
```

## Architecture

```
packagenpm/
├── bin/agentcover.ts           # CLI entry point
└── src/
    ├── index.ts                # Commander setup (login, status, claude, codex)
    ├── auth.ts                 # Platform API (token validation, agent fetching)
    ├── config.ts               # Config management (~/.agentcover/)
    ├── runAgent.ts             # Spawn AI tool as child process
    ├── snapshotSessions.ts     # "Before" session snapshot
    ├── findNewSessions.ts      # Diff detection (new sessions)
    ├── uploadEvidence.ts       # Evidence payload reporting
    ├── adapters/
    │   ├── types.ts            # ToolAdapter interface
    │   ├── claudeAdapter.ts    # Claude Code log scanner
    │   ├── codexAdapter.ts     # Codex log scanner
    │   └── index.ts            # Adapter factory
    └── utils/
        ├── logger.ts           # Colored console output
        └── fsUtils.ts          # File system helpers
```

## Config

Stored at `~/.agentcover/config.json`:

```json
{
  "token": "cli-token-from-platform",
  "platformUrl": "https://agentcover.io",
  "userId": "...",
  "walletAddress": "0x...",
  "agentMap": {
    "claude_code": { "agentId": 1, "name": "my-claude", "ensName": "my-claude.agentcover.eth" },
    "codex": { "agentId": 2, "name": "my-codex", "ensName": "my-codex.agentcover.eth" }
  }
}
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Link globally for testing
npm link

# Test
agentcover --help
```

## Requirements

- Node.js >= 18
- Claude Code CLI and/or Codex CLI installed

## License

MIT
