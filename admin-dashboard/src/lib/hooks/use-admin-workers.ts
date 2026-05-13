'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { Worker } from '@mawared/api-client';
import { api } from '@/lib/api';

// =====================================================================
// Hooks for /v1/admin/workers.
//
// The backend list endpoint is *unpaginated* — it returns up to 200
// workers per request. We do client-side filtering and search.
// If we ever exceed 200 workers, add cursor pagination on the backend
// and mirror the orders pattern.
// =====================================================================

const WORKERS_KEY = ['admin', 'workers'] as const;

export function adminWorkersListKey() {
  return [...WORKERS_KEY, 'list'] as const;
}

export function adminWorkerDetailKey(id: string) {
  return [...WORKERS_KEY, 'detail', id] as const;
}

export function useAdminWorkers() {
  return useQuery({
    queryKey: adminWorkersListKey(),
    queryFn: () => api.admin.workers.list(),
    // Workers don't change minute-to-minute; longer staleTime keeps the
    // network quiet without harming the UX.
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminWorker(id: string | null) {
  return useQuery({
    queryKey: id ? adminWorkerDetailKey(id) : ['admin', 'workers', 'detail', 'null'],
    queryFn: () => {
      if (!id) throw new Error('useAdminWorker called without an id');
      return api.admin.workers.findById(id);
    },
    enabled: !!id,
  });
}

export function useCreateWorker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Worker> & { branchId: string; nationalityId: string }) =>
      api.admin.workers.create(body as Partial<Worker>),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...WORKERS_KEY, 'list'] });
    },
  });
}

interface UpdateWorkerVars {
  id: string;
  body: Partial<Worker>;
}

export function useUpdateWorker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: UpdateWorkerVars) => api.admin.workers.update(id, body),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: [...WORKERS_KEY, 'list'] });
      qc.invalidateQueries({ queryKey: adminWorkerDetailKey(id) });
    },
  });
}

export function useDeleteWorker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.admin.workers.delete(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: [...WORKERS_KEY, 'list'] });
      qc.invalidateQueries({ queryKey: adminWorkerDetailKey(id) });
    },
  });
}

export type { Worker };
