'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ApiError, type AdminCustomer } from '@mawared/api-client';
import { ChevronLeft, ChevronRight, MoreVertical, Search } from 'lucide-react';

import PageHeader from '@/components/dashboard/PageHeader';
import { formatDate, formatMoneyMinor } from '@/lib/utils';
import {
  useAdminCustomers,
  useReactivateCustomer,
  useSuspendCustomer,
} from '@/lib/hooks/use-admin-customers';

/**
 * Customers page — real backend version.
 *
 * Cursor-paginated (20/page). Server-side phone substring filter via the
 * `q` query param. Verification status comes from the customer profile;
 * suspend/reactivate flips the User.isActive flag (and revokes sessions
 * on suspend).
 */
export default function CustomersPage() {
  const [phoneFilter, setPhoneFilter] = useState('');
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [cursorStack, setCursorStack] = useState<Array<string | undefined>>([]);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const query = useAdminCustomers({
    q: phoneFilter || undefined,
    cursor,
    limit: 20,
  });
  const suspendMutation = useSuspendCustomer();
  const reactivateMutation = useReactivateCustomer();

  const customers: AdminCustomer[] = useMemo(
    () => query.data?.items ?? [],
    [query.data],
  );

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

  const handleSuspend = async (c: AdminCustomer) => {
    setOpenMenu(null);
    try {
      await suspendMutation.mutateAsync(c.userId);
      toast.success('تم إيقاف العميل وتسجيل خروجه من كل الأجهزة.');
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.detail : err instanceof Error ? err.message : 'فشل الإيقاف',
      );
    }
  };

  const handleReactivate = async (c: AdminCustomer) => {
    setOpenMenu(null);
    try {
      await reactivateMutation.mutateAsync(c.userId);
      toast.success('تم إعادة تفعيل العميل.');
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.detail : err instanceof Error ? err.message : 'فشل التفعيل',
      );
    }
  };

  return (
    <div>
      <PageHeader
        title="إدارة العملاء"
        subtitle={
          query.isPending
            ? 'جاري التحميل...'
            : query.isError
              ? 'تعذّر تحميل العملاء'
              : `${customers.length} عميل في هذه الصفحة`
        }
      />

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={phoneFilter}
            onChange={(e) => {
              setPhoneFilter(e.target.value.trim());
              setCursor(undefined);
              setCursorStack([]);
            }}
            placeholder="بحث برقم الجوال (E.164، مثلاً +966...)"
            dir="ltr"
            className="w-full pr-9 pl-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-left focus:outline-none focus:ring-2 focus:ring-[#0B5E50]/20"
          />
        </div>
        {query.isFetching && (
          <span className="text-xs text-gray-400 inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#0B5E50] animate-pulse" />
            تحديث...
          </span>
        )}
      </div>

      {query.isError && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 mb-4 text-center">
          <p className="text-red-700 font-semibold mb-2">تعذّر تحميل قائمة العملاء.</p>
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
                <th className="text-right px-4 py-3 font-semibold text-gray-600">الاسم</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">رقم الجوال</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">البريد الإلكتروني</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">حالة التحقق</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">الحالة</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">تاريخ التسجيل</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {query.isPending && <SkeletonRows cols={7} />}
              {!query.isPending &&
                customers.map((c) => {
                  const fullName = [c.firstName, c.lastName].filter(Boolean).join(' ') || '—';
                  const verify = VERIFICATION_DISPLAY[c.verificationStatus];
                  return (
                    <tr key={c.userId} className="border-t border-gray-50 hover:bg-gray-50/50 relative">
                      <td className="px-4 py-3 font-medium">{fullName}</td>
                      <td className="px-4 py-3" dir="ltr">
                        {c.phoneE164}
                      </td>
                      <td className="px-4 py-3 text-gray-500" dir="ltr">
                        {c.email ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${verify.cls}`}>
                          {verify.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                            c.isSuspended
                              ? 'bg-red-100 text-red-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {c.isSuspended ? 'موقوف' : 'نشِط'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(c.createdAt)}</td>
                      <td className="px-4 py-3 relative">
                        <button
                          onClick={() => setOpenMenu(openMenu === c.userId ? null : c.userId)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                          aria-label="إجراءات"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {openMenu === c.userId && (
                          <div
                            className="absolute left-2 top-10 bg-white border border-gray-200 rounded-xl shadow-lg z-10 w-48"
                            onMouseLeave={() => setOpenMenu(null)}
                          >
                            {c.isSuspended ? (
                              <button
                                onClick={() => handleReactivate(c)}
                                disabled={reactivateMutation.isPending}
                                className="w-full text-right px-3 py-2 text-sm hover:bg-gray-50 text-green-700 disabled:opacity-60"
                              >
                                إعادة التفعيل
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSuspend(c)}
                                disabled={suspendMutation.isPending}
                                className="w-full text-right px-3 py-2 text-sm hover:bg-gray-50 text-red-600 disabled:opacity-60"
                              >
                                إيقاف العميل
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              {!query.isPending && !query.isError && customers.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    لا يوجد عملاء يطابقون المعايير الحالية
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

const VERIFICATION_DISPLAY: Record<
  AdminCustomer['verificationStatus'],
  { label: string; cls: string }
> = {
  VERIFIED: { label: 'معتمد', cls: 'bg-green-100 text-green-700' },
  IN_PROGRESS: { label: 'قيد التحقق', cls: 'bg-yellow-100 text-yellow-700' },
  NOT_VERIFIED: { label: 'غير محقق', cls: 'bg-gray-100 text-gray-500' },
  FAILED: { label: 'فشل التحقق', cls: 'bg-red-100 text-red-700' },
};

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
