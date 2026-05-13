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

export const api = new MawaredClient({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000',
  getAccessToken: () => readTokens()?.accessToken ?? null,
  getRefreshToken: () => readTokens()?.refreshToken ?? null,
  onTokenRefresh: (accessToken, refreshToken) => writeTokens({ accessToken, refreshToken }),
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
