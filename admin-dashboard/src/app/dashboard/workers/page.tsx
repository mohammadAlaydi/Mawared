'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboard } from '@/lib/dashboard-context';
import PageHeader from '@/components/dashboard/PageHeader';
import { formatDate } from '@/lib/utils';
import { Plus, Search, Pencil, Trash2, X, Eye, Upload, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Worker, WorkerDocument } from '@/types';

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const allProfessions = ['عاملة منزلية', 'سائق خاص', 'مربية أطفال', 'رعاية مسنين'];
const natFlags: Record<string, string> = { 'فلبينية': '🇵🇭', 'إندونيسية': '🇮🇩', 'إثيوبية': '🇪🇹', 'هندية': '🇮🇳' };

const professionColors: Record<string, string> = {
  'عاملة منزلية': 'bg-blue-100 text-blue-700',
  'سائق خاص': 'bg-purple-100 text-purple-700',
  'مربية أطفال': 'bg-pink-100 text-pink-700',
  'رعاية مسنين': 'bg-amber-100 text-amber-700',
};

export default function WorkersPage() {
  const router = useRouter();
  const { workers, addWorker, deleteWorker, updateWorker } = useDashboard();
  const [search, setSearch] = useState('');
  const [natFilter, setNatFilter] = useState('all');
  const [profFilter, setProfFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editWorker, setEditWorker] = useState<Worker | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const emptyForm = {
    nameAr: '', nationality: 'فلبينية', nationalityFlag: '🇵🇭',
    professions: ['عاملة منزلية'] as string[],
    experienceYears: 0, age: 25, monthlySalary: 1500, isAvailable: true,
    joinedAt: new Date().toISOString().split('T')[0],
    photoUrl: '', cvImageUrl: '', bio: '', religion: 'مسلمة', maritalStatus: 'عزباء',
    languages: ['عربي'] as string[], height: 160, weight: 55,
    documents: [] as Worker['documents'], workHistory: [] as Worker['workHistory'],
  };

  const [form, setForm] = useState(emptyForm);

  const filtered = workers.filter(w => {
    const matchSearch = w.nameAr.includes(search);
    const matchNat = natFilter === 'all' || w.nationality === natFilter;
    const matchProf = profFilter === 'all' || w.professions.includes(profFilter);
    return matchSearch && matchNat && matchProf;
  });

  const openAdd = () => {
    setEditWorker(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (w: Worker) => {
    setEditWorker(w);
    setForm({
      nameAr: w.nameAr, nationality: w.nationality, nationalityFlag: w.nationalityFlag,
      professions: [...w.professions], experienceYears: w.experienceYears,
      age: w.age, monthlySalary: w.monthlySalary, isAvailable: w.isAvailable,
      joinedAt: w.joinedAt, photoUrl: w.photoUrl, cvImageUrl: w.cvImageUrl,
      bio: w.bio, religion: w.religion, maritalStatus: w.maritalStatus,
      languages: [...w.languages], height: w.height, weight: w.weight,
      documents: w.documents, workHistory: w.workHistory,
    });
    setShowModal(true);
  };

  const toggleProfession = (prof: string) => {
    setForm(prev => {
      const has = prev.professions.includes(prof);
      const next = has ? prev.professions.filter(p => p !== prof) : [...prev.professions, prof];
      return { ...prev, professions: next.length ? next : prev.professions };
    });
  };

  const handleSave = () => {
    if (!form.nameAr.trim()) { toast.error('يرجى إدخال الاسم'); return; }
    const data = { ...form, nationalityFlag: natFlags[form.nationality] || '🏳️' };
    if (editWorker) {
      updateWorker({ ...editWorker, ...data });
      toast.success('تم تحديث بيانات العامل');
    } else {
      addWorker(data);
      toast.success('تم إضافة العامل بنجاح');
    }
    setShowModal(false);
  };

  const handleDelete = () => {
    if (deleteId) { deleteWorker(deleteId); toast.success('تم حذف العامل'); setDeleteId(null); }
  };

  return (
    <div>
      <PageHeader title="إدارة العمالة" subtitle={`${workers.length} عامل`} actions={
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-[#0B5E50] text-white rounded-xl text-sm font-semibold hover:bg-[#073D34]">
          <Plus size={16} />إضافة عامل جديد
        </button>
      } />

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم..." className="w-full pr-9 pl-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5E50]/20" />
        </div>
        <select value={natFilter} onChange={e => setNatFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm">
          <option value="all">جميع الجنسيات</option>
          {Object.keys(natFlags).map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <select value={profFilter} onChange={e => setProfFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm">
          <option value="all">جميع المهن</option>
          {allProfessions.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50">
              <th className="text-right px-4 py-3 font-semibold text-gray-600">الاسم</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">الجنسية</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">المهن</th>
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
                  <td className="px-4 py-3">
                    <button onClick={() => router.push(`/dashboard/workers/${w.id}`)} className="font-semibold text-[#0B5E50] hover:underline flex items-center gap-1.5">
                      {w.nationalityFlag} {w.nameAr}
                    </button>
                  </td>
                  <td className="px-4 py-3">{w.nationality}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {w.professions.map(p => (
                        <span key={p} className={`px-2 py-0.5 rounded-lg text-[11px] font-medium ${professionColors[p] || 'bg-gray-100 text-gray-600'}`}>{p}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">{w.age}</td>
                  <td className="px-4 py-3">{w.experienceYears} سنوات</td>
                  <td className="px-4 py-3 font-bold">{w.monthlySalary.toLocaleString('ar-SA')} ريال</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${w.isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {w.isAvailable ? 'متاح' : 'غير متاح'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(w.joinedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => router.push(`/dashboard/workers/${w.id}`)} className="p-1.5 rounded-lg hover:bg-[#0B5E50]/10 text-[#0B5E50]" title="عرض الملف"><Eye size={14} /></button>
                      <button onClick={() => openEdit(w)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500" title="تعديل"><Pencil size={14} /></button>
                      <button onClick={() => setDeleteId(w.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400" title="حذف"><Trash2 size={14} /></button>
                    </div>
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
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{editWorker ? 'تعديل العامل' : 'إضافة عامل جديد'}</h3>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <input value={form.nameAr} onChange={e => setForm({ ...form, nameAr: e.target.value })} placeholder="الاسم" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" />

              <div className="grid grid-cols-2 gap-3">
                <select value={form.nationality} onChange={e => setForm({ ...form, nationality: e.target.value })} className="px-3 py-2 rounded-xl border border-gray-200 text-sm">
                  {Object.keys(natFlags).map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <select value={form.religion} onChange={e => setForm({ ...form, religion: e.target.value })} className="px-3 py-2 rounded-xl border border-gray-200 text-sm">
                  <option>مسلمة</option><option>مسلم</option><option>مسيحية</option><option>هندوسية</option><option>هندوسي</option>
                </select>
              </div>

              {/* Multi-profession checkboxes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">المهن (يمكن اختيار أكثر من مهنة)</label>
                <div className="flex flex-wrap gap-2">
                  {allProfessions.map(p => (
                    <button key={p} type="button" onClick={() => toggleProfession(p)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                        form.professions.includes(p)
                          ? 'bg-[#0B5E50] text-white border-[#0B5E50]'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-[#0B5E50]/40'
                      }`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-xs text-gray-500">العمر</label><input type="number" value={form.age} onChange={e => setForm({ ...form, age: +e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" /></div>
                <div><label className="text-xs text-gray-500">الخبرة (سنوات)</label><input type="number" value={form.experienceYears} onChange={e => setForm({ ...form, experienceYears: +e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" /></div>
                <div><label className="text-xs text-gray-500">الراتب</label><input type="number" value={form.monthlySalary} onChange={e => setForm({ ...form, monthlySalary: +e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" /></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <select value={form.maritalStatus} onChange={e => setForm({ ...form, maritalStatus: e.target.value })} className="px-3 py-2 rounded-xl border border-gray-200 text-sm">
                  <option>عزباء</option><option>متزوجة</option><option>متزوج</option><option>أرملة</option><option>مطلقة</option>
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-xs text-gray-500">الطول</label><input type="number" value={form.height} onChange={e => setForm({ ...form, height: +e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" /></div>
                  <div><label className="text-xs text-gray-500">الوزن</label><input type="number" value={form.weight} onChange={e => setForm({ ...form, weight: +e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" /></div>
                </div>
              </div>

              <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="نبذة مختصرة..." className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm min-h-[60px]" />

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">صورة العامل</label>
                <label className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-gray-300 hover:border-[#0B5E50]/40 cursor-pointer transition-colors bg-gray-50">
                  {form.photoUrl ? (
                    <img src={form.photoUrl} alt="preview" className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center"><Upload size={18} className="text-gray-400" /></div>
                  )}
                  <div className="flex-1"><p className="text-sm text-gray-600">{form.photoUrl ? 'تم رفع الصورة — اضغط لتغييرها' : 'اضغط لرفع صورة العامل'}</p><p className="text-[11px] text-gray-400">JPG, PNG — أقصى حجم 5MB</p></div>
                  <input type="file" accept="image/*" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (f) { const url = await readFileAsDataUrl(f); setForm(prev => ({ ...prev, photoUrl: url })); } }} />
                </label>
              </div>

              {/* CV Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">السيرة الذاتية (CV)</label>
                <label className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-gray-300 hover:border-[#0B5E50]/40 cursor-pointer transition-colors bg-gray-50">
                  {form.cvImageUrl ? (
                    <img src={form.cvImageUrl} alt="cv" className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center"><ImageIcon size={18} className="text-gray-400" /></div>
                  )}
                  <div className="flex-1"><p className="text-sm text-gray-600">{form.cvImageUrl ? 'تم رفع السيرة الذاتية — اضغط لتغييرها' : 'اضغط لرفع صورة السيرة الذاتية'}</p><p className="text-[11px] text-gray-400">JPG, PNG, PDF</p></div>
                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (f) { const url = await readFileAsDataUrl(f); setForm(prev => ({ ...prev, cvImageUrl: url })); } }} />
                </label>
              </div>

              {/* Document Uploads */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">المستندات</label>
                <div className="space-y-2">
                  {(['passport', 'iqama', 'medical'] as const).map(docType => {
                    const labels: Record<string, string> = { passport: 'جواز السفر', iqama: 'الإقامة', medical: 'التقرير الطبي' };
                    const existing = form.documents.find(d => d.type === docType);
                    return (
                      <label key={docType} className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-200 hover:border-[#0B5E50]/30 cursor-pointer transition-colors bg-gray-50">
                        {existing?.imageUrl ? (
                          <img src={existing.imageUrl} alt={docType} className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center"><Upload size={14} className="text-gray-400" /></div>
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700">{labels[docType]}</p>
                          <p className="text-[11px] text-gray-400">{existing ? '✓ تم الرفع' : 'لم يتم الرفع بعد'}</p>
                        </div>
                        <input type="file" accept="image/*,.pdf" className="hidden" onChange={async e => {
                          const f = e.target.files?.[0];
                          if (f) {
                            const url = await readFileAsDataUrl(f);
                            const newDoc: WorkerDocument = { id: `new-${docType}-${Date.now()}`, type: docType, label: labels[docType], imageUrl: url, uploadedAt: new Date().toISOString().split('T')[0], verified: false };
                            setForm(prev => ({ ...prev, documents: [...prev.documents.filter(d => d.type !== docType), newDoc] }));
                          }
                        }} />
                      </label>
                    );
                  })}
                </div>
              </div>

              <label className="flex items-center gap-2"><input type="checkbox" checked={form.isAvailable} onChange={e => setForm({ ...form, isAvailable: e.target.checked })} /><span className="text-sm">متاح</span></label>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleSave} className="flex-1 py-2.5 bg-[#0B5E50] text-white rounded-xl font-semibold hover:bg-[#073D34] transition-colors">حفظ</button>
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors">إلغاء</button>
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
