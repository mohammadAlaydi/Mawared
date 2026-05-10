'use client';
import { use } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboard } from '@/lib/dashboard-context';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { Worker, WorkerDocument } from '@/types';
import {
  ArrowRight, MapPin, Calendar, Briefcase, Star, Heart, Globe, Ruler, Weight,
  FileText, ShieldCheck, ShieldAlert, Clock, User, ChevronLeft, Pencil, Trash2,
  Phone, BadgeCheck, ImageIcon, X, Upload
} from 'lucide-react';

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
  'عاملة منزلية': 'bg-blue-100 text-blue-700 border-blue-200',
  'سائق خاص': 'bg-purple-100 text-purple-700 border-purple-200',
  'مربية أطفال': 'bg-pink-100 text-pink-700 border-pink-200',
  'رعاية مسنين': 'bg-amber-100 text-amber-700 border-amber-200',
};

const docTypeLabels: Record<string, { icon: typeof FileText; color: string }> = {
  passport: { icon: Globe, color: 'text-blue-600 bg-blue-50' },
  iqama: { icon: BadgeCheck, color: 'text-green-600 bg-green-50' },
  medical: { icon: Heart, color: 'text-red-600 bg-red-50' },
  contract: { icon: FileText, color: 'text-purple-600 bg-purple-50' },
  other: { icon: FileText, color: 'text-gray-600 bg-gray-50' },
};

