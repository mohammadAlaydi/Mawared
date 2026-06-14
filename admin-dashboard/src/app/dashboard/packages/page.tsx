'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ApiError, type ServiceCategory, type ServicePackage } from '@mawared/api-client';
import { Pencil, Plus, PowerOff, X } from 'lucide-react';

import PageHeader from '@/components/dashboard/PageHeader';
import { formatMoneyMinor } from '@/lib/utils';
import {
  DURATION_UNITS,
  DURATION_UNIT_LABELS,
  PACKAGE_TYPE_LABELS,
  useAdminPackages,
  useAdminServices,
  useCreatePackage,
  useDeactivatePackage,
  useUpdatePackage,
} from '@/lib/hooks/use-admin-catalog';

/**
 * Packages page — real backend version.
 *
 * Packages belong to a service (`serviceId` FK) and have `type=HOURLY|MONTHLY`,
 * `priceMinor` (BigInt-string halalas), `currency`, `durationValue + durationUnit`,
 * `vatRatePpm` (parts per million — 150_000 = 15%).
 *
 * "Delete" is a soft deactivate.
 */
export default function PackagesPage() {
  const packagesQuery = useAdminPackages();
  const servicesQuery = useAdminServices();
  const deactivateMutation = useDeactivatePackage();

  const [tab, setTab] = useState<ServicePackage['type']>('MONTHLY');
  const [showAdd, setShowAdd] = useState(false);
  const [editPkg, setEditPkg] = useState<ServicePackage | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<ServicePackage | null>(null);

  const packages = packagesQuery.data?.items ?? [];
  const services = servicesQuery.data?.items ?? [];

  const filtered = useMemo(() => packages.filter((p) => p.type === tab), [packages, tab]);

  const servicesById = useMemo(() => {
    const map = new Map<string, ServiceCategory>();
    for (const s of services) map.set(s.id, s);
    return map;
  }, [services]);

  const handleDeactivate = async () => {
    if (!confirmDeactivate) return;
    try {
      await deactivateMutation.mutateAsync(confirmDeactivate.id);
      toast.success('تم تعطيل الباقة');
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
        title="الباقات"
        subtitle={
          packagesQuery.isPending
            ? 'جاري التحميل...'
            : packagesQuery.isError
              ? 'تعذّر التحميل'
              : `${packages.length} باقة`
        }
        actions={
          <button
            onClick={() => setShowAdd(true)}
            disabled={services.length === 0}
            title={services.length === 0 ? 'يجب إنشاء خدمة قبل الباقة' : ''}
            className="flex items-center gap-2 px-4 py-2 bg-[#2D5BE4] text-white rounded-xl text-sm font-semibold hover:bg-[#0F234C] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Plus size={16} />
            إضافة باقة
          </button>
        }
      />

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('MONTHLY')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === 'MONTHLY' ? 'bg-[#2D5BE4] text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
        >
          شهري
        </button>
        <button
          onClick={() => setTab('HOURLY')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === 'HOURLY' ? 'bg-[#2D5BE4] text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
        >
          بالساعة
        </button>
      </div>

      {packagesQuery.isError && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 mb-4 text-center">
          <p className="text-red-700 font-semibold mb-2">تعذّر تحميل الباقات.</p>
          <button
            onClick={() => packagesQuery.refetch()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-right px-4 py-3 font-semibold text-gray-600">الاسم</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">الخدمة</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">النوع</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">المدة</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">السعر</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">VAT</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">الحالة</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {packagesQuery.isPending && (
              <>
                {Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-t border-gray-50">
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-3 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            )}
            {!packagesQuery.isPending &&
              filtered.map((p) => (
                <tr key={p.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-bold">{p.nameAr}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {servicesById.get(p.serviceId)?.nameAr ?? p.serviceId.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-[#2D5BE4]/10 text-[#2D5BE4]">
                      {PACKAGE_TYPE_LABELS[p.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.durationValue} {DURATION_UNIT_LABELS[p.durationUnit] ?? p.durationUnit}
                  </td>
                  <td className="px-4 py-3 font-bold">
                    {formatMoneyMinor(p.priceMinor, p.currency)}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {(p.vatRatePpm / 10_000).toFixed(1)}%
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-lg text-xs font-semibold ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                    >
                      {p.isActive ? 'مفعّلة' : 'معطّلة'}
                    </span>
                    {p.isPopular && (
                      <span className="ml-1 px-2 py-1 rounded-lg text-xs font-semibold bg-amber-100 text-amber-700">
                        مميّز
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditPkg(p)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                        title="تعديل"
                      >
                        <Pencil size={14} />
                      </button>
                      {p.isActive && (
                        <button
                          onClick={() => setConfirmDeactivate(p)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"
                          title="تعطيل"
                        >
                          <PowerOff size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            {!packagesQuery.isPending && filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400">
                  لا توجد باقات {tab === 'MONTHLY' ? 'شهرية' : 'بالساعة'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {(editPkg || showAdd) && (
        <PackageFormModal
          pkg={editPkg}
          defaultType={tab}
          services={services}
          onClose={() => {
            setEditPkg(null);
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
            <h3 className="font-bold text-lg mb-2">تعطيل الباقة؟</h3>
            <p className="text-sm text-gray-500 mb-5">
              لن تظهر للعملاء، ولن يتم حذفها. يمكن إعادة تفعيلها بتعديل isActive.
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

function PackageFormModal({
  pkg,
  defaultType,
  services,
  onClose,
}: {
  pkg: ServicePackage | null;
  defaultType: ServicePackage['type'];
  services: ServiceCategory[];
  onClose: () => void;
}) {
  const isEdit = pkg !== null;
  const createMutation = useCreatePackage();
  const updateMutation = useUpdatePackage();
  const mutation = isEdit ? updateMutation : createMutation;

  const [form, setForm] = useState({
    serviceId: pkg?.serviceId ?? services[0]?.id ?? '',
    nameAr: pkg?.nameAr ?? '',
    nameEn: pkg?.nameEn ?? '',
    descriptionAr: pkg?.descriptionAr ?? '',
    type: pkg?.type ?? defaultType,
    durationValue: pkg?.durationValue ?? 1,
    durationUnit: (pkg?.durationUnit ?? 'MONTH') as (typeof DURATION_UNITS)[number],
    priceMajor: pkg ? Math.round(Number(pkg.priceMinor) / 100) : 1500,
    vatRatePct: pkg ? pkg.vatRatePpm / 10_000 : 15,
    isPopular: pkg?.isPopular ?? false,
    isActive: pkg?.isActive ?? true,
  });

  const handleSave = async () => {
    if (!form.serviceId) {
      toast.error('اختر الخدمة');
      return;
    }
    if (!form.nameAr.trim()) {
      toast.error('الاسم العربي مطلوب');
      return;
    }
    if (form.durationValue <= 0) {
      toast.error('المدة يجب أن تكون أكبر من 0');
      return;
    }
    if (form.priceMajor < 0) {
      toast.error('السعر لا يمكن أن يكون سالباً');
      return;
    }

    const body = {
      serviceId: form.serviceId,
      nameAr: form.nameAr.trim(),
      nameEn: form.nameEn.trim() || undefined,
      descriptionAr: form.descriptionAr.trim() || undefined,
      type: form.type,
      durationValue: form.durationValue,
      durationUnit: form.durationUnit,
      priceMinor: String(BigInt(form.priceMajor) * 100n),
      currency: 'SAR',
      vatRatePpm: Math.round(form.vatRatePct * 10_000),
      isPopular: form.isPopular,
      isActive: form.isActive,
    };

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: pkg!.id, body });
        toast.success('تم تحديث الباقة');
      } else {
        await createMutation.mutateAsync(body);
        toast.success('تم إنشاء الباقة');
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
          <h3 className="text-lg font-bold">{isEdit ? 'تعديل الباقة' : 'إضافة باقة جديدة'}</h3>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">الخدمة *</label>
            <select
              value={form.serviceId}
              onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
            >
              <option value="">اختر الخدمة</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nameAr}
                </option>
              ))}
            </select>
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500">النوع</label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as ServicePackage['type'] })
                }
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
              >
                <option value="MONTHLY">شهري</option>
                <option value="HOURLY">بالساعة</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">قيمة المدة</label>
              <input
                type="number"
                min={1}
                max={365}
                value={form.durationValue}
                onChange={(e) => setForm({ ...form, durationValue: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">وحدة المدة</label>
              <select
                value={form.durationUnit}
                onChange={(e) =>
                  setForm({
                    ...form,
                    durationUnit: e.target.value as (typeof DURATION_UNITS)[number],
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
              >
                {DURATION_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {DURATION_UNIT_LABELS[u]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">السعر (ريال)</label>
              <input
                type="number"
                min={0}
                value={form.priceMajor}
                onChange={(e) => setForm({ ...form, priceMajor: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">VAT %</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={form.vatRatePct}
                onChange={(e) => setForm({ ...form, vatRatePct: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isPopular}
                onChange={(e) => setForm({ ...form, isPopular: e.target.checked })}
              />
              <span className="text-sm">مميّز</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              <span className="text-sm">مفعّلة</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={handleSave}
            disabled={mutation.isPending}
            className="flex-1 py-2.5 bg-[#2D5BE4] text-white rounded-xl font-semibold disabled:opacity-60"
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
