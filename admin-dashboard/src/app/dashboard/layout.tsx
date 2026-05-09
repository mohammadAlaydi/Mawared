'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import { DashboardProvider } from '@/lib/dashboard-context';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const auth = sessionStorage.getItem('mawared_auth');
    if (auth !== 'true') router.replace('/login');
  }, [router]);

  return (
    <DashboardProvider>
      <div className="flex h-screen overflow-hidden bg-[#F7F6F2]" dir="rtl">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </DashboardProvider>
  );
}
