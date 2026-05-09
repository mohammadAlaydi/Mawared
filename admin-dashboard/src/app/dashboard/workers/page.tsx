'use client';
import { useState } from 'react';
import { useDashboard } from '@/lib/dashboard-context';
import PageHeader from '@/components/dashboard/PageHeader';
import { formatDate } from '@/lib/utils';
import { Plus, Search, Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Worker } from '@/types';

export default function WorkersPage() {
  const { workers, addWorker, deleteWorker, updateWorker } = useDashboard();
  const [search, setSearch] = useState('');
  const [natFilter, setNatFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editWorker, setEditWorker] = useState<Worker | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ nameAr: '', nationality: 'فلبينية', nationalityFlag: '🇵🇭', profession: 'عاملة منزلية', experienceYears: 0, age: 25, monthlySalary: 1500, isAvailable: true, joinedAt: new Date().toISOString().split('T')[0] });

  const natFlags: Record<string, string> = { 'فلبينية': '🇵🇭', 'إندونيسية': '🇮🇩', 'إثيوبية': '🇪🇹', 'هندية': '🇮🇳' };

  const filtered = workers.filter(w => {
    const matchSearch = w.nameAr.includes(search);
    const matchNat = natFilter === 'all' || w.nationality === natFilter;
    return matchSearch && matchNat;
  });

  const openAdd = () => { setEditWorker(null); setForm({ nameAr: '', nationality: 'فلبينية', nationalityFlag: '🇵🇭', profession: 'عاملة منزلية', experienceYears: 0, age: 25, monthlySalary: 1500, isAvailable: true, joinedAt: new Date().toISOString().split('T')[0] }); setShowModal(true); };
  const openEdit = (w: Worker) => { setEditWorker(w); setForm({ nameAr: w.nameAr, nationality: w.nationality, nationalityFlag: w.nationalityFlag, profession: w.profession, experienceYears: w.experienceYears, age: w.age, monthlySalary: w.monthlySalary, isAvailable: w.isAvailable, joinedAt: w.joinedAt }); setShowModal(true); };

  const handleSave = () => {
    const data = { ...form, nationalityFlag: natFlags[form.nationality] || '🏳️' };
    if (editWorker) { updateWorker({ ...editWorker, ...data }); toast.success('تم تحديث بيانات العامل'); }
    else { addWorker(data); toast.success('تم إضافة العامل بنجاح'); }
    setShowModal(false);
  };

  const handleDelete = () => { if (deleteId) { deleteWorker(deleteId); toast.success('تم حذف العامل'); setDeleteId(null); } };

  return (
    <div>
      <PageHeader title="إدارة العمالة" subtitle={`${workers.length} عامل`} actions={<button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-[#0B5E50] text-white rounded-xl text-sm font-semibold hover:bg-[#073D34]"><Plus size={16} />إضافة عامل جديد</button>} />

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]"><Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم..." className="w-full pr-9 pl-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5E50]/20" /></div>
        <select value={natFilter} onChange={e => setNatFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm"><option value="all">جميع الجنسيات</option>{Object.keys(natFlags).map(n => <option key={n} value={n}>{n}</option>)}</select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50">
              <th className="text-right px-4 py-3 font-semibold text-gray-600">الاسم</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">الجنسية</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">المهنة</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">العمر</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">الخبرة</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">الراتب</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">الحالة</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">الانضمام</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">إجراءات</th>
            </tr></thead>
            <tbody>
              {filtered.map(w => (
                <tr key={w.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium">{w.nationalityFlag} {w.nameAr}</td>
                  <td className="px-4 py-3">{w.nationality}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 bg-gray-100 rounded-lg text-xs">{w.profession}</span></td>
                  <td className="px-4 py-3">{w.age}</td>
                  <td className="px-4 py-3">{w.experienceYears} سنوات</td>
                  <td className="px-4 py-3 font-bold">{w.monthlySalary.toLocaleString('ar-SA')} ريال</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-lg text-xs font-semibold ${w.isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{w.isAvailable ? 'متاح' : 'غير متاح'}</span></td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(w.joinedAt)}</td>
                  <td className="px-4 py-3 flex gap-1">
                    <button onClick={() => openEdit(w)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><Pencil size={14} /></button>
                    <button onClick={() => setDeleteId(w.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold">{editWorker ? 'تعديل العامل' : 'إضافة عامل جديد'}</h3><button onClick={() => setShowModal(false)}><X size={20} /></button></div>
            <div className="space-y-3">
              <input value={form.nameAr} onChange={e => setForm({ ...form, nameAr: e.target.value })} placeholder="الاسم" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.nationality} onChange={e => setForm({ ...form, nationality: e.target.value })} className="px-3 py-2 rounded-xl border border-gray-200 text-sm">{Object.keys(natFlags).map(n => <option key={n} value={n}>{n}</option>)}</select>
                <select value={form.profession} onChange={e => setForm({ ...form, profession: e.target.value })} className="px-3 py-2 rounded-xl border border-gray-200 text-sm"><option>عاملة منزلية</option><option>سائق خاص</option><option>مربية أطفال</option><option>رعاية مسنين</option></select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input type="number" value={form.age} onChange={e => setForm({ ...form, age: +e.target.value })} placeholder="العمر" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
                <input type="number" value={form.experienceYears} onChange={e => setForm({ ...form, experienceYears: +e.target.value })} placeholder="الخبرة" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
                <input type="number" value={form.monthlySalary} onChange={e => setForm({ ...form, monthlySalary: +e.target.value })} placeholder="الراتب" className="px-3 py-2 rounded-xl border border-gray-200 text-sm" />
              </div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.isAvailable} onChange={e => setForm({ ...form, isAvailable: e.target.checked })} /><span className="text-sm">متاح</span></label>
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
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><Trash2 className="text-red-500" /></div>
            <h3 className="font-bold text-lg mb-2">هل أنت متأكد؟</h3>
            <p className="text-sm text-gray-500 mb-5">هل أنت متأكد من حذف هذا العامل؟</p>
            <div className="flex gap-3"><button onClick={handleDelete} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-semibold">حذف</button><button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 bg-gray-100 rounded-xl font-semibold">إلغاء</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
