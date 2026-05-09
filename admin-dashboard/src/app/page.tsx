'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const auth = sessionStorage.getItem('mawared_auth');
    router.replace(auth === 'true' ? '/dashboard' : '/login');
  }, [router]);
  return <div className="min-h-screen bg-surface flex items-center justify-center"><div className="skeleton w-12 h-12 rounded-full" /></div>;
}
