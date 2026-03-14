# AgentCover

On-chain insurance coverage for autonomous AI agents. Register your agent on Base Sepolia, claim an ENS identity on Ethereum Sepolia, and verify ownership cross-chain using the ENSIP-25 standard.

Built for ETH Mumbai 2026.

## Architecture

```
ethmumbai2026/
├── apps/web/               # Next.js 15 web application
│   ├── prisma/              # SQLite database schema
│   ├── src/
│   │   ├── app/             # App Router pages + API routes
│   │   ├── components/      # React components (onboarding wizard, dashboard, UI)
│   │   ├── hooks/           # Custom hooks (auth, onboarding, agent registry)
│   │   ├── lib/             # Core logic (auth, ENS, ENSIP-25, contracts, SIWE)
│   │   └── types/           # TypeScript type definitions
│   └── ...
├── packages/contracts/      # Foundry smart contracts
│   ├── src/AgentRegistry.sol
│   ├── test/AgentRegistry.t.sol
│   └── script/DeployAgentRegistry.s.sol
└── scripts/
    └── setup-ens-parent.sh  # Register agentcover.eth on Sepolia
```

### Multi-Chain Design

| Chain             | Purpose                                        |
| ----------------- | ---------------------------------------------- |
| Base Sepolia      | AgentRegistry contract (agent registration)    |
| Ethereum Sepolia  | ENS subnames under `agentcover.eth` + ENSIP-25 text records |

### Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Wallet**: wagmi v2, viem (injected + Coinbase Wallet connectors)
- **Auth**: Sign-In with Ethereum (SIWE) → JWT in httpOnly cookies (jose)
- **Database**: SQLite via Prisma
- **Contracts**: Solidity 0.8.24, Foundry
- **Monorepo**: Turborepo + pnpm workspaces

## How It Works

### Onboarding Flow

1. **Connect Wallet** — User connects via MetaMask/Coinbase Wallet and signs a SIWE message
2. **Claim ENS Name** — Pick a handle (e.g. `myagent`) → server registers `myagent.agentcover.eth` as a wrapped ENS subname via NameWrapper on Sepolia, setting the user as the owner
3. **Register Agent** — User calls `registerAgent` on the AgentRegistry contract (Base Sepolia), then sets the metadata URI pointing to `/api/agents/{agentId}/metadata`
4. **Verify (ENSIP-25)** — User sets a text record on their ENS subname's resolver to prove they own both the ENS name and the registered agent. The key follows the ERC-7930 interoperable address format:
   ```
   agent-registration[0x0001000003014a5414<registry_address>][<agentId>]
   ```
   Value: `"1"` (non-empty = attestation per spec)
5. **CLI Setup** — Generate a bearer token for the CLI tool

### Smart Contract

`AgentRegistry.sol` stores agent records on-chain:

- `registerAgent(name, ensName)` → returns `agentId`, emits `AgentRegistered`
- `setMetadataURI(agentId, uri)` → links to off-chain metadata endpoint
- `deactivateAgent(agentId)` → marks agent inactive
- `getAgent(agentId)` → returns full agent struct
- `getOwnerAgentIds(owner)` → returns all agent IDs for an address

### API Routes

| Route                         | Method   | Description                              |
| ----------------------------- | -------- | ---------------------------------------- |
| `/api/auth/nonce`             | GET      | Generate SIWE nonce                      |
| `/api/auth/verify`            | POST     | Verify SIWE signature, create session    |
| `/api/auth/session`           | GET      | Check current session                    |
| `/api/auth/logout`            | POST     | Destroy session                          |
| `/api/ens/check`              | GET      | Check subname availability               |
| `/api/ens/register`           | POST     | Register ENS subname (server-side tx)    |
| `/api/agents`                 | GET/POST | List or create agent records             |
| `/api/agents/[id]`            | GET      | Get single agent                         |
| `/api/agents/[id]/metadata`   | GET      | ERC-721 style JSON metadata (public)     |
| `/api/verification`           | POST     | Verify ENSIP-25 text record cross-chain  |
| `/api/onboarding`             | GET/PUT  | Onboarding state machine                 |
| `/api/cli/auth`               | GET/POST | CLI token validation / generation        |
| `/api/cli/agents`             | GET      | List agents via CLI token auth           |

## Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/) >= 9
- [Foundry](https://book.getfoundry.sh/getting-started/installation) (forge, cast)
- A browser wallet extension (MetaMask, Coinbase Wallet, or any injected wallet)
- Sepolia ETH (for ENS registration) and Base Sepolia ETH (for agent registration)

## Setup

### 1. Clone and install

```bash
git clone <repo-url> ethmumbai2026
cd ethmumbai2026
pnpm install
```

### 2. Configure environment

```bash
cp .env.example apps/web/.env.local
```

Edit `apps/web/.env.local` and fill in:

```env
NEXT_PUBLIC_BASE_SEPOLIA_RPC=https://sepolia.base.org
NEXT_PUBLIC_SEPOLIA_RPC=https://rpc.sepolia.org
NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=<deployed-registry-address>
NEXT_PUBLIC_ENS_PARENT_NAME=agentcover.eth

AUTH_SECRET=<random-32-char-string>
ENS_OWNER_PRIVATE_KEY=<private-key-that-owns-agentcover.eth>
DATABASE_URL=file:./dev.db
```

### 3. Register the ENS parent name (one-time)

Either use the script (requires `cast` from Foundry):

```bash
export DEPLOYER_PRIVATE_KEY=0x...
export SEPOLIA_RPC_URL=https://rpc.sepolia.org
./scripts/setup-ens-parent.sh
```

Or register `agentcover.eth` manually at [sepolia.app.ens.domains](https://sepolia.app.ens.domains).

### 4. Deploy the smart contract

```bash
cd packages/contracts

# Run tests first
forge test

# Deploy to Base Sepolia
forge script script/DeployAgentRegistry.s.sol \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast
```

Copy the deployed address and set `NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS` in your `.env.local`.

### 5. Set up the database

```bash
cd apps/web
pnpm db:push
```

### 6. Run the dev server

```bash
# From the root
pnpm dev

# Or just the web app
cd apps/web && pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Running Tests

### Smart contract tests

```bash
cd packages/contracts
forge test -vvv
```

All 9 tests cover: registration, metadata URI, deactivation, access control, and event emission.

## ENS Contract Addresses (Sepolia)

| Contract                  | Address                                      |
| ------------------------- | -------------------------------------------- |
| Registry                  | `0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e` |
| NameWrapper               | `0x0635513f179D50A207757E05759CbD106d7dFcE8` |
| PublicResolver             | `0xE99638b40E4Fff0129D56f03b55b6bbC4BBE49b5` |
| ETHRegistrarController    | `0xfb3cE5D01e0f33f41DbB39035dB9745962F1f968` |

## Project Structure Detail

### Key Libraries

| File                  | Purpose                                                        |
| --------------------- | -------------------------------------------------------------- |
| `lib/auth.ts`         | JWT session management via `jose` (sign, verify, cookie ops)   |
| `lib/siwe.ts`         | SIWE nonce generation, storage, message verification           |
| `lib/ens.ts`          | viem clients for ENS reads (NameWrapper, PublicResolver)       |
| `lib/ensip25.ts`      | ERC-7930 address encoding, ENSIP-25 record key computation, cross-chain verification |
| `lib/contracts.ts`    | AgentRegistry ABI and contract config                          |
| `lib/wagmi-config.ts` | wagmi config with injected + Coinbase Wallet connectors        |
| `lib/metadata.ts`     | ERC-721 style metadata builder                                 |

### Onboarding State Machine

```
wallet_pending → ens_pending → agent_pending → verification_pending → collector_pending → completed
```

Each transition is validated server-side. The wizard auto-prompts chain switches as needed (Base Sepolia for agent registration, Eth Sepolia for ENS operations).
