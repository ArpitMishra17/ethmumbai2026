import type { NormalizedSession } from './types';

/**
 * Regex patterns that match common secrets and credentials.
 */
const SECRET_PATTERNS: RegExp[] = [
  // Generic key=value env style
  /(?:API_KEY|TOKEN|SECRET|PASSWORD|PRIVATE_KEY|AUTH|CREDENTIAL)[^\S\r\n]*[=:][^\S\r\n]*\S+/gi,
  // OpenAI-style API keys
  /sk-[a-zA-Z0-9]{20,}/g,
  // Anthropic keys
  /sk-ant-[a-zA-Z0-9\-_]{20,}/g,
  // GitHub PATs
  /ghp_[a-zA-Z0-9]{36}/g,
  /github_pat_[a-zA-Z0-9_]{82}/g,
  // Slack tokens
  /xox[baprs]-[a-zA-Z0-9\-]+/g,
  // AWS
  /AKIA[0-9A-Z]{16}/g,
  /(?:aws_secret_access_key|AWS_SECRET_ACCESS_KEY)[^\S\r\n]*[=:][^\S\r\n]*\S+/gi,
  // PEM private keys
  /-----BEGIN [A-Z ]+KEY-----[\s\S]*?-----END [A-Z ]+KEY-----/g,
  // Bearer tokens in headers
  /Bearer\s+[a-zA-Z0-9\-._~+/]+=*/g,
  // Basic auth in URLs
  /https?:\/\/[^:@\s]+:[^@\s]+@/g,
];

/**
 * Matches standalone export VAR=value lines (common in shell scripts and .env files).
 */
const ENV_LINE_PATTERN = /^(export\s+)?[A-Z][A-Z0-9_]{2,}=.+$/gm;

/**
 * Matches .env file content blocks shown in tool output.
 */
const ENV_FILE_BLOCK_PATTERN =
  /(?:\.env[^\n]*(?:content|contents|file)[^\n]*\n)```[\s\S]*?```/gi;

/**
 * Sanitize a raw text string by redacting secrets, credentials, and env vars.
 */
export function sanitizeText(text: string): string {
  let out = text;
  // Remove .env file blocks first (they typically contain many lines of secrets)
  out = out.replace(ENV_FILE_BLOCK_PATTERN, '[ENV FILE REDACTED]');
  // Remove individual env-style lines
  out = out.replace(ENV_LINE_PATTERN, (match) => {
    const eqIdx = match.indexOf('=');
    const key = match.slice(0, eqIdx);
    return `${key}=[REDACTED]`;
  });
  // Apply targeted secret patterns
  for (const pattern of SECRET_PATTERNS) {
    out = out.replace(pattern, '[REDACTED]');
  }
  return out;
}

/**
 * Deep-sanitize a NormalizedSession by serializing to JSON, sanitizing the
 * string, then parsing back. This ensures nested fields (tool call outputs,
 * message content, shell command outputs) are all scrubbed.
 */
export function sanitizeSession(session: NormalizedSession): NormalizedSession {
  const raw = JSON.stringify(session);
  const scrubbed = sanitizeText(raw);
  return JSON.parse(scrubbed) as NormalizedSession;
}
