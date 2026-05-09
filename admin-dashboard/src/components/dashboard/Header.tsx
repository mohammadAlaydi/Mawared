'use client';
import { usePathname } from 'next/navigation';
import { Bell, Search } from 'lucide-react';

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

export default function Header() {
  const pathname = usePathname();
  const title = pageTitles[pathname] || 'لوحة التحكم';

  return (
    <header className="h-16 bg-white border-b border-gray-100 px-6 flex items-center justify-between shrink-0 shadow-sm">
      <div>
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative hidden sm:block">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="البحث عن طلب، عميل..." className="w-64 pr-9 pl-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5E50]/20 focus:border-[#0B5E50]" />
        </div>
        <button className="relative w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
          <Bell size={18} />
          <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">3</span>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#C9A84C] flex items-center justify-center text-xs font-bold text-white">مد</div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-gray-900">مشرف عام</p>
            <p className="text-[10px] text-gray-400">admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}
