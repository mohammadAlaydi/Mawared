'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { LayoutDashboard, ClipboardList, Users, Briefcase, Package, UserCheck, CreditCard, BarChart3, Settings, LogOut, ChevronRight, ChevronLeft } from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'لوحة التحكم', href: '/dashboard' },
  { icon: ClipboardList, label: 'إدارة الطلبات', href: '/dashboard/orders' },
  { icon: Users, label: 'إدارة العمالة', href: '/dashboard/workers' },
  { icon: Briefcase, label: 'الخدمات', href: '/dashboard/services' },
  { icon: Package, label: 'الباقات', href: '/dashboard/packages' },
  { icon: UserCheck, label: 'العملاء', href: '/dashboard/customers' },
  { icon: CreditCard, label: 'المدفوعات', href: '/dashboard/payments' },
  { icon: BarChart3, label: 'التقارير', href: '/dashboard/reports' },
  { icon: Settings, label: 'الإعدادات', href: '/dashboard/settings' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-64'} bg-[#073D34] text-white flex flex-col transition-all duration-300 shrink-0 h-screen sticky top-0`}>
      {/* Header */}
      <div className="p-4 flex items-center gap-3 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl bg-[#1A7A69] flex items-center justify-center text-lg font-black shrink-0">م</div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="font-bold text-sm whitespace-nowrap">موارد الدولية</p>
            <p className="text-[10px] text-white/50">لوحة التحكم</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {navItems.map(item => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className={`flex items-center gap-3 mx-2 mb-0.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-[#1A7A69] text-white' : 'text-white/60 hover:bg-[#0B5E50] hover:text-white/90'}`}>
              <item.icon size={20} className="shrink-0" />
              {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/10 p-3">
        {!collapsed && (
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-[#C9A84C] flex items-center justify-center text-xs font-bold text-white">مد</div>
            <div>
              <p className="text-xs font-semibold">مشرف عام</p>
              <p className="text-[10px] text-white/50">admin@mawared.sa</p>
            </div>
          </div>
        )}
        <button onClick={logout} className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-all text-sm ${collapsed ? 'justify-center' : ''}`}>
          <LogOut size={18} />
          {!collapsed && <span>تسجيل الخروج</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button onClick={() => setCollapsed(!collapsed)} className="absolute -left-3 top-20 w-6 h-6 rounded-full bg-[#0B5E50] border-2 border-[#F7F6F2] flex items-center justify-center text-white hover:bg-[#1A7A69] transition-colors z-10">
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
