'use client';

import { useMemo, useState } from 'react';
import { ApiError, type AdminPaymentIntent } from '@mawared/api-client';
import { ChevronLeft, ChevronRight, Clock, DollarSign, TrendingUp } from 'lucide-react';

import PageHeader from '@/components/dashboard/PageHeader';
import KpiCard from '@/components/dashboard/KpiCard';
import { formatDate, formatMoneyMinor } from '@/lib/utils';
import {
  PAYMENT_STATUSES,
  PAYMENT_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  useAdminPayments,
} from '@/lib/hooks/use-admin-payments';

/**
 * Payments page — real backend version.
 *
 * Read-only by design. Refunds happen through the order detail page
 * (POST /v1/admin/orders/:id/refund) because they're scoped to an order,
 * not a payment intent.
 *
 * Pagination is cursor-based. The summary KPIs reflect only the rows in
 * the current page — accurate aggregates require dedicated reporting
 * endpoints (tracked under /v1/admin/reports).
 */
export default function PaymentsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [cursorStack, setCursorStack] = useState<Array<string | undefined>>([]);

  const query = useAdminPayments({
    status: statusFilter === 'all' ? undefined : statusFilter,
    from: from || undefined,
    to: to || undefined,
    cursor,
    limit: 20,
  });

  const payments: AdminPaymentIntent[] = useMemo(
    () => query.data?.items ?? [],
    [query.data],
  );

  // Page-local aggregates. Calling these out as "in current page" so
  // admins don't mistake them for global revenue numbers.
  const pageTotals = useMemo(() => {
    let succeeded = 0n;
    let pending = 0n;
    let total = 0n;
    for (const p of payments) {
      const amount = BigInt(p.amountMinor);
      total += amount;
      if (p.status === 'SUCCEEDED') succeeded += amount;
      else if (
        p.status === 'PROCESSING' ||
        p.status === 'REQUIRES_PAYMENT_METHOD' ||
        p.status === 'REQUIRES_CONFIRMATION' ||
        p.status === 'REQUIRES_ACTION'
      ) {
        pending += amount;
      }
    }
    const currency = payments[0]?.currency ?? 'SAR';
    return {
      total: formatMoneyMinor(String(total), currency),
      succeeded: formatMoneyMinor(String(succeeded), currency),
      pending: formatMoneyMinor(String(pending), currency),
    };
  }, [payments]);

  const goNext = () => {
    const next = query.data?.nextCursor;
    if (!next) return;
    setCursorStack((stack) => [...stack, cursor]);
    setCursor(next);
  };

  const goPrev = () => {
    setCursorStack((stack) => {
      if (stack.length === 0) return stack;
      const next = [...stack];
      const prev = next.pop();
      setCursor(prev);
      return next;
    });
  };

  const resetFilters = () => {
    setStatusFilter('all');
    setFrom('');
    setTo('');
    setCursor(undefined);
    setCursorStack([]);
  };

  return (
    <div>
      <PageHeader
        title="المدفوعات"
        subtitle="معاملات Stripe — للقراءة فقط. الاسترداد يتم من تفاصيل الطلب."
      />

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <KpiCard
          title="إجمالي هذه الصفحة"
          value={pageTotals.total}
          change=""
          changeType="neutral"
          icon={DollarSign}
          iconColor="text-green-600"
          iconBg="bg-green-100"
          borderColor="border-r-green-500"
        />
        <KpiCard
          title="ناجحة (هذه الصفحة)"
          value={pageTotals.succeeded}
          change=""
          changeType="up"
          icon={TrendingUp}
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
          borderColor="border-r-blue-500"
        />
        <KpiCard
          title="قيد المعالجة"
          value={pageTotals.pending}
          change=""
          changeType="down"
          icon={Clock}
          iconColor="text-amber-600"
          iconBg="bg-amber-100"
          borderColor="border-r-amber-500"
        />
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4 flex flex-wrap gap-3 items-center">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCursor(undefined);
            setCursorStack([]);
          }}
          className="px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm"
        >
          <option value="all">جميع الحالات</option>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {PAYMENT_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2 text-sm">
          <label className="text-gray-500">من</label>
          <input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setCursor(undefined);
              setCursorStack([]);
            }}
            className="px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50"
          />
          <label className="text-gray-500">إلى</label>
          <input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setCursor(undefined);
              setCursorStack([]);
            }}
            className="px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50"
          />
        </div>
        <button onClick={resetFilters} className="text-sm text-gray-500 hover:text-[#0B5E50]">
          إعادة تعيين
        </button>
        {query.isFetching && (
          <span className="text-xs text-gray-400 mr-auto inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#0B5E50] animate-pulse" />
            تحديث...
          </span>
        )}
      </div>

      {query.isError && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 mb-4 text-center">
          <p className="text-red-700 font-semibold mb-2">تعذّر تحميل المدفوعات.</p>
          <p className="text-red-600 text-sm mb-4">
            {query.error instanceof ApiError
              ? `${query.error.code}: ${query.error.detail}`
              : query.error instanceof Error
                ? query.error.message
                : 'خطأ غير معروف'}
          </p>
          <button
            onClick={() => query.refetch()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-right px-4 py-3 font-semibold text-gray-600">معاملة #</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">رقم الطلب</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Stripe ID</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">المبلغ</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">الحالة</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">تاريخ الإنشاء</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">تاريخ الدفع</th>
              </tr>
            </thead>
            <tbody>
              {query.isPending && <SkeletonRows cols={7} />}
              {!query.isPending &&
                payments.map((p) => (
                  <tr key={p.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono text-[#0B5E50]">
                      {p.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 font-mono" dir="ltr">
                      {p.orderId.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500" dir="ltr">
                      {p.providerIntentId}
                    </td>
                    <td className="px-4 py-3 font-bold">
                      {formatMoneyMinor(p.amountMinor, p.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-semibold ${PAYMENT_STATUS_COLORS[p.status] ?? 'bg-gray-100 text-gray-600'}`}
                      >
                        {PAYMENT_STATUS_LABELS[p.status] ?? p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(p.createdAt)}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {p.paidAt ? formatDate(p.paidAt) : '—'}
                    </td>
                  </tr>
                ))}
              {!query.isPending && !query.isError && payments.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    لا توجد معاملات دفع تطابق المعايير الحالية
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!query.isPending && (
          <div className="flex items-center justify-between gap-2 p-4 border-t border-gray-100">
            <button
              onClick={goPrev}
              disabled={cursorStack.length === 0}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={14} />
              السابق
            </button>
            <span className="text-xs text-gray-400">صفحة {cursorStack.length + 1}</span>
            <button
              onClick={goNext}
              disabled={!query.data?.nextCursor}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-[#0B5E50] text-white hover:bg-[#073D34] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              التالي
              <ChevronLeft size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SkeletonRows({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-t border-gray-50">
          {Array.from({ length: cols }).map((__, j) => (
            <td key={j} className="px-4 py-4">
              <div className="h-3 bg-gray-100 rounded animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
