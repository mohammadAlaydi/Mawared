'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

/**
 * Root route. Bounces to /dashboard or /login depending on session state.
 * The auth context is the single source of truth — we never read
 * sessionStorage directly here.
 */
export default function Home() {
  const router = useRouter();
  const { ready, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!ready) return;
    router.replace(isAuthenticated ? '/dashboard' : '/login');
  }, [ready, isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-2 border-gray-200 border-t-[#2D5BE4] animate-spin" />
    </div>
  );
}
