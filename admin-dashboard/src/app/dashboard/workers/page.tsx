'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ApiError, type Worker } from '@mawared/api-client';
import { Eye, Pencil, Plus, Search, Trash2, X } from 'lucide-react';

import PageHeader from '@/components/dashboard/PageHeader';
import { formatDate, formatMoneyMinor } from '@/lib/utils';
import {
  AVAILABILITIES,
  AVAILABILITY_COLORS,
  AVAILABILITY_LABELS,
  PROFESSIONS,
  PROFESSION_COLORS,
  PROFESSION_LABELS,
} from '@/lib/worker-display';
import {
  useAdminWorkers,
  useCreateWorker,
  useDeleteWorker,
  useUpdateWorker,
} from '@/lib/hooks/use-admin-workers';
import { useBranches, useNationalities } from '@/lib/hooks/use-reference-data';

/**
 * Workers list page — real backend version.
 *
 * Caveats:
 *  - Photo upload is a 4-step S3 flow (presigned URL → PUT → finalize →
 *    bind). Not yet wired — neither create nor edit surface a photo
 *    control. Tracked separately.
 */
export default function WorkersPage() {
  const router = useRouter();
  const query = useAdminWorkers();
  const deleteMutation = useDeleteWorker();

  const [search, setSearch] = useState('');
  const [natFilter, setNatFilter] = useState<string>('all');
  const [profFilter, setProfFilter] = useState<Worker['profession'] | 'all'>('all');
  const [availFilter, setAvailFilter] = useState<Worker['availability'] | 'all'>('all');

  const [editWorker, setEditWorker] = useState<Worker | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const workers: Worker[] = useMemo(() => query.data?.items ?? [], [query.data]);

  // Build the nationality dropdown from whatever the API returned — beats
  // hardcoding a list, and stays accurate per actual data.
  const nationalityOptions = useMemo(() => {
    const map = new Map<string, { code: string; nameAr: string; flag: string }>();
    for (const w of workers) {
      if (w.nationality) {
        map.set(w.nationality.code, {
          code: w.nationality.code,
          nameAr: w.nationality.nameAr,
          flag: w.nationality.flagEmoji,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.nameAr.localeCompare(b.nameAr, 'ar'));
  }, [workers]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return workers.filter((w) => {
      const matchSearch =
        !s ||
        w.fullNameAr.toLowerCase().includes(s) ||
        (w.fullNameEn ?? '').toLowerCase().includes(s);
      const matchNat = natFilter === 'all' || w.nationality?.code === natFilter;
      const matchProf = profFilter === 'all' || w.profession === profFilter;
      const matchAvail = availFilter === 'all' || w.availability === availFilter;
      return matchSearch && matchNat && matchProf && matchAvail;
    });
  }, [workers, search, natFilter, profFilter, availFilter]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success('تم حذف العامل');
      setDeleteId(null);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.detail : err instanceof Error ? err.message : 'فشل الحذف',
      );
    }
  };

  return (
    <div>
      <PageHeader
        title="إدارة العمالة"
        subtitle={
          query.isPending
            ? 'جاري التحميل...'
            : query.isError
              ? 'تعذّر تحميل العمالة'
              : `${workers.length} عامل`
        }
        actions={
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#2D5BE4] text-white rounded-xl text-sm font-semibold hover:bg-[#0F234C]"
          >
            <Plus size={16} />
            إضافة عامل جديد
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
            placeholder="بحث بالاسم..."
            className="w-full pr-9 pl-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5BE4]/20"
          />
        </div>
        <select
          value={natFilter}
          onChange={(e) => setNatFilter(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm"
        >
          <option value="all">جميع الجنسيات</option>
          {nationalityOptions.map((n) => (
            <option key={n.code} value={n.code}>
              {n.flag} {n.nameAr}
            </option>
          ))}
        </select>
        <select
          value={profFilter}
          onChange={(e) => setProfFilter(e.target.value as typeof profFilter)}
          className="w-full sm:w-auto px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm"
        >
          <option value="all">جميع المهن</option>
          {PROFESSIONS.map((p) => (
            <option key={p} value={p}>
              {PROFESSION_LABELS[p]}
            </option>
          ))}
        </select>
        <select
          value={availFilter}
          onChange={(e) => setAvailFilter(e.target.value as typeof availFilter)}
          className="w-full sm:w-auto px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm"
        >
          <option value="all">جميع الحالات</option>
          {AVAILABILITIES.map((a) => (
            <option key={a} value={a}>
              {AVAILABILITY_LABELS[a]}
            </option>
          ))}
        </select>
        {query.isFetching && (
          <span className="text-xs text-gray-400 mr-auto inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#2D5BE4] animate-pulse" />
            تحديث...
          </span>
        )}
      </div>

      {/* Error */}
      {query.isError && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 mb-4 text-center">
          <p className="text-red-700 font-semibold mb-2">تعذّر تحميل قائمة العمالة.</p>
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
          <table className="w-full text-sm min-w-[820px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-right px-4 py-3 font-semibold text-gray-600">الاسم</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">الجنسية</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">المهنة</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">العمر</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">الخبرة</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">الراتب</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">الحالة</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">التقييم</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {query.isPending && <SkeletonRows />}

              {!query.isPending &&
                filtered.map((w) => (
                  <tr key={w.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => router.push(`/dashboard/workers/${w.id}`)}
                        className="font-semibold text-[#2D5BE4] hover:underline flex items-center gap-1.5"
                      >
                        {w.nationality?.flagEmoji} {w.fullNameAr}
                      </button>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">{w.nationality?.nameAr ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-medium border ${PROFESSION_COLORS[w.profession]}`}
                      >
                        {PROFESSION_LABELS[w.profession]}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">{w.ageYears}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">{w.experienceYears} سنوات</td>
                    <td className="px-4 py-3 font-bold">
                      {formatMoneyMinor(w.monthlySalaryMinor, w.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-semibold ${AVAILABILITY_COLORS[w.availability]}`}
                      >
                        {AVAILABILITY_LABELS[w.availability]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                      {Number(w.rating).toFixed(1)} ({w.reviewCount})
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => router.push(`/dashboard/workers/${w.id}`)}
                          className="p-1.5 rounded-lg hover:bg-[#2D5BE4]/10 text-[#2D5BE4]"
                          title="عرض الملف"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => setEditWorker(w)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                          title="تعديل"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteId(w.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"
                          title="حذف"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              {!query.isPending && !query.isError && filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-400">
                    لا يوجد عمال يطابقون المعايير الحالية
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editWorker && (
        <EditWorkerModal worker={editWorker} onClose={() => setEditWorker(null)} />
      )}

      {deleteId && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setDeleteId(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="text-red-500" />
            </div>
            <h3 className="font-bold text-lg mb-2">هل أنت متأكد؟</h3>
            <p className="text-sm text-gray-500 mb-5">
              سيتم أرشفة العامل (حذف لين). يمكن استرجاعه من قاعدة البيانات إذا لزم.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-semibold disabled:opacity-60"
              >
                {deleteMutation.isPending ? 'جاري الحذف...' : 'حذف'}
              </button>
              <button
                onClick={() => setDeleteId(null)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 bg-gray-100 rounded-xl font-semibold disabled:opacity-60"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && <CreateWorkerModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}

// ====================================================================
// Skeleton
// ====================================================================

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="border-t border-gray-50">
          {Array.from({ length: 9 }).map((__, j) => (
            <td key={j} className="px-4 py-4">
              <div className="h-3 bg-gray-100 rounded animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ====================================================================
// Edit modal
// ====================================================================

function EditWorkerModal({ worker, onClose }: { worker: Worker; onClose: () => void }) {
  const updateMutation = useUpdateWorker();
  const [form, setForm] = useState({
    fullNameAr: worker.fullNameAr,
    fullNameEn: worker.fullNameEn ?? '',
    profession: worker.profession,
    ageYears: worker.ageYears,
    experienceYears: worker.experienceYears,
    bioAr: worker.bioAr,
    monthlySalaryMajor: Math.round(Number(worker.monthlySalaryMinor) / 100),
    availability: worker.availability,
  });

  const handleSave = async () => {
    if (!form.fullNameAr.trim()) {
      toast.error('الاسم العربي مطلوب');
      return;
    }
    if (!form.bioAr.trim()) {
      toast.error('النبذة بالعربية مطلوبة');
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id: worker.id,
        body: {
          fullNameAr: form.fullNameAr.trim(),
          fullNameEn: form.fullNameEn.trim() || undefined,
          profession: form.profession,
          ageYears: form.ageYears,
          experienceYears: form.experienceYears,
          bioAr: form.bioAr.trim(),
          monthlySalaryMinor: String(BigInt(form.monthlySalaryMajor) * 100n),
          availability: form.availability,
        },
      });
      toast.success('تم تحديث بيانات العامل');
      onClose();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.detail : err instanceof Error ? err.message : 'فشل التحديث',
      );
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">تعديل العامل</h3>
          <button onClick={onClose} aria-label="إغلاق" className="p-1 rounded-lg hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-3">
          <input
            value={form.fullNameAr}
            onChange={(e) => setForm({ ...form, fullNameAr: e.target.value })}
            placeholder="الاسم بالعربية"
            maxLength={120}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
          />
          <input
            value={form.fullNameEn}
            onChange={(e) => setForm({ ...form, fullNameEn: e.target.value })}
            placeholder="Full name (English)"
            dir="ltr"
            maxLength={120}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={form.profession}
              onChange={(e) =>
                setForm({ ...form, profession: e.target.value as Worker['profession'] })
              }
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm"
            >
              {PROFESSIONS.map((p) => (
                <option key={p} value={p}>
                  {PROFESSION_LABELS[p]}
                </option>
              ))}
            </select>
            <select
              value={form.availability}
              onChange={(e) =>
                setForm({ ...form, availability: e.target.value as Worker['availability'] })
              }
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm"
            >
              {AVAILABILITIES.map((a) => (
                <option key={a} value={a}>
                  {AVAILABILITY_LABELS[a]}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500">العمر</label>
              <input
                type="number"
                min={18}
                max={80}
                value={form.ageYears}
                onChange={(e) => setForm({ ...form, ageYears: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">الخبرة (سنوات)</label>
              <input
                type="number"
                min={0}
                max={60}
                value={form.experienceYears}
                onChange={(e) => setForm({ ...form, experienceYears: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">الراتب (ريال)</label>
              <input
                type="number"
                min={0}
                value={form.monthlySalaryMajor}
                onChange={(e) =>
                  setForm({ ...form, monthlySalaryMajor: Number(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
              />
            </div>
          </div>
          <textarea
            value={form.bioAr}
            onChange={(e) => setForm({ ...form, bioAr: e.target.value })}
            placeholder="نبذة بالعربية..."
            maxLength={4000}
            rows={3}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none"
          />
          <p className="text-[11px] text-gray-400">
            ملاحظة: رفع صور العمال وملفاتهم يمرّ عبر مسار <code>/v1/files</code> ذي
            الأربع خطوات، وسيتم تفعيله لاحقاً.
          </p>
        </div>
        <div className="flex gap-3 mt-5">
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="flex-1 py-2.5 bg-[#2D5BE4] text-white rounded-xl font-semibold hover:bg-[#0F234C] transition-colors disabled:opacity-60"
          >
            {updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
          </button>
          <button
            onClick={onClose}
            disabled={updateMutation.isPending}
            className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors disabled:opacity-60"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

// ====================================================================
// Create modal — branchId + nationalityId pickers fetched from
// /v1/branches and /v1/nationalities respectively.
// ====================================================================

function CreateWorkerModal({ onClose }: { onClose: () => void }) {
  const createMutation = useCreateWorker();
  const branchesQuery = useBranches();
  const nationalitiesQuery = useNationalities();

  const branches = branchesQuery.data?.items ?? [];
  const nationalities = nationalitiesQuery.data?.items ?? [];

  const [form, setForm] = useState({
    branchId: '',
    nationalityId: '',
    fullNameAr: '',
    fullNameEn: '',
    profession: 'DOMESTIC_WORKER' as Worker['profession'],
    ageYears: 30,
    experienceYears: 2,
    bioAr: '',
    monthlySalaryMajor: 1500,
    availability: 'AVAILABLE' as Worker['availability'],
  });

  const refDataLoading = branchesQuery.isPending || nationalitiesQuery.isPending;
  const refDataError = branchesQuery.error || nationalitiesQuery.error;

  const handleSave = async () => {
    if (!form.branchId) {
      toast.error('اختر الفرع');
      return;
    }
    if (!form.nationalityId) {
      toast.error('اختر الجنسية');
      return;
    }
    if (!form.fullNameAr.trim()) {
      toast.error('الاسم العربي مطلوب');
      return;
    }
    if (!form.bioAr.trim()) {
      toast.error('النبذة بالعربية مطلوبة');
      return;
    }
    if (form.ageYears < 18 || form.ageYears > 80) {
      toast.error('العمر يجب أن يكون بين 18 و 80');
      return;
    }

    try {
      await createMutation.mutateAsync({
        branchId: form.branchId,
        nationalityId: form.nationalityId,
        fullNameAr: form.fullNameAr.trim(),
        fullNameEn: form.fullNameEn.trim() || undefined,
        profession: form.profession,
        ageYears: form.ageYears,
        experienceYears: form.experienceYears,
        bioAr: form.bioAr.trim(),
        monthlySalaryMinor: String(BigInt(form.monthlySalaryMajor) * 100n),
        currency: 'SAR',
        availability: form.availability,
      });
      toast.success('تم إضافة العامل بنجاح');
      onClose();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.detail : err instanceof Error ? err.message : 'فشل الإضافة',
      );
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">إضافة عامل جديد</h3>
          <button onClick={onClose} aria-label="إغلاق" className="p-1 rounded-lg hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {refDataLoading && (
          <div className="py-8 flex justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-[#2D5BE4] animate-spin" />
          </div>
        )}

        {refDataError && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-3 text-sm text-red-700">
            تعذّر تحميل قوائم الفروع/الجنسيات. حدّث الصفحة وحاول مرة أخرى.
          </div>
        )}

        {!refDataLoading && !refDataError && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">الفرع *</label>
                <select
                  value={form.branchId}
                  onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                >
                  <option value="">اختر الفرع</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nameAr} ({b.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">الجنسية *</label>
                <select
                  value={form.nationalityId}
                  onChange={(e) => setForm({ ...form, nationalityId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                >
                  <option value="">اختر الجنسية</option>
                  {nationalities.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.flagEmoji} {n.nameAr}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <input
              value={form.fullNameAr}
              onChange={(e) => setForm({ ...form, fullNameAr: e.target.value })}
              placeholder="الاسم بالعربية *"
              maxLength={120}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
            />
            <input
              value={form.fullNameEn}
              onChange={(e) => setForm({ ...form, fullNameEn: e.target.value })}
              placeholder="Full name (English, optional)"
              dir="ltr"
              maxLength={120}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
            />

            <div className="grid grid-cols-2 gap-3">
              <select
                value={form.profession}
                onChange={(e) =>
                  setForm({ ...form, profession: e.target.value as Worker['profession'] })
                }
                className="px-3 py-2 rounded-xl border border-gray-200 text-sm"
              >
                {PROFESSIONS.map((p) => (
                  <option key={p} value={p}>
                    {PROFESSION_LABELS[p]}
                  </option>
                ))}
              </select>
              <select
                value={form.availability}
                onChange={(e) =>
                  setForm({ ...form, availability: e.target.value as Worker['availability'] })
                }
                className="px-3 py-2 rounded-xl border border-gray-200 text-sm"
              >
                {AVAILABILITIES.map((a) => (
                  <option key={a} value={a}>
                    {AVAILABILITY_LABELS[a]}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-500">العمر</label>
                <input
                  type="number"
                  min={18}
                  max={80}
                  value={form.ageYears}
                  onChange={(e) => setForm({ ...form, ageYears: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">الخبرة (سنوات)</label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={form.experienceYears}
                  onChange={(e) =>
                    setForm({ ...form, experienceYears: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">الراتب (ريال)</label>
                <input
                  type="number"
                  min={0}
                  value={form.monthlySalaryMajor}
                  onChange={(e) =>
                    setForm({ ...form, monthlySalaryMajor: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
                />
              </div>
            </div>

            <textarea
              value={form.bioAr}
              onChange={(e) => setForm({ ...form, bioAr: e.target.value })}
              placeholder="نبذة بالعربية * (1-4000 حرف)"
              maxLength={4000}
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none"
            />

            <p className="text-[11px] text-gray-400">
              الحقول المطلوبة معلّمة بـ *. رفع الصور والملفات يضاف لاحقاً عبر
              <code> /v1/files</code>.
            </p>
          </div>
        )}

        <div className="flex gap-3 mt-5">
          <button
            onClick={handleSave}
            disabled={createMutation.isPending || refDataLoading}
            className="flex-1 py-2.5 bg-[#2D5BE4] text-white rounded-xl font-semibold hover:bg-[#0F234C] transition-colors disabled:opacity-60"
          >
            {createMutation.isPending ? 'جاري الإضافة...' : 'إضافة'}
          </button>
          <button
            onClick={onClose}
            disabled={createMutation.isPending}
            className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors disabled:opacity-60"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
