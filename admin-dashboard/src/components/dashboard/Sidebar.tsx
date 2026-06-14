'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { LayoutDashboard, ClipboardList, Users, Briefcase, Package, UserCheck, CreditCard, BarChart3, Settings, LogOut, ChevronRight, ChevronLeft, X } from 'lucide-react';

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

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  // The drawer is full-width-capped on mobile (off-canvas), but on lg+ it
  // becomes the static rail and the collapse toggle controls its width.
  // `collapsed` is intentionally ignored below lg so the drawer always shows
  // labels when opened on a phone.
  const railWidth = collapsed ? 'lg:w-16' : 'lg:w-64';

  return (
    <>
      {/* Mobile backdrop — closes the drawer on tap. Hidden on lg+. */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="إغلاق القائمة"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`
          ${railWidth}
          fixed inset-y-0 right-0 z-50 w-72 max-w-[85vw]
          bg-[#0F234C] text-white flex flex-col shrink-0 h-screen
          transition-transform duration-300 ease-out
          ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}
          lg:static lg:translate-x-0 lg:w-64 lg:max-w-none lg:z-auto lg:sticky lg:top-0
          lg:transition-[width]
        `}
      >
        {/* Header */}
        <div className="p-4 flex items-center gap-3 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6599FE] to-[#2D5BE4] flex items-center justify-center text-lg font-black shrink-0 shadow-md shadow-[#6599FE]/30">م</div>
          <div className={`overflow-hidden ${collapsed ? 'lg:hidden' : ''}`}>
            <p className="font-bold text-sm whitespace-nowrap">موارد الدولية</p>
            <p className="text-[10px] text-white/50">لوحة التحكم</p>
          </div>
          {/* Close button — mobile drawer only */}
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="إغلاق القائمة"
            className="ms-auto w-9 h-9 rounded-xl flex items-center justify-center text-white/70 hover:bg-white/10 hover:text-white transition-colors lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {navItems.map(item => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} onClick={onCloseMobile} className={`flex items-center gap-3 mx-2 mb-0.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-[#6599FE] text-white' : 'text-white/60 hover:bg-[#2D5BE4] hover:text-white/90'}`}>
                <item.icon size={20} className="shrink-0" />
                <span className={`whitespace-nowrap ${collapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-white/10 p-3">
          <div className={`flex items-center gap-3 mb-3 px-2 ${collapsed ? 'lg:hidden' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-[#ECA423] flex items-center justify-center text-xs font-bold text-white shrink-0">مد</div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold truncate">مشرف عام</p>
              <p className="text-[10px] text-white/50 truncate">admin@mawared.sa</p>
            </div>
          </div>
          <button onClick={logout} className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-all text-sm ${collapsed ? 'lg:justify-center' : ''}`}>
            <LogOut size={18} className="shrink-0" />
            <span className={collapsed ? 'lg:hidden' : ''}>تسجيل الخروج</span>
          </button>
        </div>

        {/* Collapse Toggle — lg+ only (the mobile drawer uses the X button) */}
        <button
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'توسيع القائمة' : 'طي القائمة'}
          className="hidden lg:flex absolute -left-3 top-20 w-6 h-6 rounded-full bg-[#2D5BE4] border-2 border-[#F7F6F2] items-center justify-center text-white hover:bg-[#6599FE] transition-colors z-10"
        >
          {collapsed ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
        </button>
      </aside>
    </>
  );
}
