'use client';
import { usePathname } from 'next/navigation';
import { Search, Menu } from 'lucide-react';
import NotificationBell from './NotificationBell';

const pageTitles: Record<string, string> = {
  '/dashboard': 'لوحة التحكم',
  '/dashboard/orders': 'إدارة الطلبات',
  '/dashboard/workers': 'إدارة العمالة',
  '/dashboard/services': 'الخدمات',
  '/dashboard/packages': 'الباقات',
  '/dashboard/customers': 'العملاء',
  '/dashboard/payments': 'المدفوعات',
  '/dashboard/reports': 'التقارير',
  '/dashboard/settings': 'الإعدادات',
};

interface HeaderProps {
  onOpenMobileNav: () => void;
}

export default function Header({ onOpenMobileNav }: HeaderProps) {
  const pathname = usePathname();
  const title = pageTitles[pathname] || 'لوحة التحكم';

  return (
    <header className="h-16 bg-white border-b border-gray-100 px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0 shadow-sm">
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — opens the off-canvas nav on <lg */}
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="فتح القائمة"
          className="lg:hidden w-10 h-10 -ms-1 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
        >
          <Menu size={22} />
        </button>
        <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate">{title}</h1>
      </div>
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Search hides on very small screens to avoid crowding/overflow */}
        <div className="relative hidden md:block">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="البحث عن طلب، عميل..." className="w-48 lg:w-64 pr-9 pl-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5BE4]/20 focus:border-[#2D5BE4]" />
        </div>
        <NotificationBell />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#ECA423] flex items-center justify-center text-xs font-bold text-white shrink-0">مد</div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-gray-900">مشرف عام</p>
            <p className="text-[10px] text-gray-400">admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}
