'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ApiError, type OrderStatus } from '@mawared/api-client';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ChevronLeft,
  ClipboardList,
  DollarSign,
  Globe,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';

import KpiCard from '@/components/dashboard/KpiCard';
import OrderStatusBadge from '@/components/dashboard/OrderStatusBadge';
import { formatDate, formatMoneyMinor, shortOrderRef } from '@/lib/utils';
import { backendStatusDisplay } from '@/lib/order-status';
import {
  useAdminActiveWorkers,
  useAdminOverview,
} from '@/lib/hooks/use-admin-reports';

/**
 * Dashboard home — real backend version.
 *
 * Data sources:
 *   GET /v1/admin/reports/overview         — KPIs, 30-day revenue, recent orders
 *   GET /v1/admin/reports/active-workers   — fleet breakdown by availability + nationality
 *
 * Branch managers are scoped to their branch server-side; this page passes
 * no branchId override.
 */
export default function DashboardPage() {
  const overviewQuery = useAdminOverview();
  const workersQuery = useAdminActiveWorkers();

  const overview = overviewQuery.data;
  const workers = workersQuery.data;

  // -------- KPIs --------
  const revenueByCurrency = useMemo(() => {
    if (!overview) return { yesterday: '—', delta: null as null | { pct: number; up: boolean } };
    const today = overview.revenue.yesterday[0];
    const prev = overview.revenue.dayBefore[0];
    if (!today)
      return {
        yesterday: formatMoneyMinor('0', 'SAR'),
        delta: null,
      };
    const yesterdayMinor = Number(today.minor);
    const prevMinor = prev ? Number(prev.minor) : 0;
    const delta =
      prevMinor === 0
        ? null
        : {
            pct: Math.round(((yesterdayMinor - prevMinor) / prevMinor) * 100),
            up: yesterdayMinor >= prevMinor,
          };
    return {
      yesterday: formatMoneyMinor(today.minor, today.currency),
      delta,
    };
  }, [overview]);

  const totalOrders = useMemo(
    () => overview?.ordersByStatus.reduce((s, x) => s + x.count, 0) ?? 0,
    [overview],
  );

  const availableWorkers = useMemo(() => {
    const row = workers?.byAvailability.find((r) => r.availability === 'AVAILABLE');
    return row?.count ?? 0;
  }, [workers]);

  // -------- Chart data --------
  const revenueSeries = useMemo(() => {
    if (!overview) return [] as Array<{ day: string; minor: number; label: string }>;
    // Group by day, sum across currencies (display will note SAR if mixed currencies exist).
    const map = new Map<string, number>();
    for (const r of overview.revenue.last30Days) {
      const key = new Date(r.day).toISOString().slice(0, 10);
      map.set(key, (map.get(key) ?? 0) + Number(r.minor));
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, minor]) => ({
        day,
        minor,
        label: new Date(day).toLocaleDateString('ar-SA', {
          day: 'numeric',
          month: 'short',
        }),
      }));
  }, [overview]);

  const statusSlices = useMemo(() => {
    if (!overview) return [];
    return overview.ordersByStatus
      .filter((r) => r.count > 0)
      .map((r) => ({
        status: r.status,
        count: r.count,
        labelAr: backendStatusDisplay[r.status]?.labelAr ?? r.status,
        color: STATUS_COLORS[r.status] ?? '#9CA3AF',
      }));
  }, [overview]);

  const topNationality = useMemo(() => {
    if (!workers) return null;
    return workers.byNationality[0] ?? null;
  }, [workers]);

  // -------- Render --------
  if (overviewQuery.isError || workersQuery.isError) {
    const err = overviewQuery.error ?? workersQuery.error;
    return (
      <div className="bg-red-50 border border-red-100 rounded-2xl p-6 mt-12 text-center max-w-xl mx-auto">
        <p className="text-red-700 font-semibold mb-2">تعذّر تحميل ملخّص اللوحة.</p>
        <p className="text-red-600 text-sm mb-4">
          {err instanceof ApiError
            ? `${err.code}: ${err.detail}`
            : err instanceof Error
              ? err.message
              : 'خطأ غير معروف'}
        </p>
        <button
          onClick={() => {
            overviewQuery.refetch();
            workersQuery.refetch();
          }}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const isLoading = overviewQuery.isPending || workersQuery.isPending;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="إجمالي الطلبات"
          value={isLoading ? '...' : totalOrders.toLocaleString('ar-SA')}
          change="تشمل كل الحالات"
          changeType="neutral"
          icon={ClipboardList}
          iconColor="text-green-500"
          iconBg="bg-green-500/10"
          borderColor="border-r-green-500"
        />
        <KpiCard
          title="إيرادات الأمس"
          value={isLoading ? '...' : revenueByCurrency.yesterday}
          change={
            revenueByCurrency.delta
              ? `${revenueByCurrency.delta.up ? '+' : ''}${revenueByCurrency.delta.pct}% عن أول من أمس`
              : 'لا توجد بيانات سابقة'
          }
          changeType={revenueByCurrency.delta?.up ? 'up' : 'down'}
          icon={DollarSign}
          iconColor="text-amber-600"
          iconBg="bg-amber-100"
          borderColor="border-r-amber-500"
        />
        <KpiCard
          title="عملاء جدد (30 يوم)"
          value={isLoading ? '...' : (overview?.newCustomers30d ?? 0).toLocaleString('ar-SA')}
          change="آخر 30 يوم"
          changeType="up"
          icon={TrendingUp}
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
          borderColor="border-r-blue-500"
        />
        <KpiCard
          title="عمال متاحون"
          value={isLoading ? '...' : availableWorkers.toLocaleString('ar-SA')}
          change={workers ? `من أصل ${workers.total}` : ''}
          changeType="neutral"
          icon={Users}
          iconColor="text-brand-500"
          iconBg="bg-brand-300/10"
          borderColor="border-r-brand-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Revenue Area Chart */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4">إيرادات آخر 30 يوم</h3>
          {isLoading ? (
            <div className="h-[280px] bg-gray-50 rounded-xl animate-pulse" />
          ) : revenueSeries.length === 0 ? (
            <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">
              لا توجد إيرادات في آخر 30 يوم
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueSeries}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2D5BE4" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2D5BE4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="label" tick={{ fontFamily: 'Alexandria', fontSize: 11 }} />
                <YAxis
                  tick={{ fontFamily: 'Alexandria', fontSize: 11 }}
                  tickFormatter={(v) => `${Math.round(v / 100).toLocaleString('ar-SA')} ر.س`}
                />
                <Tooltip
                  contentStyle={{ fontFamily: 'Alexandria', borderRadius: '8px' }}
                  formatter={(v: number) => [formatMoneyMinor(String(v), 'SAR'), 'إيرادات']}
                />
                <Area
                  type="monotone"
                  dataKey="minor"
                  fill="url(#revGrad)"
                  stroke="#2D5BE4"
                  strokeWidth={2.5}
                  dot={{ fill: '#2D5BE4', r: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Order Status Donut */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4">توزيع الطلبات حسب الحالة</h3>
          {isLoading ? (
            <div className="h-[200px] bg-gray-50 rounded-xl animate-pulse" />
          ) : statusSlices.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
              لا توجد طلبات بعد
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusSlices}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    dataKey="count"
                    nameKey="labelAr"
                    paddingAngle={3}
                  >
                    {statusSlices.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontFamily: 'Alexandria' }}
                    formatter={(v: number) => [`${v} طلب`]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {statusSlices.map((s) => (
                  <div key={s.status} className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="text-xs text-gray-600">
                      {s.labelAr} ({s.count})
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">أحدث الطلبات</h3>
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center gap-1 text-sm font-medium text-[#2D5BE4] hover:underline"
          >
            عرض الكل
            <ChevronLeft size={14} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-right px-5 py-3 font-semibold text-gray-600">رقم الطلب</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">العميل</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">المبلغ</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">الحالة</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600 hidden md:table-cell">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-gray-50">
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-3 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))}
              {!isLoading &&
                overview?.recentOrders.map((o) => (
                  <tr
                    key={o.id}
                    className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-5 py-3 font-semibold text-[#2D5BE4]">
                      {shortOrderRef(null, o.id)}
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{o.customerName ?? '—'}</p>
                      <p className="text-xs text-gray-400" dir="ltr">
                        {o.customerPhone ?? ''}
                      </p>
                    </td>
                    <td className="px-5 py-3 font-bold text-gray-900">
                      {formatMoneyMinor(o.totalMinor, o.currency)}
                    </td>
                    <td className="px-5 py-3">
                      <OrderStatusBadge status={o.status} />
                    </td>
                    <td className="px-5 py-3 text-gray-500 hidden md:table-cell">{formatDate(o.createdAt)}</td>
                  </tr>
                ))}
              {!isLoading && (overview?.recentOrders.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-gray-400">
                    لا توجد طلبات بعد
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-300/10 flex items-center justify-center">
            <Globe size={22} className="text-brand-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">أكثر جنسية</p>
            <p className="font-bold text-gray-900">
              {topNationality
                ? `${topNationality.flagEmoji} ${topNationality.nameAr} (${topNationality.count})`
                : '—'}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent-400/10 flex items-center justify-center">
            <Star size={22} className="text-accent-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500">عمال محجوزون</p>
            <p className="font-bold text-gray-900">
              {workers?.byAvailability.find((r) => r.availability === 'BOOKED')?.count ?? 0}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-300/10 flex items-center justify-center">
            <Users size={22} className="text-brand-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">إجمالي الأسطول</p>
            <p className="font-bold text-gray-900">{workers?.total ?? 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Color palette for the order-status donut. Maps to the same hues as
// the chips on /orders, so the dashboard feels consistent.
const STATUS_COLORS: Record<OrderStatus, string> = {
  DRAFT: '#9CA3AF',
  RESERVED: '#F59E0B',
  PAYMENT_PENDING: '#EAB308',
  PAYMENT_FAILED: '#EF4444',
  PAID: '#14B8A6',
  UNDER_REVIEW: '#A855F7',
  CONFIRMED: '#6366F1',
  IN_PROGRESS: '#06B6D4',
  COMPLETED: '#22C55E',
  CANCELLED: '#EF4444',
  REFUNDED: '#F97316',
};
