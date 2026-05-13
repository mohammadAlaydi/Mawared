'use client';

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { Order, OrderStatus } from '@mawared/api-client';
import { api } from '@/lib/api';
import type { TransitionEvent } from '@/lib/order-status';

// =====================================================================
// Hooks for /v1/admin/orders.
//
// Wraps MawaredClient.admin.orders.* with TanStack Query so pages get
// caching, retries, and optimistic updates "for free". Pagination is
// cursor-based (the backend is cursor-only).
// =====================================================================

export interface AdminOrderFilters {
  status?: OrderStatus;
  branchId?: string;
  customerPhone?: string;
  from?: string; // ISO datetime
  to?: string;
  cursor?: string;
  limit?: number;
}

const ORDERS_KEY = ['admin', 'orders'] as const;

export function adminOrdersQueryKey(filters: AdminOrderFilters) {
  return [...ORDERS_KEY, 'list', filters] as const;
}

export function adminOrderQueryKey(id: string) {
  return [...ORDERS_KEY, 'detail', id] as const;
}

/**
 * Paged list of orders. `keepPreviousData` means switching pages or filters
 * keeps the old result visible until the new one arrives — feels much
 * snappier than flashing a spinner.
 */
export function useAdminOrders(filters: AdminOrderFilters = {}) {
  return useQuery({
    queryKey: adminOrdersQueryKey(filters),
    queryFn: () =>
      api.admin.orders.list({
        status: filters.status,
        branchId: filters.branchId,
        customerPhone: filters.customerPhone,
        from: filters.from,
        to: filters.to,
        cursor: filters.cursor,
        limit: filters.limit ?? 20,
      }),
    placeholderData: keepPreviousData,
  });
}

/** Full order detail including status history, payment intents, etc. */
export function useAdminOrder(id: string | null) {
  return useQuery({
    queryKey: id ? adminOrderQueryKey(id) : ['admin', 'orders', 'detail', 'null'],
    queryFn: () => {
      if (!id) throw new Error('useAdminOrder called without an id');
      return api.admin.orders.findById(id);
    },
    enabled: !!id,
  });
}

interface TransitionVars {
  orderId: string;
  event: TransitionEvent;
  note?: string;
}

/**
 * POST /v1/admin/orders/:id/transition with optimistic invalidation —
 * after a successful transition we invalidate every list + detail query
 * so the UI reflects the new status without manual refetch.
 */
export function useTransitionOrder() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, event, note }: TransitionVars) =>
      api.admin.orders.transition(orderId, { event, note }),
    onSuccess: (_data, { orderId }) => {
      // Invalidate all orders-list and the touched detail.
      qc.invalidateQueries({ queryKey: [...ORDERS_KEY, 'list'] });
      qc.invalidateQueries({ queryKey: adminOrderQueryKey(orderId) });
    },
  });
}

interface RefundVars {
  orderId: string;
  amountMinor?: string;
  reason?: string;
}

export function useRefundOrder() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, amountMinor, reason }: RefundVars) =>
      api.admin.orders.refund(orderId, { amountMinor, reason }),
    onSuccess: (_data, { orderId }) => {
      qc.invalidateQueries({ queryKey: [...ORDERS_KEY, 'list'] });
      qc.invalidateQueries({ queryKey: adminOrderQueryKey(orderId) });
    },
  });
}

export type { Order, OrderStatus };
