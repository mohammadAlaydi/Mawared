'use client';
import PageHeader from '@/components/dashboard/PageHeader';
import { ordersOverTime, ordersByStatus, workersByNationality, revenueByMonth } from '@/data/mockData';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp } from 'lucide-react';

const COLORS = ['#0B5E50', '#C9A84C', '#1565C0', '#C62828'];

const serviceData = [
  { name: 'عاملة منزلية', count: 120 },
  { name: 'سائق خاص', count: 45 },
  { name: 'مربية أطفال', count: 32 },
  { name: 'رعاية مسنين', count: 16 },
];

const summaryStats = [
  { label: 'إجمالي الطلبات', value: '٢١٣', change: '+18%', up: true },
  { label: 'معدل إتمام الطلبات', value: '٨٩%', change: '+3%', up: true },
  { label: 'متوسط قيمة الطلب', value: '١,٤٠٠ ريال', change: '+5%', up: true },
  { label: 'عملاء جدد', value: '٣٤', change: '+22%', up: true },
];

export default function ReportsPage() {
  return (
    <div>
      <PageHeader title="التقارير والإحصائيات" />
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-1">الطلبات عبر الزمن</h3>
          <p className="text-xs text-gray-400 mb-4">آخر ٧ أشهر</p>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={ordersOverTime}>
              <defs><linearGradient id="og" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0B5E50" stopOpacity={0.15} /><stop offset="95%" stopColor="#0B5E50" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" /><XAxis dataKey="month" tick={{ fontFamily: 'Cairo', fontSize: 11 }} /><YAxis tick={{ fontFamily: 'Cairo', fontSize: 11 }} />
              <Tooltip contentStyle={{ fontFamily: 'Cairo', borderRadius: 8 }} /><Area type="monotone" dataKey="orders" fill="url(#og)" stroke="#0B5E50" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-1">الإيرادات الشهرية</h3>
          <p className="text-xs text-gray-400 mb-4">بالريال السعودي</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" /><XAxis dataKey="month" tick={{ fontFamily: 'Cairo', fontSize: 11 }} /><YAxis tick={{ fontFamily: 'Cairo', fontSize: 11 }} />
              <Tooltip contentStyle={{ fontFamily: 'Cairo', borderRadius: 8 }} formatter={(v: any) => [`${Number(v).toLocaleString('ar-SA')} ريال`]} /><Bar dataKey="revenue" fill="#C9A84C" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-1">توزيع الجنسيات</h3>
          <p className="text-xs text-gray-400 mb-4">حسب عدد العمال</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart><Pie data={workersByNationality} cx="50%" cy="50%" outerRadius={80} dataKey="count" label={(props: any) => `${props.nationality} (${props.count})`}>
              {workersByNationality.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie><Tooltip contentStyle={{ fontFamily: 'Cairo' }} /></PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-1">أكثر الخدمات طلباً</h3>
          <p className="text-xs text-gray-400 mb-4">حسب عدد الطلبات</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={serviceData} layout="vertical">
              <XAxis type="number" tick={{ fontFamily: 'Cairo', fontSize: 11 }} /><YAxis dataKey="name" type="category" tick={{ fontFamily: 'Cairo', fontSize: 11 }} width={90} />
              <Tooltip contentStyle={{ fontFamily: 'Cairo', borderRadius: 8 }} /><Bar dataKey="count" fill="#0B5E50" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50"><th className="text-right px-5 py-3 font-semibold text-gray-600">المقياس</th><th className="text-right px-5 py-3 font-semibold text-gray-600">القيمة</th><th className="text-right px-5 py-3 font-semibold text-gray-600">التغيير</th></tr></thead>
          <tbody>{summaryStats.map(s => (
            <tr key={s.label} className="border-t border-gray-50"><td className="px-5 py-3 font-medium">{s.label}</td><td className="px-5 py-3 font-bold">{s.value}</td><td className="px-5 py-3"><span className="flex items-center gap-1 text-green-600 text-sm font-medium"><TrendingUp size={14} />{s.change}</span></td></tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
