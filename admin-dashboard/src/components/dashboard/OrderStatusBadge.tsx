import { OrderStatus } from '@/types';

const statusConfig: Record<OrderStatus, { labelAr: string; className: string }> = {
  submitted: { labelAr: 'تم الإرسال', className: 'bg-blue-100 text-blue-700' },
  payment_pending: { labelAr: 'بانتظار الدفع', className: 'bg-yellow-100 text-yellow-700' },
  payment_completed: { labelAr: 'تم الدفع', className: 'bg-teal-100 text-teal-700' },
  under_review: { labelAr: 'قيد المراجعة', className: 'bg-purple-100 text-purple-700' },
  processing: { labelAr: 'جاري المعالجة', className: 'bg-orange-100 text-orange-700' },
  worker_selected: { labelAr: 'تم اختيار العامل', className: 'bg-amber-100 text-amber-700' },
  contract_in_progress: { labelAr: 'العقد قيد الإعداد', className: 'bg-indigo-100 text-indigo-700' },
  arrival_in_progress: { labelAr: 'العامل في الطريق', className: 'bg-cyan-100 text-cyan-700' },
  completed: { labelAr: 'مكتمل', className: 'bg-green-100 text-green-700' },
  cancelled: { labelAr: 'ملغى', className: 'bg-red-100 text-red-700' },
};

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status];
  return <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold ${config.className}`}>{config.labelAr}</span>;
}

export { statusConfig };
