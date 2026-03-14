# Phase 1 Plan: Build Onboarding, ENS, ENSIP-25, and Claude/Codex Binding First

## Summary
This phase assumes **nothing else exists yet**. The only goal is to build the **first slice of the product**: a user with no Web3 setup can create a wallet, get an ENS identity, register an insured onchain agent, verify that agent with the ENSIP-25 pattern, and bind that verified agent to local Claude Code or Codex usage through the collector setup flow.

This phase should end with one concrete success state:
- the user has a **verified insured agent identity**
- the local machine is **bound to that agent**
- `claude` and/or `codex` are wrapped by your package
- future evidence collection can be built on top of this foundation

## What This Phase Includes

### 1. Web App Foundation
Build the minimum app shell required for onboarding only.

Create:
- landing page with one CTA: `Get Covered`
- authenticated onboarding flow
- simple dashboard that shows:
  - wallet address
  - ENS name
  - insured agent id
  - ENS verification status
  - bound tools
  - collector setup status

Use:
- `Next.js`
- `TypeScript`
- `wagmi`
- `RainbowKit`
- `viem`
- `Tailwind`
- `Postgres` + `Prisma`

The dashboard can be minimal; it only needs to confirm onboarding state.

### 2. User Authentication And Wallet Connection
Implement wallet-first auth as the first backend capability.

Build:
- wallet connect in frontend
- SIWE-style backend authentication
- user session creation
- user record creation

Required backend model:
- `User { id, walletAddress, createdAt }`

Success criteria:
- a new user can connect a wallet and get an authenticated session
- a returning user resumes their state

### 3. ENS Acquisition Flow
Because this is the first phase, keep ENS acquisition simple and fully under your control.

Default approach:
- issue app-managed ENS subnames, such as `arpit.agentcover.eth`

Build:
- form to choose handle
- availability check
- subname issuance flow
- persist ENS profile in backend

Required backend model:
- `EnsProfile { id, userId, ensName, source, isActive }`

Required frontend behavior:
- if user has no ENS, they must create one before continuing
- if user already completed this step, skip it

Success criteria:
- a user with no prior ENS can finish with an ENS identity in one flow

### 4. Agent Registry Contract
Since no other parts exist, this phase must establish the product’s first onchain primitive: the insured agent registry.

Deploy a minimal contract on Base Sepolia.

Contract responsibilities:
- register an insured agent
- expose owner and ENS name
- support reading agent details
- support deactivation later if needed

Minimum fields:
- `agentId`
- `owner`
- `ensName`
- `runtimeType`
- `metadataURI`
- `createdAt`
- `isActive`

Minimum contract methods:
- `registerAgent(address owner, string ensName, string runtimeType, string metadataURI)`
- `getAgent(uint256 agentId)`
- `deactivateAgent(uint256 agentId)`

This contract becomes the system of record for insured agent identity.

### 5. Agent Creation Flow
Build the app flow that creates an insured agent for the user.

Frontend flow:
- after ENS acquisition, ask:
  - which tool do you want to insure first?
- allowed choices:
  - `Claude Code`
  - `Codex`

Backend flow:
- create metadata document for the agent
- call registry contract to register agent
- persist agent record in DB

Required backend model:
- `InsuredAgent { id, userId, chainAgentId, ensName, runtimeType, metadataUri, verificationStatus }`

Default runtime rule:
- one user creates one initial insured agent for one runtime
- supporting multiple agents comes later

Success criteria:
- after this step, user has a real onchain agent id

### 6. ENSIP-25 Verification Flow
This is the most important part of Phase 1.

Build the bidirectional verification flow:
- registry claims ENS name
- ENS confirms the registry entry

Flow:
1. user creates insured agent
2. app gets `agentId` from registry
3. app computes ENSIP-25 text record key:
   - `agent-registration[<registryInteropAddress>][<agentId>]`
4. user signs transaction to set that text record on their ENS name
5. backend checks both sides
6. backend marks the agent as verified

Required backend status values:
- `pending`
- `verified`
- `failed`

Required frontend behavior:
- show explicit step: `Verify your agent`
- show clear status after verification
- block collector setup until verification succeeds

Required utility interfaces:
- `computeEnsip25RecordKey(registryAddress, agentId)`
- `verifyEnsip25(agentId, ensName)`

Success criteria:
- user can complete a full verification flow from app UI
- app can show “Verified Agent” only when both registry and ENS records match

### 7. Onboarding State Machine
Since this is the very first product slice, build onboarding explicitly as a tracked state machine.

