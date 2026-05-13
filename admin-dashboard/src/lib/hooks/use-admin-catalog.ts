'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { ServiceCategory, ServicePackage } from '@mawared/api-client';
import { api } from '@/lib/api';

// =====================================================================
// /v1/admin/services and /v1/admin/packages
// =====================================================================

const CATALOG_KEY = ['admin', 'catalog'] as const;
const SERVICES_KEY = [...CATALOG_KEY, 'services'] as const;
const PACKAGES_KEY = [...CATALOG_KEY, 'packages'] as const;

// ---------- Services ----------

export function servicesListKey() {
  return [...SERVICES_KEY, 'list'] as const;
}

export function serviceDetailKey(id: string) {
  return [...SERVICES_KEY, 'detail', id] as const;
}

export function useAdminServices() {
  return useQuery({
    queryKey: servicesListKey(),
    queryFn: () => api.admin.catalog.services.list(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminService(id: string | null) {
  return useQuery({
    queryKey: id ? serviceDetailKey(id) : ['admin', 'services', 'detail', 'null'],
    queryFn: () => {
      if (!id) throw new Error('useAdminService called without an id');
      return api.admin.catalog.services.findById(id);
    },
    enabled: !!id,
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<ServiceCategory> & { slug: string }) =>
      api.admin.catalog.services.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SERVICES_KEY });
    },
  });
}

interface UpdateServiceVars {
  id: string;
  body: Partial<ServiceCategory>;
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: UpdateServiceVars) => api.admin.catalog.services.update(id, body),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: SERVICES_KEY });
      qc.invalidateQueries({ queryKey: serviceDetailKey(id) });
    },
  });
}

export function useDeactivateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.admin.catalog.services.deactivate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SERVICES_KEY });
    },
  });
}

// ---------- Packages ----------

export function packagesListKey(serviceId?: string) {
  return [...PACKAGES_KEY, 'list', serviceId ?? null] as const;
}

export function packageDetailKey(id: string) {
  return [...PACKAGES_KEY, 'detail', id] as const;
}

export function useAdminPackages(serviceId?: string) {
  return useQuery({
    queryKey: packagesListKey(serviceId),
    queryFn: () => api.admin.catalog.packages.list(serviceId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminPackage(id: string | null) {
  return useQuery({
    queryKey: id ? packageDetailKey(id) : ['admin', 'packages', 'detail', 'null'],
    queryFn: () => {
      if (!id) throw new Error('useAdminPackage called without an id');
      return api.admin.catalog.packages.findById(id);
    },
    enabled: !!id,
  });
}

export function useCreatePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<ServicePackage> & { serviceId: string }) =>
      api.admin.catalog.packages.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PACKAGES_KEY });
    },
  });
}

interface UpdatePackageVars {
  id: string;
  body: Partial<ServicePackage>;
}

export function useUpdatePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: UpdatePackageVars) => api.admin.catalog.packages.update(id, body),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: PACKAGES_KEY });
      qc.invalidateQueries({ queryKey: packageDetailKey(id) });
    },
  });
}

export function useDeactivatePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.admin.catalog.packages.deactivate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PACKAGES_KEY });
    },
  });
}

export type { ServiceCategory, ServicePackage };

// ---------- Display helpers ----------

export const PACKAGE_TYPE_LABELS: Record<ServicePackage['type'], string> = {
  HOURLY: 'بالساعة',
  MONTHLY: 'شهري',
};

export const DURATION_UNIT_LABELS: Record<string, string> = {
  HOUR: 'ساعة',
  DAY: 'يوم',
  WEEK: 'أسبوع',
  MONTH: 'شهر',
};

export const DURATION_UNITS = ['HOUR', 'DAY', 'WEEK', 'MONTH'] as const;
