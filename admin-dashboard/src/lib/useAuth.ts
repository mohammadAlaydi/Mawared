'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@mawared/api-client';
import { api, clearSessionTokens, hasSession, setSessionTokens } from './api';

interface LoginInput {
  email: string;
  password: string;
  totp?: string;
}

interface AuthState {
  ready: boolean;
  authenticated: boolean;
  loginError: string | null;
}

/**
 * Minimal session helper for the admin dashboard. Components call:
 *
 *   const { authenticated, login, logout } = useAuth();
 *
 * The token storage lives in sessionStorage (cleared on tab close); the
 * MawaredClient auto-refreshes 15-minute access tokens via the refresh
 * token. No persistent cookie. For "remember me", swap sessionStorage
 * for localStorage in `lib/api.ts`.
 */
export function useAuth(): AuthState & {
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
} {
  const [authenticated, setAuthenticated] = useState(false);
  const [ready, setReady] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    setAuthenticated(hasSession());
    setReady(true);
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    setLoginError(null);
    try {
      // Stable device id per browser. UUID v4 by default.
      let deviceId = window.localStorage.getItem('mawared.admin.deviceId');
      if (!deviceId) {
        deviceId = crypto.randomUUID();
        window.localStorage.setItem('mawared.admin.deviceId', deviceId);
      }
      const res = await api.adminAuth.login(input.email, input.password, deviceId, input.totp);
      setSessionTokens(res.accessToken, res.refreshToken);
      setAuthenticated(true);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.code === 'AUTH_2FA_REQUIRED'
            ? 'TOTP code required.'
            : err.detail
          : 'Login failed.';
      setLoginError(msg);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    clearSessionTokens();
    setAuthenticated(false);
  }, []);

  return { ready, authenticated, loginError, login, logout };
}
