'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ApiError, type Order } from '@mawared/api-client';
import { ChevronLeft, ChevronRight, Download, Eye, RefreshCw, Search, X } from 'lucide-react';

import PageHeader from '@/components/dashboard/PageHeader';
import OrderStatusBadge from '@/components/dashboard/OrderStatusBadge';
import { formatDate, formatMoneyMinor, shortOrderRef } from '@/lib/utils';
import {
  BACKEND_ORDER_STATUSES,
  backendStatusDisplay,
  getLegalTransitions,
  type BackendOrderStatus,
  type TransitionEvent,
} from '@/lib/order-status';
import {
  useAdminOrder,
  useAdminOrders,
  useTransitionOrder,
} from '@/lib/hooks/use-admin-orders';

/**
 * Orders page — real-data version, calling /v1/admin/orders via TanStack Query.
 *
 * Differences from the old mock-driven page:
 *  - Pagination is cursor-based (backend is cursor-only). We keep a stack of
 *    cursors so the user can step backwards.
 *  - Server-side filters: status + customer phone (typed in E.164). The
 *    free-text search box is client-side for now since the backend doesn't
 *    have full-text search.
 *  - Status transitions are *events* not arbitrary status sets (matches the
 *    state machine in docs/backend/06-STATE_MACHINE.md). Only legal
 *    transitions for the current status are shown.
 */
