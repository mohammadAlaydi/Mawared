'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, NetworkError } from '@mawared/api-client';
import {
  api,
  clearSessionTokens,
  hasSession,
  setSessionTokens,
} from './api';

// =====================================================================
// Admin-dashboard auth context.
//
// Wires into the backend via @mawared/api-client (singleton in lib/api.ts).
// Tokens live in sessionStorage and are auto-refreshed by the api-client's
// single-flight refresh logic. Sessions die on tab close — that's
// intentional for an internal admin tool.
//
// Security model:
//  - Login requires email + password + (optional) TOTP. The backend
//    requires TOTP if the staff account has it enrolled.
//  - sessionStorage is XSS-readable; rely on Next.js's escaping +
//    a strict CSP (configured in next.config.ts) to mitigate.
//  - This is not a public-facing app; admin accounts are issued by
//    a Super Admin and protected by TOTP.
// =====================================================================

const DEVICE_ID_KEY = 'mawared.admin.deviceId';

function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') {
    // Server-render fallback. Should never actually be used for login.
    return '00000000-0000-0000-0000-000000000000';
  }
  let id = window.localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export interface LoginInput {
  email: string;
  password: string;
  totp?: string;
}

interface AuthContextValue {
  /** False until the initial sessionStorage probe completes. */
  ready: boolean;
  /** True if the user has a token in sessionStorage. Doesn't guarantee the token is still valid — the API will return 401 if not. */
  isAuthenticated: boolean;
  /** Most recent login error, if any. Cleared on next login attempt. */
  loginError: string | null;
  /** True while a login request is in flight. */
  loginPending: boolean;
  /** Calls /v1/admin/auth/login. Throws on failure (caller may also read loginError). */
  login: (input: LoginInput) => Promise<void>;
  /** Clears local tokens and bounces to /login. Best-effort; doesn't await server-side revocation. */
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [ready, setReady] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginPending, setLoginPending] = useState(false);

  // Probe sessionStorage once on mount; we can't read it during SSR.
  useEffect(() => {
    setIsAuthenticated(hasSession());
    setReady(true);
  }, []);

  const login = useCallback(async (input: LoginInput): Promise<void> => {
    setLoginError(null);
    setLoginPending(true);
    try {
      const deviceId = getOrCreateDeviceId();
      const res = await api.adminAuth.login(
        input.email.trim().toLowerCase(),
        input.password,
        deviceId,
        input.totp?.trim() || undefined,
      );
      setSessionTokens(res.accessToken, res.refreshToken);
      setIsAuthenticated(true);
    } catch (err) {
      const message = mapLoginError(err);
      setLoginError(message);
      throw err;
    } finally {
      setLoginPending(false);
    }
  }, []);

  const logout = useCallback((): void => {
    clearSessionTokens();
    setIsAuthenticated(false);
    setLoginError(null);
    router.replace('/login');
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      isAuthenticated,
      loginError,
      loginPending,
      login,
      logout,
    }),
    [ready, isAuthenticated, loginError, loginPending, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// ---- helpers ----

function mapLoginError(err: unknown): string {
  if (err instanceof ApiError) {
    // RFC 7807 problem+json. Backend's `code` field is the contract — UI strings
    // hang off that, not off `detail` (which may be English-only).
    switch (err.code) {
      case 'AUTH_2FA_REQUIRED':
        return 'يجب إدخال رمز التحقق الثنائي (TOTP).';
      case 'AUTH_INVALID_CREDENTIALS':
        return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
      case 'AUTH_ACCOUNT_LOCKED':
        return 'تم قفل الحساب مؤقتاً. الرجاء التواصل مع المسؤول.';
      case 'AUTH_ACCOUNT_DEACTIVATED':
        return 'هذا الحساب موقوف.';
      case 'RATE_LIMIT_EXCEEDED':
        return 'محاولات كثيرة. الرجاء الانتظار قليلاً.';
      default:
        return err.detail || 'فشل تسجيل الدخول. حاول مرة أخرى.';
    }
  }
  if (err instanceof NetworkError) {
    return 'تعذّر الاتصال بالخادم. تحقق من اتصالك بالإنترنت.';
  }
  return 'فشل تسجيل الدخول. حاول مرة أخرى.';
}
