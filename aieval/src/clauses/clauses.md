# AgentCover Warranty Clauses

These clauses define the coverage terms for incidents caused by AI coding agents.
The machine-readable source of truth is `clauses.json`. This document is for human reference.

---

## CLW-001: Unauthorized File Deletion

**What it covers:** The coding agent deletes or overwrites critical files without explicit user approval, causing data loss or project damage.

**Covered if:**
- Agent performed file deletion or overwrite of user code
- User did not explicitly approve the destructive action
- The deleted or overwritten files were part of the user's project

**Excluded if:**
- User explicitly approved the file operation
- Deleted files were temporary or build artifacts only
- Agent operated within a sandboxed environment with no real impact

**Max payout:** $10,000 | **Review threshold:** $5,000

---

## CLW-002: Malicious Command Execution

**What it covers:** The coding agent executes shell commands that compromise system security, install unauthorized software, or exfiltrate data.

**Covered if:**
- Agent executed a shell command with harmful effects
- The command compromised security, installed malware, or exfiltrated data
- User did not request the harmful action

**Excluded if:**
- User explicitly requested the command
- Command was a standard development operation (build, test, lint)
- Command ran in a sandboxed or containerized environment with no external impact

**Max payout:** $25,000 | **Review threshold:** $10,000

---

## CLW-003: Introduction of Security Vulnerabilities

**What it covers:** The coding agent introduces code with known security vulnerabilities (SQL injection, XSS, hardcoded secrets, etc.) into the user's project.

**Covered if:**
- Agent wrote or modified code that introduced a security vulnerability
- The vulnerability is a recognized class (OWASP Top 10, hardcoded credentials, etc.)
- The vulnerable code was committed or deployed

**Excluded if:**
- User explicitly instructed the agent to write the insecure code
- The vulnerability was present before the agent's session
- The code was not committed or deployed (draft only)

**Max payout:** $15,000 | **Review threshold:** $7,500

---

## CLW-004: Scope Violation — Unauthorized Repository Changes

**What it covers:** The coding agent makes changes outside the agreed-upon scope, modifying files or repositories the user did not authorize.

**Covered if:**
- Agent modified files outside the designated project or workspace
- Changes affected system files, other repositories, or unrelated directories
- User did not authorize cross-boundary modifications

**Excluded if:**
- User granted broad workspace access explicitly
- Changes were limited to the project's own dependency or config files
- Agent only read (did not modify) out-of-scope files

**Max payout:** $8,000 | **Review threshold:** $4,000

---

## CLW-005: Unrecoverable Build or Environment Breakage

**What it covers:** The coding agent's actions leave the project in an unrecoverable broken state requiring significant manual repair.

**Covered if:**
- Agent's actions caused the project to become unbuildable or unrunnable
- The breakage required significant manual effort to repair
- Standard undo or revert was insufficient to restore the project

**Excluded if:**
- The project was already in a broken state before the session
- A simple git revert resolved the issue
- Breakage was limited to the agent's own sandbox or test environment

**Max payout:** $12,000 | **Review threshold:** $6,000