export default function OrdersPage() {
  // Server-side filters
  const [statusFilter, setStatusFilter] = useState<BackendOrderStatus | 'all'>('all');
  const [phoneFilter, setPhoneFilter] = useState('');

  // Client-side helpers (don't hit the backend — just narrow the page in view)
  const [search, setSearch] = useState('');

  // Cursor-pagination state. We keep prev cursors on a stack so the user
  // can paginate backward without re-fetching from scratch.
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [cursorStack, setCursorStack] = useState<Array<string | undefined>>([]);

  // Modals
  const [statusModalId, setStatusModalId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const query = useAdminOrders({
    status: statusFilter === 'all' ? undefined : statusFilter,
    customerPhone: phoneFilter || undefined,
    cursor,
    limit: 20,
  });

  const orders: Order[] = useMemo(() => query.data?.items ?? [], [query.data]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return orders;
    return orders.filter((o) => {
      const ref = shortOrderRef(o.orderNumber, o.id).toLowerCase();
      const workerName = (o.worker?.fullNameAr ?? o.worker?.fullNameEn ?? '').toLowerCase();
      return ref.includes(s) || workerName.includes(s);
    });
  }, [orders, search]);

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
    setPhoneFilter('');
    setSearch('');
    setCursor(undefined);
    setCursorStack([]);
  };

  return (
    <div>
      <PageHeader
        title="إدارة الطلبات"
        subtitle={
          query.isPending
            ? 'جاري التحميل...'
            : query.isError
              ? 'تعذّر تحميل الطلبات'
              : `${orders.length} طلب في هذه الصفحة`
        }
        actions={
          <button
            disabled
            title="قريباً — لم يُربط بعد بنقطة /v1/admin/reports"
            className="flex items-center gap-2 px-4 py-2 bg-[#2D5BE4] text-white rounded-xl text-sm font-semibold opacity-60 cursor-not-allowed"
          >
            <Download size={16} />
            تصدير Excel
          </button>
        }
      />

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4 flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:items-center">
        <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالرقم المختصر أو اسم العامل (داخل الصفحة الحالية)"
            className="w-full pr-9 pl-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5BE4]/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            const v = e.target.value;
            setStatusFilter(v === 'all' ? 'all' : (v as BackendOrderStatus));
            setCursor(undefined);
            setCursorStack([]);
          }}
          className="w-full sm:w-auto px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm"
        >
          <option value="all">جميع الحالات</option>
          {BACKEND_ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {backendStatusDisplay[s].labelAr}
            </option>
          ))}
        </select>
        <input
          value={phoneFilter}
          onChange={(e) => {
            setPhoneFilter(e.target.value.trim());
            setCursor(undefined);
            setCursorStack([]);
          }}
          placeholder="+966..."
          dir="ltr"
          className="w-full sm:w-44 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-left"
        />
        <button
          onClick={resetFilters}
          className="text-sm text-gray-500 hover:text-[#2D5BE4] self-start sm:self-auto"
        >
          إعادة تعيين
        </button>
        {query.isFetching && (
          <span className="text-xs text-gray-400 mr-auto inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#2D5BE4] animate-pulse" />
            تحديث...
          </span>
        )}
      </div>

      {/* Error state */}
      {query.isError && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 mb-4 text-center">
          <p className="text-red-700 font-semibold mb-2">
            تعذّر تحميل الطلبات من الخادم.
          </p>
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

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-right px-4 py-3 font-semibold text-gray-600">الرقم</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">العميل</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">الباقة</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">العامل</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">المبلغ</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">الحالة</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">التاريخ</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {query.isPending && <OrderRowsSkeleton rows={6} />}

              {!query.isPending &&
                filtered.map((order) => (
                  <tr key={order.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-semibold text-[#2D5BE4]">
                      {shortOrderRef(order.orderNumber, order.id)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs text-gray-500" dir="ltr">
                        {order.customerId.slice(0, 8)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">
                      {order.package?.nameAr ?? order.package?.nameEn ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      {order.worker?.fullNameAr ?? order.worker?.fullNameEn ?? (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold">
                      {formatMoneyMinor(order.totalMinor, order.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setDetailId(order.id)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-[#2D5BE4]"
                          title="عرض التفاصيل"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => setStatusModalId(order.id)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-[#2D5BE4]"
                          title="تحديث الحالة"
                        >
                          <RefreshCw size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              {!query.isPending && !query.isError && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    لا توجد طلبات تطابق المعايير الحالية
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Cursor pagination */}
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
            <span className="text-xs text-gray-400">
              صفحة {cursorStack.length + 1}
            </span>
            <button
              onClick={goNext}
              disabled={!query.data?.nextCursor}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-[#2D5BE4] text-white hover:bg-[#0F234C] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              التالي
              <ChevronLeft size={14} />
            </button>
          </div>
        )}
      </div>

      {detailId && (
        <OrderDetailModal
          orderId={detailId}
          onClose={() => setDetailId(null)}
          onTransition={(id) => {
            setDetailId(null);
            setStatusModalId(id);
          }}
        />
      )}

      {statusModalId && (
        <TransitionModal
          orderId={statusModalId}
          onClose={() => setStatusModalId(null)}
        />
      )}
    </div>
  );
}

// ====================================================================
// Subcomponents
// ====================================================================

function OrderRowsSkeleton({ rows }: { rows: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-t border-gray-50">
          {Array.from({ length: 8 }).map((__, j) => (
            <td key={j} className="px-4 py-4">
              <div className="h-3 bg-gray-100 rounded animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function OrderDetailModal({
  orderId,
  onClose,
  onTransition,
}: {
  orderId: string;
  onClose: () => void;
  onTransition: (id: string) => void;
}) {
  const { data: order, isPending, isError, error } = useAdminOrder(orderId);

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">تفاصيل الطلب</h3>
          <button onClick={onClose} aria-label="إغلاق" className="p-1 rounded-lg hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {isPending && (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-[#2D5BE4] animate-spin" />
          </div>
        )}

        {isError && (
          <div className="py-8 text-center text-red-600 text-sm">
            {error instanceof ApiError ? error.detail : 'تعذّر تحميل الطلب.'}
          </div>
        )}

        {order && (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              <DetailCell label="الرقم" value={shortOrderRef(order.orderNumber, order.id)} mono />
              <DetailCell label="الحالة">
                <OrderStatusBadge status={order.status} />
              </DetailCell>
              <DetailCell label="الباقة" value={order.package?.nameAr ?? '—'} />
              <DetailCell
                label="العامل"
                value={order.worker?.fullNameAr ?? order.worker?.fullNameEn ?? '—'}
              />
              <DetailCell
                label="المبلغ الإجمالي"
                value={formatMoneyMinor(order.totalMinor, order.currency)}
              />
              <DetailCell
                label="الخصم"
                value={formatMoneyMinor(order.discountMinor, order.currency)}
              />
              <DetailCell
                label="الضريبة (VAT)"
                value={formatMoneyMinor(order.vatMinor, order.currency)}
              />
              <DetailCell label="تاريخ الإنشاء" value={formatDate(order.createdAt)} />
              <DetailCell label="تاريخ الطلب" value={formatDate(order.placedAt)} />
              <DetailCell label="تاريخ التأكيد" value={formatDate(order.confirmedAt)} />
              <DetailCell label="تاريخ الإتمام" value={formatDate(order.completedAt)} />
              <DetailCell label="تاريخ الإلغاء" value={formatDate(order.cancelledAt)} />
            </div>

            {order.statusHistory && order.statusHistory.length > 0 && (
              <div className="mt-5">
                <h4 className="text-sm font-bold mb-2">سجل الحالة</h4>
                <ol className="space-y-2">
                  {order.statusHistory.map((h) => (
                    <li
                      key={h.id}
                      className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        {h.fromStatus && <OrderStatusBadge status={h.fromStatus} />}
                        <span className="text-gray-400">←</span>
                        <OrderStatusBadge status={h.toStatus} />
                      </div>
                      <div className="text-gray-500">
                        <span className="ml-2">{h.actorType}</span>
                        <span>{formatDate(h.createdAt)}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => onTransition(order.id)}
                className="flex-1 py-2.5 bg-[#2D5BE4] text-white rounded-xl font-semibold hover:bg-[#0F234C]"
              >
                تحديث الحالة
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200"
              >
                إغلاق
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TransitionModal({
  orderId,
  onClose,
}: {
  orderId: string;
  onClose: () => void;
}) {
  const { data: order, isPending } = useAdminOrder(orderId);
  const transition = useTransitionOrder();
  const [note, setNote] = useState('');

  const transitions = order ? getLegalTransitions(order.status) : [];

  const handle = async (event: TransitionEvent) => {
    try {
      await transition.mutateAsync({
        orderId,
        event,
        note: note.trim() || undefined,
      });
      toast.success('تم تحديث حالة الطلب بنجاح');
      onClose();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.detail
          : err instanceof Error
            ? err.message
            : 'حدث خطأ';
      toast.error(message);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold mb-1">تحديث حالة الطلب</h3>
        {order && (
          <p className="text-sm text-gray-500 mb-4">
            {shortOrderRef(order.orderNumber, order.id)} —{' '}
            <OrderStatusBadge status={order.status} />
          </p>
        )}

        {isPending && (
          <div className="py-8 flex justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-[#2D5BE4] animate-spin" />
          </div>
        )}

        {order && (
          <>
            {transitions.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">
                لا توجد انتقالات متاحة من هذه الحالة.
              </p>
            ) : (
              <>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="ملاحظة (اختياري)"
                  maxLength={400}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 mb-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#2D5BE4]/20"
                />
                <div className="grid grid-cols-1 gap-2">
                  {transitions.map((t) => (
                    <button
                      key={t.event}
                      onClick={() => handle(t.event)}
                      disabled={transition.isPending}
                      className={`py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                        t.tone === 'success'
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : t.tone === 'danger'
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-[#2D5BE4] text-white hover:bg-[#0F234C]'
                      }`}
                    >
                      {transition.isPending ? 'جاري التحديث...' : t.labelAr}
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        <button
          onClick={onClose}
          disabled={transition.isPending}
          className="mt-3 w-full py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 disabled:opacity-60"
        >
          إغلاق
        </button>
      </div>
    </div>
  );
}

function DetailCell({
  label,
  value,
  children,
  mono,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      {children ?? (
        <p className={`font-semibold ${mono ? 'font-mono text-[#2D5BE4]' : ''}`}>{value}</p>
      )}
    </div>
  );
}
