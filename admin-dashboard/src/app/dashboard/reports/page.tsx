'use client';

import { useMemo, useState } from 'react';
import { ApiError, type OrderStatus } from '@mawared/api-client';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import PageHeader from '@/components/dashboard/PageHeader';
import { formatMoneyMinor } from '@/lib/utils';
import { backendStatusDisplay } from '@/lib/order-status';
import {
  useAdminActiveWorkers,
  useAdminOrdersByStatus,
  useAdminRefunds,
  useAdminRevenue,
} from '@/lib/hooks/use-admin-reports';

/**
 * Reports page — real backend version.
 *
 * Date range applied to every chart. Defaults to "last 30 days".
 *  - GET /v1/admin/reports/revenue        — daily gross/net by currency
 *  - GET /v1/admin/reports/orders         — counts by status in window
 *  - GET /v1/admin/reports/refunds        — refund counts + rates by currency
 *  - GET /v1/admin/reports/active-workers — fleet breakdown (no date filter)
 */
export default function ReportsPage() {
  const [from, setFrom] = useState(() => isoDaysAgo(30));
  const [to, setTo] = useState(() => isoToday());

  const revenueQuery = useAdminRevenue(from, to);
  const ordersQuery = useAdminOrdersByStatus(from, to);
  const refundsQuery = useAdminRefunds(from, to);
  const workersQuery = useAdminActiveWorkers();

  // ---- Derived data ----

  const revenueByDay = useMemo(() => {
    const map = new Map<string, { gross: number; net: number }>();
    for (const r of revenueQuery.data?.items ?? []) {
      const key = new Date(r.day).toISOString().slice(0, 10);
      const prev = map.get(key) ?? { gross: 0, net: 0 };
      map.set(key, {
        gross: prev.gross + Number(r.grossMinor),
        net: prev.net + Number(r.netMinor),
      });
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, v]) => ({
        day,
        label: new Date(day).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' }),
        gross: v.gross,
        net: v.net,
      }));
  }, [revenueQuery.data]);

  const ordersData = useMemo(() => {
    return (ordersQuery.data?.items ?? []).map((r) => ({
      status: r.status,
      labelAr: backendStatusDisplay[r.status]?.labelAr ?? r.status,
      count: r.count,
      color: STATUS_COLORS[r.status] ?? '#9CA3AF',
    }));
  }, [ordersQuery.data]);

  const nationalityData = useMemo(() => {
    return (workersQuery.data?.byNationality ?? []).slice(0, 8).map((r) => ({
      nationality: `${r.flagEmoji} ${r.nameAr}`,
      count: r.count,
    }));
  }, [workersQuery.data]);

  const summary = useMemo(() => {
    const revRows = revenueQuery.data?.items ?? [];
    const totalGross = revRows.reduce((s, r) => s + Number(r.grossMinor), 0);
    const totalNet = revRows.reduce((s, r) => s + Number(r.netMinor), 0);
    const totalOrders = revRows.reduce((s, r) => s + r.orderCount, 0);
    const avgOrderMinor = totalOrders > 0 ? totalGross / totalOrders : 0;
    const refundRow = refundsQuery.data?.items[0];
    return {
      totalGross,
      totalNet,
      totalOrders,
      avgOrderMinor,
      refundRate: refundRow?.refundRate ?? 0,
      refundCount: refundRow?.refundCount ?? 0,
      refundMinor: Number(refundRow?.refundMinor ?? '0'),
    };
  }, [revenueQuery.data, refundsQuery.data]);

  const isLoading =
    revenueQuery.isPending ||
    ordersQuery.isPending ||
    refundsQuery.isPending ||
    workersQuery.isPending;

  const anyError =
    revenueQuery.isError || ordersQuery.isError || refundsQuery.isError || workersQuery.isError;

  return (
    <div>
      <PageHeader title="التقارير والإحصائيات" subtitle="مدعومة بـ /v1/admin/reports" />

      {/* Date controls */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4 flex flex-wrap gap-3 items-center text-sm">
        <label className="text-gray-500">من</label>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="min-w-0 flex-1 sm:flex-none px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50"
        />
        <label className="text-gray-500">إلى</label>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="min-w-0 flex-1 sm:flex-none px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50"
        />
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => {
                setFrom(p.from());
                setTo(isoToday());
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {anyError && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-4 text-sm text-red-700">
          {extractError(revenueQuery.error ?? ordersQuery.error ?? refundsQuery.error ?? workersQuery.error)}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          label="إجمالي الإيرادات"
          value={formatMoneyMinor(String(summary.totalGross), 'SAR')}
          hint="قبل المرتجعات"
          loading={isLoading}
        />
        <SummaryCard
          label="صافي الإيرادات"
          value={formatMoneyMinor(String(summary.totalNet), 'SAR')}
          hint="بعد المرتجعات"
          loading={isLoading}
        />
        <SummaryCard
          label="عدد الطلبات"
          value={summary.totalOrders.toLocaleString('ar-SA')}
          hint="طلبات مدفوعة فأكثر"
          loading={isLoading}
        />
        <SummaryCard
          label="متوسط قيمة الطلب"
          value={formatMoneyMinor(String(Math.round(summary.avgOrderMinor)), 'SAR')}
          hint=""
          loading={isLoading}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {/* Revenue area */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-1">الإيرادات اليومية</h3>
          <p className="text-xs text-gray-400 mb-4">إجمالي vs صافي</p>
          {isLoading ? (
            <div className="h-[250px] bg-gray-50 rounded-xl animate-pulse" />
          ) : revenueByDay.length === 0 ? (
            <EmptyChart label="لا توجد إيرادات في هذه الفترة" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={revenueByDay}>
                <defs>
                  <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ECA423" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#ECA423" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2D5BE4" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2D5BE4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="label" tick={{ fontFamily: 'Alexandria', fontSize: 11 }} />
                <YAxis
                  tick={{ fontFamily: 'Alexandria', fontSize: 11 }}
                  tickFormatter={(v) => `${Math.round(v / 100).toLocaleString('ar-SA')}`}
                />
                <Tooltip
                  contentStyle={{ fontFamily: 'Alexandria', borderRadius: 8 }}
                  formatter={(v: number, name) => [
                    formatMoneyMinor(String(v), 'SAR'),
                    name === 'gross' ? 'إجمالي' : 'صافي',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="gross"
                  fill="url(#grossGrad)"
                  stroke="#ECA423"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="net"
                  fill="url(#netGrad)"
                  stroke="#2D5BE4"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Orders by status */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-1">الطلبات حسب الحالة</h3>
          <p className="text-xs text-gray-400 mb-4">في الفترة المختارة</p>
          {isLoading ? (
            <div className="h-[250px] bg-gray-50 rounded-xl animate-pulse" />
          ) : ordersData.length === 0 ? (
            <EmptyChart label="لا توجد طلبات في هذه الفترة" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={ordersData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="count"
                  label={(props) =>
                    `${(props as unknown as { labelAr: string }).labelAr} (${(props as unknown as { count: number }).count})`
                  }
                  labelLine={false}
                >
                  {ordersData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontFamily: 'Alexandria' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Nationalities */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-1">توزيع الجنسيات</h3>
          <p className="text-xs text-gray-400 mb-4">حسب عدد العمال النشطين</p>
          {workersQuery.isPending ? (
            <div className="h-[220px] bg-gray-50 rounded-xl animate-pulse" />
          ) : nationalityData.length === 0 ? (
            <EmptyChart label="لا يوجد عمال نشطون" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={nationalityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" tick={{ fontFamily: 'Alexandria', fontSize: 11 }} />
                <YAxis
                  dataKey="nationality"
                  type="category"
                  tick={{ fontFamily: 'Alexandria', fontSize: 11 }}
                  width={110}
                />
                <Tooltip contentStyle={{ fontFamily: 'Alexandria', borderRadius: 8 }} />
                <Bar dataKey="count" fill="#2D5BE4" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Refund details */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-1">المرتجعات</h3>
          <p className="text-xs text-gray-400 mb-4">في الفترة المختارة</p>
          {refundsQuery.isPending ? (
            <div className="h-[180px] bg-gray-50 rounded-xl animate-pulse" />
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">معدل الاسترداد</p>
                <p className="text-3xl font-black text-[#2D5BE4]">
                  {(summary.refundRate * 100).toFixed(1)}%
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">عدد المرتجعات</p>
                  <p className="text-lg font-bold">
                    {summary.refundCount.toLocaleString('ar-SA')}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">إجمالي المسترد</p>
                  <p className="text-lg font-bold">
                    {formatMoneyMinor(String(summary.refundMinor), 'SAR')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ====================================================================
// Helpers
// ====================================================================

function SummaryCard({
  label,
  value,
  hint,
  loading,
}: {
  label: string;
  value: string;
  hint: string;
  loading: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      {loading ? (
        <div className="h-7 bg-gray-100 rounded animate-pulse w-32" />
      ) : (
        <p className="text-2xl font-black text-gray-900">{value}</p>
      )}
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm">
      {label}
    </div>
  );
}

function extractError(err: unknown): string {
  if (err instanceof ApiError) return `${err.code}: ${err.detail}`;
  if (err instanceof Error) return err.message;
  return 'خطأ غير معروف';
}

function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

const PRESETS = [
  { label: '7 أيام', from: () => isoDaysAgo(7) },
  { label: '30 يوم', from: () => isoDaysAgo(30) },
  { label: '90 يوم', from: () => isoDaysAgo(90) },
  { label: 'سنة', from: () => isoDaysAgo(365) },
] as const;

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
