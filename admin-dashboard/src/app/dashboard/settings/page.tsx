'use client';
import { useState } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { toast } from 'sonner';

const roles = [
  { name: 'مشرف عام', permissions: 'كامل الصلاحيات' },
  { name: 'العمليات', permissions: 'إدارة الطلبات والعمال' },
  { name: 'المبيعات', permissions: 'عرض الطلبات والعملاء' },
  { name: 'المالية', permissions: 'إدارة المدفوعات والتقارير' },
  { name: 'الدعم', permissions: 'عرض الطلبات والعملاء فقط' },
];

export default function SettingsPage() {
  const [notif, setNotif] = useState(true);
  const [payment, setPayment] = useState(true);
  const [maintenance, setMaintenance] = useState(false);

  const Toggle = ({ value, onChange, danger }: { value: boolean; onChange: (v: boolean) => void; danger?: boolean }) => (
    <button onClick={() => { onChange(!value); toast.success('تم حفظ الإعدادات'); }} className={`relative w-11 h-6 rounded-full transition-colors ${value ? (danger ? 'bg-red-500' : 'bg-[#2D5BE4]') : 'bg-gray-300'}`}>
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${value ? 'start-0.5' : 'start-5'}`} />
    </button>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="الإعدادات" />

      {/* Roles */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-bold text-gray-900 mb-4">الأدوار والصلاحيات</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead><tr className="bg-gray-50"><th className="text-right px-4 py-3 font-semibold text-gray-600">الدور</th><th className="text-right px-4 py-3 font-semibold text-gray-600">الصلاحيات</th></tr></thead>
            <tbody>{roles.map(r => (
              <tr key={r.name} className="border-t border-gray-50"><td className="px-4 py-3 font-bold">{r.name}</td><td className="px-4 py-3 text-gray-600">{r.permissions}</td></tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      {/* App Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-bold text-gray-900 mb-4">إعدادات التطبيق</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 py-2"><div className="min-w-0"><p className="font-medium text-gray-900">تفعيل الإشعارات للطلبات الجديدة</p><p className="text-xs text-gray-400">إرسال إشعار عند استلام طلب جديد</p></div><div className="shrink-0"><Toggle value={notif} onChange={setNotif} /></div></div>
          <div className="flex items-center justify-between gap-3 py-2 border-t border-gray-100"><div className="min-w-0"><p className="font-medium text-gray-900">تفعيل الدفع الإلكتروني</p><p className="text-xs text-gray-400">السماح بالدفع عبر مدى وفيزا</p></div><div className="shrink-0"><Toggle value={payment} onChange={setPayment} /></div></div>
          <div className="flex items-center justify-between gap-3 py-2 border-t border-gray-100"><div className="min-w-0"><p className="font-medium text-red-600">وضع الصيانة</p><p className="text-xs text-gray-400">تعطيل الوصول للمستخدمين مؤقتاً</p></div><div className="shrink-0"><Toggle value={maintenance} onChange={setMaintenance} danger /></div></div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-bold text-gray-900 mb-4">معلومات التواصل</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div><label className="block text-sm font-medium text-gray-600 mb-1">الهاتف</label><input defaultValue="+966 11 234 5678" dir="ltr" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-600 mb-1">البريد الإلكتروني</label><input defaultValue="info@mawared.sa" dir="ltr" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-600 mb-1">واتساب</label><input defaultValue="+966 11 234 5678" dir="ltr" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" /></div>
        </div>
      </div>
    </div>
  );
}
