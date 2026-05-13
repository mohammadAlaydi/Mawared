'use client';

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { AdminCustomer, AdminCustomerDetail } from '@mawared/api-client';
import { api } from '@/lib/api';

// =====================================================================
// /v1/admin/customers
// =====================================================================

export interface CustomerFilters {
  q?: string;
  cursor?: string;
  limit?: number;
}

const CUSTOMERS_KEY = ['admin', 'customers'] as const;

export function customersListKey(filters: CustomerFilters) {
  return [...CUSTOMERS_KEY, 'list', filters] as const;
}

export function customerDetailKey(id: string) {
  return [...CUSTOMERS_KEY, 'detail', id] as const;
}

export function useAdminCustomers(filters: CustomerFilters = {}) {
  return useQuery({
    queryKey: customersListKey(filters),
    queryFn: () => api.admin.customers.list(filters),
    placeholderData: keepPreviousData,
  });
}

export function useAdminCustomer(id: string | null) {
  return useQuery({
    queryKey: id ? customerDetailKey(id) : ['admin', 'customers', 'detail', 'null'],
    queryFn: () => {
      if (!id) throw new Error('useAdminCustomer called without an id');
      return api.admin.customers.findById(id);
    },
    enabled: !!id,
  });
}

export function useSuspendCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.admin.customers.suspend(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: [...CUSTOMERS_KEY] });
      qc.invalidateQueries({ queryKey: customerDetailKey(id) });
    },
  });
}

export function useReactivateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.admin.customers.reactivate(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: [...CUSTOMERS_KEY] });
      qc.invalidateQueries({ queryKey: customerDetailKey(id) });
    },
  });
}

export type { AdminCustomer, AdminCustomerDetail };