export default function WorkerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { workers, updateWorker } = useDashboard();
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const worker = workers.find(w => w.id === id);

  // Edit form state
  const [form, setForm] = useState(() => worker ? {
    nameAr: worker.nameAr, nationality: worker.nationality, nationalityFlag: worker.nationalityFlag,
    professions: [...worker.professions], experienceYears: worker.experienceYears,
    age: worker.age, monthlySalary: worker.monthlySalary, isAvailable: worker.isAvailable,
    joinedAt: worker.joinedAt, photoUrl: worker.photoUrl, cvImageUrl: worker.cvImageUrl,
    bio: worker.bio, religion: worker.religion, maritalStatus: worker.maritalStatus,
    languages: [...worker.languages], height: worker.height, weight: worker.weight,
    documents: worker.documents, workHistory: worker.workHistory,
  } : null);

  const openEdit = () => {
    if (!worker) return;
    setForm({
      nameAr: worker.nameAr, nationality: worker.nationality, nationalityFlag: worker.nationalityFlag,
      professions: [...worker.professions], experienceYears: worker.experienceYears,
      age: worker.age, monthlySalary: worker.monthlySalary, isAvailable: worker.isAvailable,
      joinedAt: worker.joinedAt, photoUrl: worker.photoUrl, cvImageUrl: worker.cvImageUrl,
      bio: worker.bio, religion: worker.religion, maritalStatus: worker.maritalStatus,
      languages: [...worker.languages], height: worker.height, weight: worker.weight,
      documents: worker.documents, workHistory: worker.workHistory,
    });
    setShowEditModal(true);
  };

  const toggleProfession = (prof: string) => {
    if (!form) return;
    setForm(prev => {
      if (!prev) return prev;
      const has = prev.professions.includes(prof);
      const next = has ? prev.professions.filter(p => p !== prof) : [...prev.professions, prof];
      return { ...prev, professions: next.length ? next : prev.professions };
    });
  };

  const handleSave = () => {
    if (!form || !worker) return;
    if (!form.nameAr.trim()) { toast.error('يرجى إدخال الاسم'); return; }
    const data = { ...form, nationalityFlag: natFlags[form.nationality] || '🏳️' };
    updateWorker({ ...worker, ...data });
    toast.success('تم تحديث بيانات العامل');
    setShowEditModal(false);
  };

  if (!worker) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <User size={40} className="text-gray-300" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">العامل غير موجود</h2>
        <p className="text-gray-500 mb-4">لم يتم العثور على العامل المطلوب</p>
        <button onClick={() => router.push('/dashboard/workers')} className="px-4 py-2 bg-[#0B5E50] text-white rounded-xl text-sm font-semibold hover:bg-[#073D34]">
          العودة للقائمة
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back button */}
      <button onClick={() => router.push('/dashboard/workers')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#0B5E50] mb-4 transition-colors">
        <ArrowRight size={16} />
        العودة لإدارة العمالة
      </button>

      {/* ─── Hero Header ─── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        {/* Banner */}
        <div className="h-36 bg-gradient-to-l from-[#0B5E50] via-[#1A7A69] to-[#0B5E50] relative">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23fff\' fill-opacity=\'1\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M0 40L40 0H20L0 20M40 40V20L20 40\'/%3E%3C/g%3E%3C/svg%3E")', backgroundSize: '20px' }} />
        </div>
        {/* Profile info area */}
        <div className="relative px-6 pb-6">
          {/* Edit button — top left (visually top-right in RTL) */}
          <div className="absolute left-6 top-4">
            <button onClick={openEdit} className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-200 transition-colors">
              <Pencil size={13} /> تعديل
            </button>
          </div>
          {/* Avatar — overlaps the banner */}
          <div className="flex items-end gap-5 -mt-14">
            <div className="w-28 h-28 rounded-2xl shadow-lg border-4 border-white shrink-0 overflow-hidden bg-gradient-to-br from-[#C9A84C] to-[#E0C472]">
              {worker.photoUrl ? (
                <img src={worker.photoUrl} alt={worker.nameAr} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-3xl font-black">{worker.nameAr.charAt(0)}</div>
              )}
            </div>
            {/* Name + Meta — vertically centered next to avatar */}
            <div className="pb-1">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h1 className="text-2xl font-black text-gray-900 leading-tight">{worker.nationalityFlag} {worker.nameAr}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${worker.isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {worker.isAvailable ? '● متاح' : '● غير متاح'}
                </span>
              </div>
              <p className="text-sm text-gray-500">{worker.nationality} · انضم {formatDate(worker.joinedAt)}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {worker.professions.map(p => (
                  <span key={p} className={`px-3 py-1 rounded-xl text-xs font-semibold border ${professionColors[p] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>{p}</span>
                ))}
              </div>
            </div>
          </div>
          {worker.bio && <p className="mt-4 text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{worker.bio}</p>}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ─── Left Column ─── */}
        <div className="lg:col-span-1 space-y-6">
          {/* Personal Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><User size={16} className="text-[#0B5E50]" /> المعلومات الشخصية</h3>
            <div className="space-y-3">
              {[
                { icon: Calendar, label: 'العمر', value: `${worker.age} سنة` },
                { icon: Heart, label: 'الديانة', value: worker.religion },
                { icon: User, label: 'الحالة الاجتماعية', value: worker.maritalStatus },
                { icon: Ruler, label: 'الطول', value: `${worker.height} سم` },
                { icon: Weight, label: 'الوزن', value: `${worker.weight} كغ` },
                { icon: Globe, label: 'اللغات', value: worker.languages.join('، ') },
                { icon: Briefcase, label: 'الخبرة', value: `${worker.experienceYears} سنوات` },
                { icon: MapPin, label: 'الجنسية', value: worker.nationality },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                    <item.icon size={14} className="text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-gray-400">{item.label}</p>
                    <p className="text-sm font-medium text-gray-800 truncate">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Salary */}
          <div className="bg-gradient-to-br from-[#0B5E50] to-[#1A7A69] rounded-2xl p-5 text-white">
            <p className="text-xs text-white/60 mb-1">الراتب الشهري</p>
            <p className="text-2xl font-black">{worker.monthlySalary.toLocaleString('ar-SA')} <span className="text-sm font-medium text-white/70">ريال</span></p>
          </div>
        </div>

        {/* ─── Right Column ─── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Documents */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><FileText size={16} className="text-[#0B5E50]" /> المستندات والوثائق</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {worker.documents.map(doc => {
                const meta = docTypeLabels[doc.type] || docTypeLabels.other;
                const DocIcon = meta.icon;
                return (
                  <button key={doc.id} onClick={() => setLightboxImg(doc.imageUrl)}
                    className="group relative bg-gray-50 rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-[#0B5E50]/20 transition-all text-right w-full">
                    {/* Document thumbnail */}
                    <div className="w-full h-28 rounded-lg bg-gray-100 mb-3 overflow-hidden relative">
                      <img src={doc.imageUrl} alt={doc.label} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <ImageIcon size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-gray-800">{doc.label}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[11px] text-gray-400">{formatDate(doc.uploadedAt)}</span>
                      <span className={`flex items-center gap-0.5 text-[11px] font-medium ${doc.verified ? 'text-green-600' : 'text-amber-500'}`}>
                        {doc.verified ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                        {doc.verified ? 'موثّق' : 'قيد التحقق'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CV Image */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><FileText size={16} className="text-[#0B5E50]" /> السيرة الذاتية (CV)</h3>
            <button onClick={() => setLightboxImg(worker.cvImageUrl)}
              className="group w-full h-64 rounded-xl overflow-hidden border border-gray-200 hover:border-[#0B5E50]/30 transition-colors relative">
              <img src={worker.cvImageUrl} alt="CV" className="w-full h-full object-cover object-top" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <div className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                  <p className="text-sm font-medium text-[#0B5E50]">اضغط لعرض السيرة الذاتية</p>
                </div>
              </div>
            </button>
          </div>

          {/* Work History */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Clock size={16} className="text-[#0B5E50]" /> سجل العمل</h3>
            {worker.workHistory.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">لا يوجد سجل عمل سابق</p>
            ) : (
              <div className="space-y-3">
                {worker.workHistory.map((h, i) => (
                  <div key={h.id} className="relative pr-6 pb-4 last:pb-0">
                    {/* Timeline line */}
                    {i < worker.workHistory.length - 1 && <div className="absolute right-[9px] top-6 bottom-0 w-0.5 bg-gray-100" />}
                    {/* Timeline dot */}
                    <div className="absolute right-0 top-1.5 w-[18px] h-[18px] rounded-full bg-[#0B5E50]/10 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-[#0B5E50]" />
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <p className="font-semibold text-sm text-gray-800">{h.customerName}</p>
                          <p className="text-xs text-gray-400">{h.serviceName}</p>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, si) => (
                            <Star key={si} size={12} className={si < h.rating ? 'text-[#C9A84C] fill-[#C9A84C]' : 'text-gray-200'} />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-1">
                        <Calendar size={11} />
                        <span>{formatDate(h.startDate)} — {h.endDate ? formatDate(h.endDate) : 'حتى الآن'}</span>
                      </div>
                      {h.notes && <p className="text-xs text-gray-500 mt-2">{h.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxImg && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setLightboxImg(null)}>
          <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setLightboxImg(null)} className="absolute -top-10 left-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/40 z-10">
              <X size={16} />
            </button>
            <div className="bg-white rounded-2xl shadow-2xl p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={lightboxImg} alt="document" className="w-full rounded-xl" style={{ maxHeight: '80vh', objectFit: 'contain' }} />
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && form && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">تعديل العامل</h3>
              <button onClick={() => setShowEditModal(false)}><X size={20} /></button>
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
                  <input type="file" accept="image/*" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (f) { const url = await readFileAsDataUrl(f); setForm(prev => prev ? { ...prev, photoUrl: url } : prev); } }} />
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
                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (f) { const url = await readFileAsDataUrl(f); setForm(prev => prev ? { ...prev, cvImageUrl: url } : prev); } }} />
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
                            setForm(prev => prev ? { ...prev, documents: [...prev.documents.filter(d => d.type !== docType), newDoc] } : prev);
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
              <button onClick={() => setShowEditModal(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
