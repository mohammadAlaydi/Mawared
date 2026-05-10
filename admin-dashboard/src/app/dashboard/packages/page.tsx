'use client';
import { useState } from 'react';
import { useDashboard } from '@/lib/dashboard-context';
import PageHeader from '@/components/dashboard/PageHeader';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { Package, PackageType } from '@/types';
import { toast } from 'sonner';

export default function PackagesPage() {
  const { packages, addPackage, updatePackage, deletePackage } = useDashboard();
  const [tab, setTab] = useState<PackageType>('monthly');
  const [showModal, setShowModal] = useState(false);
  const [editPkg, setEditPkg] = useState<Package | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', duration: '', price: 0, type: 'monthly' as PackageType, active: true });

  const filteredPackages = packages.filter(p => p.type === tab);

  const openAdd = () => {
    setEditPkg(null);
    setForm({ name: '', description: '', duration: '', price: 0, type: tab, active: true });
    setShowModal(true);
  };

  const openEdit = (p: Package) => {
    setEditPkg(p);
    setForm({ name: p.name, description: p.description, duration: p.duration, price: p.price, type: p.type, active: p.active });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.description.trim() || !form.duration.trim()) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }
    if (editPkg) {
      updatePackage({ ...editPkg, ...form });
      toast.success('تم تحديث الباقة');
    } else {
      addPackage(form);
      toast.success('تم إضافة الباقة');
    }
    setShowModal(false);
  };

  const handleDelete = () => {
    if (deleteId) {
      deletePackage(deleteId);
      toast.success('تم حذف الباقة');
      setDeleteId(null);
    }
  };

  return (
    <div>
      <PageHeader title="الباقات" subtitle={`${packages.length} باقة`} actions={
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-[#0B5E50] text-white rounded-xl text-sm font-semibold hover:bg-[#073D34]">
          <Plus size={16} />إضافة باقة
        </button>
      } />

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('monthly')} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === 'monthly' ? 'bg-[#0B5E50] text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>شهري</button>
        <button onClick={() => setTab('hourly')} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === 'hourly' ? 'bg-[#0B5E50] text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>بالساعة</button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50">
            <th className="text-right px-4 py-3 font-semibold text-gray-600">الاسم</th>
            <th className="text-right px-4 py-3 font-semibold text-gray-600">الوصف</th>
            <th className="text-right px-4 py-3 font-semibold text-gray-600">المدة</th>
            <th className="text-right px-4 py-3 font-semibold text-gray-600">السعر</th>
            <th className="text-right px-4 py-3 font-semibold text-gray-600">الحالة</th>
            <th className="text-right px-4 py-3 font-semibold text-gray-600">إجراءات</th>
          </tr></thead>
          <tbody>
            {filteredPackages.map(p => (
              <tr key={p.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                <td className="px-4 py-3 font-bold">{p.name}</td>
                <td className="px-4 py-3 text-gray-600">{p.description}</td>
                <td className="px-4 py-3">{p.duration}</td>
                <td className="px-4 py-3 font-bold">{p.price.toLocaleString('ar-SA')} ريال</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${p.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.active ? 'مفعّلة' : 'معطّلة'}
                  </span>
                </td>
                <td className="px-4 py-3 flex gap-1">
                  <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><Pencil size={14} /></button>
                  <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            {filteredPackages.length === 0 && (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">لا توجد باقات</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{editPkg ? 'تعديل الباقة' : 'إضافة باقة جديدة'}</h3>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="اسم الباقة" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" />
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="وصف الباقة" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" />
              <input value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} placeholder="المدة (مثال: شهري / ٤ ساعات)" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" />
              <input type="number" value={form.price} onChange={e => setForm({ ...form, price: +e.target.value })} placeholder="السعر" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" />
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as PackageType })} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm">
                <option value="monthly">شهري</option>
                <option value="hourly">بالساعة</option>
              </select>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} />
                <span className="text-sm">مفعّلة</span>
              </label>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleSave} className="flex-1 py-2.5 bg-[#0B5E50] text-white rounded-xl font-semibold">حفظ</button>
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="text-red-500" />
            </div>
            <h3 className="font-bold text-lg mb-2">هل أنت متأكد؟</h3>
            <p className="text-sm text-gray-500 mb-5">هل أنت متأكد من حذف هذه الباقة؟</p>
            <div className="flex gap-3">
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-semibold">حذف</button>
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 bg-gray-100 rounded-xl font-semibold">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
