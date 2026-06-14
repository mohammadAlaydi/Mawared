'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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
  const pathname = usePathname();
  const { ready, isAuthenticated } = useAuth();

  // Shared shell state, lifted so Header (hamburger) and Sidebar stay in sync.
  // `collapsed` only applies to the lg+ rail; `mobileOpen` drives the off-canvas
  // drawer on <lg.
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) router.replace('/login');
  }, [ready, isAuthenticated, router]);

  // Close the mobile drawer whenever the route changes so navigation doesn't
  // leave the overlay hanging open.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  // Hold the shell back until we know the session state. Avoids a one-frame
  // flash of the dashboard before redirecting unauth'd visitors.
  if (!ready || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F7F6F2] flex items-center justify-center" dir="rtl">
        <div className="w-12 h-12 rounded-full border-2 border-gray-200 border-t-[#2D5BE4] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F7F6F2]" dir="rtl">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header onOpenMobileNav={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
