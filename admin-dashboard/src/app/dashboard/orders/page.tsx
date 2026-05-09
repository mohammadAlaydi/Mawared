'use client';
import { useState } from 'react';
import { useDashboard } from '@/lib/dashboard-context';
import PageHeader from '@/components/dashboard/PageHeader';
import OrderStatusBadge, { statusConfig } from '@/components/dashboard/OrderStatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Download, Search, RefreshCw } from 'lucide-react';
import { OrderStatus } from '@/types';
import { toast } from 'sonner';

export default function OrdersPage() {
  const { orders, updateOrderStatus } = useDashboard();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [modalOrder, setModalOrder] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>('submitted');
  const perPage = 10;

  const filtered = orders.filter(o => {
    const matchSearch = o.orderNumber.includes(search) || o.customerName.includes(search);
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchCity = cityFilter === 'all' || o.city === cityFilter;
    return matchSearch && matchStatus && matchCity;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handleUpdateStatus = () => {
    if (modalOrder) {
      updateOrderStatus(modalOrder, newStatus);
      toast.success('تم تحديث حالة الطلب بنجاح');
      setModalOrder(null);
    }
  };

  const allStatuses: OrderStatus[] = ['submitted', 'payment_pending', 'payment_completed', 'under_review', 'processing', 'worker_selected', 'contract_in_progress', 'arrival_in_progress', 'completed', 'cancelled'];

  return (
    <div>
      <PageHeader title="إدارة الطلبات" subtitle={`${orders.length} طلب إجمالاً`} actions={<button className="flex items-center gap-2 px-4 py-2 bg-[#0B5E50] text-white rounded-xl text-sm font-semibold hover:bg-[#073D34] transition-colors"><Download size={16} />تصدير Excel</button>} />

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="بحث برقم الطلب أو اسم العميل..." className="w-full pr-9 pl-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5E50]/20" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm">
          <option value="all">جميع الحالات</option>
          {allStatuses.map(s => <option key={s} value={s}>{statusConfig[s].labelAr}</option>)}
        </select>
        <select value={cityFilter} onChange={e => { setCityFilter(e.target.value); setPage(1); }} className="px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm">
          <option value="all">جميع المدن</option>
          <option value="الرياض">الرياض</option>
          <option value="جدة">جدة</option>
          <option value="الدمام">الدمام</option>
        </select>
        <button onClick={() => { setSearch(''); setStatusFilter('all'); setCityFilter('all'); setPage(1); }} className="text-sm text-gray-500 hover:text-[#0B5E50]">إعادة تعيين</button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50">
              <th className="text-right px-4 py-3 font-semibold text-gray-600">رقم الطلب</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">العميل</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">الخدمة</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">الباقة</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">العامل</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">المبلغ</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">الحالة</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">التاريخ</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">إجراءات</th>
            </tr></thead>
            <tbody>
              {paginated.map(order => (
                <tr key={order.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-semibold text-[#0B5E50]">{order.orderNumber}</td>
                  <td className="px-4 py-3"><p className="font-medium">{order.customerName}</p><p className="text-xs text-gray-400" dir="ltr">{order.customerPhone}</p></td>
                  <td className="px-4 py-3">{order.serviceType}</td>
                  <td className="px-4 py-3 text-gray-600">{order.packageName}</td>
                  <td className="px-4 py-3">{order.workerName || <span className="text-gray-400">—</span>}</td>
                  <td className="px-4 py-3 font-bold">{formatCurrency(order.totalAmount)}</td>
                  <td className="px-4 py-3"><OrderStatusBadge status={order.status} /></td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(order.placedAt)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => { setModalOrder(order.id); setNewStatus(order.status); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-[#0B5E50]" title="تحديث الحالة"><RefreshCw size={15} /></button>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && <tr><td colSpan={9} className="text-center py-12 text-gray-400">لا توجد نتائج</td></tr>}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-100">
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} className={`w-8 h-8 rounded-lg text-sm font-medium ${page === i + 1 ? 'bg-[#0B5E50] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{i + 1}</button>
            ))}
          </div>
        )}
      </div>

      {/* Update Status Modal */}
      {modalOrder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setModalOrder(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">تحديث حالة الطلب</h3>
            <p className="text-sm text-gray-500 mb-4">{orders.find(o => o.id === modalOrder)?.orderNumber}</p>
            <select value={newStatus} onChange={e => setNewStatus(e.target.value as OrderStatus)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 mb-4 text-sm">
              {allStatuses.map(s => <option key={s} value={s}>{statusConfig[s].labelAr}</option>)}
            </select>
            <div className="flex gap-3">
              <button onClick={handleUpdateStatus} className="flex-1 py-2.5 bg-[#0B5E50] text-white rounded-xl font-semibold hover:bg-[#073D34]">تحديث الحالة</button>
              <button onClick={() => setModalOrder(null)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
