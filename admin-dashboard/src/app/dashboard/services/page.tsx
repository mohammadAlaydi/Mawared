'use client';
import { useState } from 'react';
import { useDashboard } from '@/lib/dashboard-context';
import PageHeader from '@/components/dashboard/PageHeader';
import { Home, Car, Baby, Heart, Plus, Pencil, Trash2, X } from 'lucide-react';
import { Service } from '@/types';
import { toast } from 'sonner';

const iconMap: Record<string, React.ElementType> = {
  Home, Car, Baby, Heart,
};

const iconOptions = [
  { label: 'منزل', value: 'Home' },
  { label: 'سيارة', value: 'Car' },
  { label: 'طفل', value: 'Baby' },
  { label: 'قلب', value: 'Heart' },
];

export default function ServicesPage() {
  const { services, addService, updateService, deleteService } = useDashboard();
  const [showModal, setShowModal] = useState(false);
  const [editService, setEditService] = useState<Service | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', iconName: 'Home', active: true });

  const openAdd = () => {
    setEditService(null);
    setForm({ name: '', description: '', iconName: 'Home', active: true });
    setShowModal(true);
  };

  const openEdit = (s: Service) => {
    setEditService(s);
    setForm({ name: s.name, description: s.description, iconName: s.iconName, active: s.active });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.description.trim()) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }
    if (editService) {
      updateService({ ...editService, ...form });
      toast.success('تم تحديث الخدمة');
    } else {
      addService(form);
      toast.success('تم إضافة الخدمة');
    }
    setShowModal(false);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteService(deleteId);
      toast.success('تم حذف الخدمة');
      setDeleteId(null);
    }
  };

  return (
    <div>
      <PageHeader title="الخدمات" subtitle={`${services.length} خدمة`} actions={
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-[#0B5E50] text-white rounded-xl text-sm font-semibold hover:bg-[#073D34]">
          <Plus size={16} />إضافة خدمة
        </button>
      } />

      <div className="grid sm:grid-cols-2 gap-4">
        {services.map(s => {
          const Icon = iconMap[s.iconName] || Home;
          return (
            <div key={s.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#0B5E50]/10 flex items-center justify-center">
                  <Icon size={24} className="text-[#0B5E50]" />
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setDeleteId(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-1">{s.name}</h3>
              <p className="text-sm text-gray-500">{s.description}</p>
              <span className={`inline-block mt-3 px-2 py-0.5 rounded-lg text-xs font-semibold ${s.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {s.active ? 'مفعّلة' : 'معطّلة'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{editService ? 'تعديل الخدمة' : 'إضافة خدمة جديدة'}</h3>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="اسم الخدمة" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" />
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="وصف الخدمة" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm min-h-[80px]" />
              <select value={form.iconName} onChange={e => setForm({ ...form, iconName: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm">
                {iconOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
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
            <p className="text-sm text-gray-500 mb-5">هل أنت متأكد من حذف هذه الخدمة؟</p>
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
