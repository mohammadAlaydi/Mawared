'use client';
import { useState } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';

const hourlyPackages = [
  { id: '1', name: 'زيارة أساسية', desc: '٤ ساعات تنظيف', duration: '٤ ساعات', price: 150, active: true },
  { id: '2', name: 'زيارة مميزة', desc: '٨ ساعات تنظيف + كي', duration: '٨ ساعات', price: 280, active: true },
  { id: '3', name: 'زيارة VIP', desc: 'يوم كامل — كل الخدمات', duration: '١٢ ساعة', price: 400, active: true },
];

const monthlyPackages = [
  { id: '1', name: 'الباقة الأساسية', desc: 'عاملة منزلية واحدة', duration: 'شهري', price: 1500, active: true },
  { id: '2', name: 'الباقة المميزة', desc: 'عاملة مدربة + خدمات شاملة', duration: 'شهري', price: 2800, active: true },
  { id: '3', name: 'الباقة الذهبية', desc: 'عاملة + سائق', duration: 'شهري', price: 4500, active: true },
];

export default function PackagesPage() {
  const [tab, setTab] = useState<'hourly' | 'monthly'>('monthly');
  const packages = tab === 'hourly' ? hourlyPackages : monthlyPackages;

  return (
    <div>
      <PageHeader title="الباقات" subtitle="إدارة باقات الأسعار" />
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
          </tr></thead>
          <tbody>
            {packages.map(p => (
              <tr key={p.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                <td className="px-4 py-3 font-bold">{p.name}</td>
                <td className="px-4 py-3 text-gray-600">{p.desc}</td>
                <td className="px-4 py-3">{p.duration}</td>
                <td className="px-4 py-3 font-bold">{p.price.toLocaleString('ar-SA')} ريال</td>
                <td className="px-4 py-3"><span className="px-2 py-1 rounded-lg text-xs font-semibold bg-green-100 text-green-700">مفعّلة</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
