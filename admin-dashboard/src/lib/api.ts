import { MawaredClient } from '@mawared/api-client';

/**
 * Browser-side API client singleton. Reads/writes tokens from sessionStorage
 * (cleared on tab close) — admin sessions are intentionally short-lived.
 *
 * For server components / route handlers, construct an ad-hoc MawaredClient
 * with credentials from cookies — never share this module's instance with
 * SSR.
 */

const TOKEN_KEY = 'mawared.admin.tokens';

interface StoredTokens {
  accessToken: string;
  refreshToken: string;
}

function readTokens(): StoredTokens | null {
  if (typeof window === 'undefined') return null;
  const raw = window.sessionStorage.getItem(TOKEN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredTokens;
  } catch {
    return null;
  }
}

function writeTokens(tokens: StoredTokens | null): void {
  if (typeof window === 'undefined') return;
  if (!tokens) window.sessionStorage.removeItem(TOKEN_KEY);
  else window.sessionStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
}

// --- Transient 429 handling --------------------------------------------------
// The backend rate-limits requests. Under normal use a 429 should be rare, but
// a brief burst (e.g. several widgets mounting at once) can momentarily trip it.
// We swallow those transient 429s here with a short, bounded backoff so the
// rate-limit error never reaches React Query (which would otherwise surface it
// to the user). Only a *persistent* 429 — one that survives every retry —
// propagates, and the api-client then throws ApiError(429) as usual. Keeping
// this in the fetch layer (rather than React Query) avoids amplification: a
// single user action makes at most MAX_429_RETRIES extra calls, spaced out,
// instead of React Query's parallel retry storm.
const MAX_429_RETRIES = 2;
const DEFAULT_429_BACKOFF_MS = 1_000;
const MAX_429_BACKOFF_MS = 8_000;

/** Parse a `Retry-After` header (seconds or HTTP-date) into milliseconds. */
function parseRetryAfterMs(header: string | null): number | null {
  if (!header) return null;
  const seconds = Number(header);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1_000);
  const dateMs = Date.parse(header);
  if (!Number.isNaN(dateMs)) return Math.max(0, dateMs - Date.now());
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * fetch wrapper that silently retries transient 429s with exponential backoff,
 * honouring `Retry-After` when the server sends it. Non-429 responses (and the
 * final 429 once retries are exhausted) are returned untouched for the
 * api-client to handle.
 */
async function fetchWithRateLimitBackoff(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  let attempt = 0;
  // Loop is bounded by MAX_429_RETRIES; each iteration is one network call.
  for (;;) {
    const res = await fetch(input, init);
    if (res.status !== 429 || attempt >= MAX_429_RETRIES) return res;

    const retryAfterMs = parseRetryAfterMs(res.headers.get('Retry-After'));
    const backoffMs = Math.min(
      retryAfterMs ?? DEFAULT_429_BACKOFF_MS * 2 ** attempt,
      MAX_429_BACKOFF_MS,
    );
    attempt += 1;
    await sleep(backoffMs);
  }
}

export const api = new MawaredClient({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000',
  getAccessToken: () => readTokens()?.accessToken ?? null,
  getRefreshToken: () => readTokens()?.refreshToken ?? null,
  onTokenRefresh: (accessToken, refreshToken) => writeTokens({ accessToken, refreshToken }),
  fetchImpl: fetchWithRateLimitBackoff,
});

export function setSessionTokens(accessToken: string, refreshToken: string): void {
  writeTokens({ accessToken, refreshToken });
}

export function clearSessionTokens(): void {
  writeTokens(null);
}

export function hasSession(): boolean {
  return readTokens() !== null;
}
