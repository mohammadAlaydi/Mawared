'use client';
import { useState } from 'react';
import { useDashboard } from '@/lib/dashboard-context';
import PageHeader from '@/components/dashboard/PageHeader';
import { formatDate } from '@/lib/utils';
import { Search } from 'lucide-react';
import { VerificationStatus } from '@/types';

const verifyConfig: Record<VerificationStatus, { label: string; cls: string }> = {
  verified: { label: 'معتمد', cls: 'bg-green-100 text-green-700' },
  pending: { label: 'قيد التحقق', cls: 'bg-yellow-100 text-yellow-700' },
  not_verified: { label: 'غير محقق', cls: 'bg-gray-100 text-gray-500' },
  failed: { label: 'فشل التحقق', cls: 'bg-red-100 text-red-700' },
};

export default function CustomersPage() {
  const { customers } = useDashboard();
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('all');

  const filtered = customers.filter(c => {
    const matchSearch = c.name.includes(search) || c.phone.includes(search);
    const matchCity = cityFilter === 'all' || c.city === cityFilter;
    return matchSearch && matchCity;
  });

  return (
    <div>
      <PageHeader title="إدارة العملاء" subtitle={`${customers.length} عميل`} />
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]"><Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم أو الجوال..." className="w-full pr-9 pl-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5E50]/20" /></div>
        <select value={cityFilter} onChange={e => setCityFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm"><option value="all">جميع المدن</option><option value="الرياض">الرياض</option><option value="جدة">جدة</option><option value="الدمام">الدمام</option></select>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50">
            <th className="text-right px-4 py-3 font-semibold text-gray-600">الاسم</th>
            <th className="text-right px-4 py-3 font-semibold text-gray-600">رقم الجوال</th>
            <th className="text-right px-4 py-3 font-semibold text-gray-600">المدينة</th>
            <th className="text-right px-4 py-3 font-semibold text-gray-600">عدد الطلبات</th>
            <th className="text-right px-4 py-3 font-semibold text-gray-600">حالة التحقق</th>
            <th className="text-right px-4 py-3 font-semibold text-gray-600">تاريخ التسجيل</th>
          </tr></thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3" dir="ltr">{c.phone}</td>
                <td className="px-4 py-3">{c.city}</td>
                <td className="px-4 py-3 font-bold">{c.totalOrders}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-lg text-xs font-semibold ${verifyConfig[c.verificationStatus].cls}`}>{verifyConfig[c.verificationStatus].label}</span></td>
                <td className="px-4 py-3 text-gray-500">{formatDate(c.joinedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
