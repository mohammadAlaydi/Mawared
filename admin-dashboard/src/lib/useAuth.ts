// Deprecated standalone hook. The real auth surface lives in ./auth.tsx
// (provider + hook). This module re-exports the hook for backwards
// compatibility — new code should import from '@/lib/auth' directly.
export { useAuth } from './auth';
export type { LoginInput } from './auth';
