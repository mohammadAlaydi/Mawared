'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import { useAuth } from '@/lib/auth';

/**
 * Auth gate for /dashboard/*. Waits for the auth context to finish probing
 * sessionStorage before deciding whether to render or redirect; otherwise
 * we'd flash the dashboard for one frame on a fresh tab.
 *
 * Note: this is a UX gate, not a security boundary. Every API call still
 * needs a valid JWT — without one, the backend returns 401 and the user
 * sees empty states. The real authorization happens server-side.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { ready, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) router.replace('/login');
  }, [ready, isAuthenticated, router]);

  // Hold the shell back until we know the session state. Avoids a one-frame
  // flash of the dashboard before redirecting unauth'd visitors.
  if (!ready || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F7F6F2] flex items-center justify-center" dir="rtl">
        <div className="w-12 h-12 rounded-full border-2 border-gray-200 border-t-[#0B5E50] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F7F6F2]" dir="rtl">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