Statuses:
- `wallet_pending`
- `ens_pending`
- `agent_pending`
- `verification_pending`
- `collector_pending`
- `completed`

Store this server-side so the app is resumable.

Required model:
- `OnboardingSession { userId, status, currentStep }`

Success criteria:
- refreshing the page does not break onboarding
- user always lands on the correct next step

### 8. Collector CLI Skeleton
Do not build full evidence ingestion yet. In this phase, build only the binding/setup part of the collector.

Create a global package:
- `agentcover`

Commands to implement now:
- `agentcover setup`
- `agentcover status`
- `agentcover uninstall`

Do not implement full parsing/upload yet.
This phase only needs:
- auth
- agent selection
- local config
- shell hook install

### 9. Collector Authentication Flow
Build the CLI-to-platform auth flow.

Recommended:
- browser-based device login or token handoff from web app

CLI setup behavior:
1. authenticate user
2. fetch user’s verified agents
3. allow selecting one verified agent
4. save config locally

Local config file:
- `~/.agentcover/config.json`

Stored fields:
- `userId`
- `walletAddress`
- `ensName`
- `agentId`
- `runtimeType`
- `authToken`
- `shellType`
- `installedHooks`

Success criteria:
- CLI can only bind to agents already verified in the app
- config persists across shell sessions

### 10. Claude/Codex Shell Hook Installation
Build the hook installer as part of CLI setup.

Default implementation:
- patch `.zshrc` or `.bashrc`
- install shell function wrappers

Examples:
- `claude()` -> `agentcover run claude "$@"`
- `codex()` -> `agentcover run codex "$@"`

For this first phase, `agentcover run ...` can be a stub that only prints:
- tool called
- agent id
- verified binding exists

Do not build evidence collection yet.
The purpose here is only to prove:
- local runtime is now connected to the verified agent identity

Installer requirements:
- back up rc file
- insert block only once
- remove cleanly on uninstall

Success criteria:
- after setup, user can type `claude` or `codex`
- wrapper runs through AgentCover
- binding to verified agent is confirmed locally

### 11. Minimal Dashboard For Verification And Binding
Add a dashboard page that shows the result of this whole first phase.

Display:
- connected wallet
- ENS name
- insured agent id
- verification status
- selected runtime
- collector binding status
- shell hook installation status

This gives you a visible demo of the identity stack even before the evidence layer exists.

## Public Interfaces And Types Added
This first phase introduces these core interfaces:

- `User`
- `EnsProfile`
- `InsuredAgent`
- `OnboardingSession`
- `CollectorBindingConfig`

And these contract/backend primitives:
- `AgentRegistry.registerAgent(...)`
- `AgentRegistry.getAgent(...)`
- `computeEnsip25RecordKey(...)`
- `verifyEnsip25(...)`

## Test Plan

### Wallet / Auth
- new user can connect wallet and create account
- returning user resumes authenticated onboarding

### ENS
- user with no ENS can receive an app-managed subname
- duplicate subname request fails cleanly
- stored ENS profile persists correctly

### Agent Registry
- agent registration creates a valid onchain record
- runtime type and ENS name are stored correctly
- reading agent details works from frontend/backend

### ENSIP-25 Verification
- verification succeeds only when both sides match
- missing ENS text record fails verification
- wrong ENS name fails verification
- verified agent is reflected in dashboard state

### Collector Setup
- CLI auth succeeds only for signed-in user
- CLI lists only verified agents
- local config is written correctly
- shell hook is installed once and removed cleanly
- invoking wrapped `claude` or `codex` confirms bound agent identity

### End-to-end
- a new user with no wallet and no ENS can complete the entire flow
- final state shows:
  - ENS exists
  - insured agent exists
  - ENS verification passed
  - Claude/Codex binding installed

## Assumptions And Defaults
- This phase builds **only the onboarding and identity foundation**; no Fileverse, Base session anchoring, claims, or evidence upload yet.
- Use **Base Sepolia** for the registry contract.
- Use **app-managed ENS subnames** rather than requiring users to bring their own ENS.
- Use a **minimal custom agent registry** instead of a broader standard-heavy implementation.
- Use **ENSIP-25 as the verification pattern**, not as a way to verify Claude/Codex accounts directly.
- Claude Code and Codex are the only supported runtimes in this phase.
- `agentcover run` is a wrapper stub in this phase; full session capture comes later.
- The onboarding flow is considered complete only when:
  - wallet exists
  - ENS exists
  - onchain agent exists
  - ENS verification succeeds
  - local collector binding is installed
