'use client';
import { useDashboard } from '@/lib/dashboard-context';
import PageHeader from '@/components/dashboard/PageHeader';
import KpiCard from '@/components/dashboard/KpiCard';
import { formatCurrency, formatDate } from '@/lib/utils';
import { DollarSign, TrendingUp, Clock, Download } from 'lucide-react';

const payStatusConfig: Record<string, { label: string; cls: string }> = {
  completed: { label: 'مكتمل', cls: 'bg-green-100 text-green-700' },
  pending: { label: 'معلق', cls: 'bg-yellow-100 text-yellow-700' },
  failed: { label: 'فشل', cls: 'bg-red-100 text-red-700' },
  refunded: { label: 'مسترد', cls: 'bg-purple-100 text-purple-700' },
};

export default function PaymentsPage() {
  const { payments } = useDashboard();
  const total = payments.reduce((s, p) => s + p.amount, 0);
  const completed = payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0);
  const pending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <PageHeader title="المدفوعات" actions={<button className="flex items-center gap-2 px-4 py-2 bg-[#0B5E50] text-white rounded-xl text-sm font-semibold hover:bg-[#073D34]"><Download size={16} />تصدير كشف حساب</button>} />
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <KpiCard title="إجمالي الإيرادات" value={total.toLocaleString('ar-SA')} change="+18%" changeType="up" icon={DollarSign} iconColor="text-green-600" iconBg="bg-green-100" borderColor="border-r-green-500" />
        <KpiCard title="مدفوعات مكتملة" value={completed.toLocaleString('ar-SA')} change="ريال" changeType="neutral" icon={TrendingUp} iconColor="text-blue-600" iconBg="bg-blue-100" borderColor="border-r-blue-500" />
        <KpiCard title="مدفوعات معلقة" value={pending.toLocaleString('ar-SA')} change="ريال" changeType="down" icon={Clock} iconColor="text-amber-600" iconBg="bg-amber-100" borderColor="border-r-amber-500" />
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50">
            <th className="text-right px-4 py-3 font-semibold text-gray-600">المعاملة #</th>
            <th className="text-right px-4 py-3 font-semibold text-gray-600">رقم الطلب</th>
            <th className="text-right px-4 py-3 font-semibold text-gray-600">العميل</th>
            <th className="text-right px-4 py-3 font-semibold text-gray-600">المبلغ</th>
            <th className="text-right px-4 py-3 font-semibold text-gray-600">طريقة الدفع</th>
            <th className="text-right px-4 py-3 font-semibold text-gray-600">الحالة</th>
            <th className="text-right px-4 py-3 font-semibold text-gray-600">التاريخ</th>
          </tr></thead>
          <tbody>
            {payments.map(p => (
              <tr key={p.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                <td className="px-4 py-3 font-mono text-[#0B5E50]">PAY-{p.id.padStart(4, '0')}</td>
                <td className="px-4 py-3 font-medium">{p.orderNumber}</td>
                <td className="px-4 py-3">{p.customerName}</td>
                <td className="px-4 py-3 font-bold">{formatCurrency(p.amount)}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 bg-gray-100 rounded-lg text-xs">{p.method}</span></td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-lg text-xs font-semibold ${payStatusConfig[p.status].cls}`}>{payStatusConfig[p.status].label}</span></td>
                <td className="px-4 py-3 text-gray-500">{formatDate(p.paidAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
