'use client';
import { useDashboard } from '@/lib/dashboard-context';
import KpiCard from '@/components/dashboard/KpiCard';
import OrderStatusBadge from '@/components/dashboard/OrderStatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ClipboardList, Users, DollarSign, TrendingUp, Globe, Star, Clock } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { ordersOverTime, ordersByStatus } from '@/data/mockData';
import Link from 'next/link';

export default function DashboardPage() {
  const { orders, workers } = useDashboard();
  const availableWorkers = workers.filter(w => w.isAvailable).length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const todayOrders = 7;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="إجمالي الطلبات" value={orders.length} change="+12% هذا الشهر" changeType="up" icon={ClipboardList} iconColor="text-green-600" iconBg="bg-green-100" borderColor="border-r-green-500" />
        <KpiCard title="الطلبات الجديدة اليوم" value={todayOrders} change="+3 عن أمس" changeType="up" icon={TrendingUp} iconColor="text-blue-600" iconBg="bg-blue-100" borderColor="border-r-blue-500" />
        <KpiCard title="الإيرادات (ريال)" value={totalRevenue.toLocaleString('ar-SA')} change="+18% هذا الشهر" changeType="up" icon={DollarSign} iconColor="text-amber-600" iconBg="bg-amber-100" borderColor="border-r-amber-500" />
        <KpiCard title="العمال المتاحون" value={availableWorkers} change="من أصل {workers.length}" changeType="neutral" icon={Users} iconColor="text-teal-600" iconBg="bg-teal-100" borderColor="border-r-teal-500" />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Line Chart */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4">الطلبات خلال ٧ أشهر</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={ordersOverTime}>
              <defs>
                <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0B5E50" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0B5E50" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fontFamily: 'Cairo', fontSize: 12 }} />
              <YAxis tick={{ fontFamily: 'Cairo', fontSize: 12 }} />
              <Tooltip contentStyle={{ fontFamily: 'Cairo', borderRadius: '8px' }} formatter={(v: any) => [`${v} طلب`, 'الطلبات']} />
              <Area type="monotone" dataKey="orders" fill="url(#orderGrad)" stroke="#0B5E50" strokeWidth={2.5} dot={{ fill: '#0B5E50', r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Donut Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4">توزيع الطلبات حسب الحالة</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={ordersByStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="count" paddingAngle={3}>
                {ordersByStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ fontFamily: 'Cairo' }} formatter={(v: any) => [`${v} طلب`]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {ordersByStatus.map(s => (
              <div key={s.status} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-xs text-gray-600">{s.status} ({s.count})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">أحدث الطلبات</h3>
          <Link href="/dashboard/orders" className="text-sm font-medium text-[#0B5E50] hover:underline">عرض الكل ←</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-right px-5 py-3 font-semibold text-gray-600">رقم الطلب</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">العميل</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">الخدمة</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">المبلغ</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">الحالة</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 8).map(order => (
                <tr key={order.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3 font-semibold text-[#0B5E50]">{order.orderNumber}</td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{order.customerName}</p>
                    <p className="text-xs text-gray-400" dir="ltr">{order.customerPhone}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-700">{order.serviceType}</td>
                  <td className="px-5 py-3 font-bold text-gray-900">{formatCurrency(order.totalAmount)}</td>
                  <td className="px-5 py-3"><OrderStatusBadge status={order.status} /></td>
                  <td className="px-5 py-3 text-gray-500">{formatDate(order.placedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center"><Globe size={22} className="text-purple-600" /></div>
          <div><p className="text-xs text-gray-500">أكثر جنسية</p><p className="font-bold text-gray-900">فلبينية (٨ عمال)</p></div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center"><Star size={22} className="text-amber-600" /></div>
          <div><p className="text-xs text-gray-500">متوسط التقييم</p><p className="font-bold text-gray-900">٤.٧ من ٥</p></div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center"><Clock size={22} className="text-cyan-600" /></div>
          <div><p className="text-xs text-gray-500">متوسط وقت التنفيذ</p><p className="font-bold text-gray-900">٣.٢ يوم</p></div>
        </div>
      </div>
    </div>
  );
}
