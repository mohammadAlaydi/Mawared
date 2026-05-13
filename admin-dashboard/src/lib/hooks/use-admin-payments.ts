'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { AdminPaymentIntent, AdminRefund } from '@mawared/api-client';
import { api } from '@/lib/api';

// =====================================================================
// /v1/admin/payments
// =====================================================================

export interface PaymentFilters {
  status?: string;
  orderId?: string;
  from?: string;
  to?: string;
  cursor?: string;
  limit?: number;
}

const PAYMENTS_KEY = ['admin', 'payments'] as const;
const REFUNDS_KEY = ['admin', 'refunds'] as const;

export function paymentsListKey(filters: PaymentFilters) {
  return [...PAYMENTS_KEY, 'list', filters] as const;
}

export function paymentDetailKey(id: string) {
  return [...PAYMENTS_KEY, 'detail', id] as const;
}

export function useAdminPayments(filters: PaymentFilters = {}) {
  return useQuery({
    queryKey: paymentsListKey(filters),
    queryFn: () => api.admin.payments.list(filters),
    placeholderData: keepPreviousData,
  });
}

export function useAdminPayment(id: string | null) {
  return useQuery({
    queryKey: id ? paymentDetailKey(id) : ['admin', 'payments', 'detail', 'null'],
    queryFn: () => {
      if (!id) throw new Error('useAdminPayment called without an id');
      return api.admin.payments.findById(id);
    },
    enabled: !!id,
  });
}

export function useAdminRefunds(filters: Omit<PaymentFilters, 'orderId'> = {}) {
  return useQuery({
    queryKey: [...REFUNDS_KEY, 'list', filters],
    queryFn: () => api.admin.payments.refunds(filters),
    placeholderData: keepPreviousData,
  });
}

export type { AdminPaymentIntent, AdminRefund };

// Display helpers for the PaymentIntent.status enum, which mirrors Stripe's.
export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  REQUIRES_PAYMENT_METHOD: 'بانتظار وسيلة الدفع',
  REQUIRES_CONFIRMATION: 'بانتظار التأكيد',
  REQUIRES_ACTION: 'إجراء مطلوب',
  PROCESSING: 'قيد المعالجة',
  SUCCEEDED: 'ناجح',
  CANCELED: 'ملغى',
  FAILED: 'فاشل',
};

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  REQUIRES_PAYMENT_METHOD: 'bg-yellow-100 text-yellow-700',
  REQUIRES_CONFIRMATION: 'bg-yellow-100 text-yellow-700',
  REQUIRES_ACTION: 'bg-amber-100 text-amber-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  SUCCEEDED: 'bg-green-100 text-green-700',
  CANCELED: 'bg-gray-100 text-gray-500',
  FAILED: 'bg-red-100 text-red-700',
};

export const PAYMENT_STATUSES = [
  'REQUIRES_PAYMENT_METHOD',
  'REQUIRES_CONFIRMATION',
  'REQUIRES_ACTION',
  'PROCESSING',
  'SUCCEEDED',
  'CANCELED',
  'FAILED',
] as const;
