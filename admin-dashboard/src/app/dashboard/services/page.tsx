'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { ApiError, type ServiceCategory } from '@mawared/api-client';
import { Plus, Pencil, PowerOff, X } from 'lucide-react';

import PageHeader from '@/components/dashboard/PageHeader';
import {
  useAdminServices,
  useCreateService,
  useDeactivateService,
  useUpdateService,
} from '@/lib/hooks/use-admin-catalog';
import { PROFESSIONS, PROFESSION_LABELS } from '@/lib/worker-display';

type Profession = ServiceCategory['profession'];

/**
 * Services page — real backend version.
 *
 * Backend treats services as catalog entities tied to a `profession`. The
 * old mock UI had a free-text "icon name" picker that's not part of the
 * schema — dropped. "Delete" is a soft deactivate (`POST :id/deactivate`).
 */
export default function ServicesPage() {
  const query = useAdminServices();
  const [editService, setEditService] = useState<ServiceCategory | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState<ServiceCategory | null>(null);
  const deactivateMutation = useDeactivateService();

  const services: ServiceCategory[] = query.data?.items ?? [];

  const handleDeactivate = async () => {
    if (!confirmDeactivate) return;
    try {
      await deactivateMutation.mutateAsync(confirmDeactivate.id);
      toast.success('تم تعطيل الخدمة');
      setConfirmDeactivate(null);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.detail : err instanceof Error ? err.message : 'فشل التعطيل',
      );
    }
  };

  return (
    <div>
      <PageHeader
        title="الخدمات"
        subtitle={
          query.isPending
            ? 'جاري التحميل...'
            : query.isError
              ? 'تعذّر التحميل'
              : `${services.length} خدمة`
        }
        actions={
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0B5E50] text-white rounded-xl text-sm font-semibold hover:bg-[#073D34]"
          >
            <Plus size={16} />
            إضافة خدمة
          </button>
        }
      />

      {query.isError && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 mb-4 text-center">
          <p className="text-red-700 font-semibold mb-2">تعذّر تحميل الخدمات.</p>
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

      {query.isPending && (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-40 animate-pulse"
            />
          ))}
        </div>
      )}

      {!query.isPending && !query.isError && services.length === 0 && (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center text-gray-400">
          لا توجد خدمات بعد. ابدأ بإضافة خدمة جديدة.
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {services.map((s) => (
          <div
            key={s.id}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex flex-col gap-2">
                <span className="inline-block w-fit px-2 py-0.5 rounded-lg text-[11px] font-medium bg-[#0B5E50]/10 text-[#0B5E50]">
                  {PROFESSION_LABELS[s.profession]}
                </span>
                <span className="text-[11px] text-gray-400 font-mono">{s.slug}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditService(s)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                  title="تعديل"
                >
                  <Pencil size={14} />
                </button>
                {s.isActive && (
                  <button
                    onClick={() => setConfirmDeactivate(s)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"
                    title="تعطيل"
                  >
                    <PowerOff size={14} />
                  </button>
                )}
              </div>
            </div>
            <h3 className="font-bold text-lg text-gray-900 mb-1">{s.nameAr}</h3>
            {s.nameEn && (
              <p className="text-xs text-gray-400 mb-2" dir="ltr">
                {s.nameEn}
              </p>
            )}
            {s.descriptionAr && (
              <p className="text-sm text-gray-500 line-clamp-3">{s.descriptionAr}</p>
            )}
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span
                className={`px-2 py-0.5 rounded-lg font-semibold ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
              >
                {s.isActive ? 'مفعّلة' : 'معطّلة'}
              </span>
              <span className="text-gray-400">ترتيب: {s.displayOrder}</span>
            </div>
          </div>
        ))}
      </div>

      {(editService || showAdd) && (
        <ServiceFormModal
          service={editService}
          onClose={() => {
            setEditService(null);
            setShowAdd(false);
          }}
        />
      )}

      {confirmDeactivate && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setConfirmDeactivate(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <PowerOff className="text-red-500" />
            </div>
            <h3 className="font-bold text-lg mb-2">تعطيل الخدمة؟</h3>
            <p className="text-sm text-gray-500 mb-5">
              لن تظهر للعملاء، ولن يتم حذفها. يمكن إعادة تفعيلها لاحقاً بتعديل isActive.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeactivate}
                disabled={deactivateMutation.isPending}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-semibold disabled:opacity-60"
              >
                {deactivateMutation.isPending ? 'جاري...' : 'تعطيل'}
              </button>
              <button
                onClick={() => setConfirmDeactivate(null)}
                disabled={deactivateMutation.isPending}
                className="flex-1 py-2.5 bg-gray-100 rounded-xl font-semibold disabled:opacity-60"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ====================================================================
// Create/Edit modal
// ====================================================================

function ServiceFormModal({
  service,
  onClose,
}: {
  service: ServiceCategory | null;
  onClose: () => void;
}) {
  const isEdit = service !== null;
  const createMutation = useCreateService();
  const updateMutation = useUpdateService();
  const mutation = isEdit ? updateMutation : createMutation;

  const [form, setForm] = useState({
    slug: service?.slug ?? '',
    nameAr: service?.nameAr ?? '',
    nameEn: service?.nameEn ?? '',
    descriptionAr: service?.descriptionAr ?? '',
    descriptionEn: service?.descriptionEn ?? '',
    profession: (service?.profession ?? 'DOMESTIC_WORKER') as Profession,
    displayOrder: service?.displayOrder ?? 0,
    isActive: service?.isActive ?? true,
  });

  const handleSave = async () => {
    if (!form.nameAr.trim()) {
      toast.error('الاسم العربي مطلوب');
      return;
    }
    if (!isEdit) {
      if (!form.slug.trim()) {
        toast.error('الـ slug مطلوب');
        return;
      }
      if (!/^[a-z0-9-]+$/.test(form.slug)) {
        toast.error('الـ slug يجب أن يحتوي حروف لاتينية صغيرة وأرقام وشرطات فقط');
        return;
      }
    }

    const body = {
      slug: form.slug.trim(),
      nameAr: form.nameAr.trim(),
      nameEn: form.nameEn.trim() || undefined,
      descriptionAr: form.descriptionAr.trim() || undefined,
      descriptionEn: form.descriptionEn.trim() || undefined,
      profession: form.profession,
      displayOrder: form.displayOrder,
      isActive: form.isActive,
    };

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: service!.id, body });
        toast.success('تم تحديث الخدمة');
      } else {
        await createMutation.mutateAsync(body);
        toast.success('تم إنشاء الخدمة');
      }
      onClose();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.detail : err instanceof Error ? err.message : 'فشل الحفظ',
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
          <h3 className="text-lg font-bold">{isEdit ? 'تعديل الخدمة' : 'إضافة خدمة جديدة'}</h3>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Slug (لاتيني، صغير) *</label>
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })}
              placeholder="domestic-worker"
              dir="ltr"
              disabled={isEdit}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-left disabled:opacity-60"
            />
            {isEdit && (
              <p className="text-[11px] text-gray-400 mt-1">
                الـ slug لا يمكن تغييره بعد الإنشاء.
              </p>
            )}
          </div>
          <input
            value={form.nameAr}
            onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
            placeholder="الاسم بالعربية *"
            maxLength={200}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
          />
          <input
            value={form.nameEn}
            onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
            placeholder="Name (English)"
            dir="ltr"
            maxLength={200}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
          />
          <textarea
            value={form.descriptionAr}
            onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })}
            placeholder="الوصف بالعربية"
            maxLength={2000}
            rows={2}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none"
          />
          <textarea
            value={form.descriptionEn}
            onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })}
            placeholder="Description (English)"
            dir="ltr"
            maxLength={2000}
            rows={2}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={form.profession}
              onChange={(e) => setForm({ ...form, profession: e.target.value as Profession })}
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm"
            >
              {PROFESSIONS.map((p) => (
                <option key={p} value={p}>
                  {PROFESSION_LABELS[p]}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={0}
              max={1000}
              value={form.displayOrder}
              onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })}
              placeholder="ترتيب العرض"
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm"
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            <span className="text-sm">مفعّلة</span>
          </label>
        </div>
        <div className="flex gap-3 mt-5">
          <button
            onClick={handleSave}
            disabled={mutation.isPending}
            className="flex-1 py-2.5 bg-[#0B5E50] text-white rounded-xl font-semibold disabled:opacity-60"
          >
            {mutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
          </button>
          <button
            onClick={onClose}
            disabled={mutation.isPending}
            className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold disabled:opacity-60"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
