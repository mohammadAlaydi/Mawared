'use client';
import { useState } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { Home, Car, Baby, Heart } from 'lucide-react';
import { toast } from 'sonner';

const initialServices = [
  { id: '1', name: 'عاملة منزلية', desc: 'تنظيف، طبخ، كي، وترتيب المنزل', icon: Home, active: true },
  { id: '2', name: 'سائق خاص', desc: 'قيادة احترافية وتوصيل يومي', icon: Car, active: true },
  { id: '3', name: 'مربية أطفال', desc: 'رعاية شاملة وتعليم مبكر للأطفال', icon: Baby, active: true },
  { id: '4', name: 'رعاية مسنين', desc: 'مرافقة ورعاية صحية لكبار السن', icon: Heart, active: true },
];

export default function ServicesPage() {
  const [services, setServices] = useState(initialServices);
  const toggle = (id: string) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
    toast.success('تم تحديث حالة الخدمة');
  };

  return (
    <div>
      <PageHeader title="الخدمات" subtitle="إدارة أنواع الخدمات المتاحة" />
      <div className="grid sm:grid-cols-2 gap-4">
        {services.map(s => (
          <div key={s.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#0B5E50]/10 flex items-center justify-center"><s.icon size={24} className="text-[#0B5E50]" /></div>
              <button onClick={() => toggle(s.id)} className={`relative w-11 h-6 rounded-full transition-colors ${s.active ? 'bg-[#0B5E50]' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${s.active ? 'left-0.5' : 'left-5'}`} />
              </button>
            </div>
            <h3 className="font-bold text-lg text-gray-900 mb-1">{s.name}</h3>
            <p className="text-sm text-gray-500">{s.desc}</p>
            <span className={`inline-block mt-3 px-2 py-0.5 rounded-lg text-xs font-semibold ${s.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{s.active ? 'مفعّلة' : 'معطّلة'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
