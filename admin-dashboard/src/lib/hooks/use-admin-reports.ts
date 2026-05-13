'use client';

import { useQuery } from '@tanstack/react-query';
import type {
  AdminActiveWorkersResponse,
  AdminOrdersByStatusReport,
  AdminOverviewResponse,
  AdminRefundsReport,
  AdminRevenueReport,
} from '@mawared/api-client';
import { api } from '@/lib/api';

// =====================================================================
// /v1/admin/reports/*
//
// Reports change every minute (new orders, new payments) — staleTime is
// kept short. refetchOnWindowFocus is inherited from the global default,
// which is what we want for an ops dashboard.
// =====================================================================

const REPORTS_KEY = ['admin', 'reports'] as const;

export function useAdminOverview(branchId?: string) {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'overview', branchId ?? null],
    queryFn: () => api.admin.reports.overview(branchId),
    staleTime: 30 * 1000,
  });
}

export function useAdminActiveWorkers(branchId?: string) {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'active-workers', branchId ?? null],
    queryFn: () => api.admin.reports.activeWorkers(branchId),
    staleTime: 60 * 1000,
  });
}

export function useAdminRevenue(from: string, to: string, branchId?: string) {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'revenue', { from, to, branchId: branchId ?? null }],
    queryFn: () => api.admin.reports.revenue(from, to, branchId),
    enabled: Boolean(from && to),
    staleTime: 60 * 1000,
  });
}

export function useAdminOrdersByStatus(from: string, to: string, branchId?: string) {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'orders', { from, to, branchId: branchId ?? null }],
    queryFn: () => api.admin.reports.ordersByStatus(from, to, branchId),
    enabled: Boolean(from && to),
    staleTime: 60 * 1000,
  });
}

export function useAdminRefunds(from: string, to: string, branchId?: string) {
  return useQuery({
    queryKey: [...REPORTS_KEY, 'refunds', { from, to, branchId: branchId ?? null }],
    queryFn: () => api.admin.reports.refunds(from, to, branchId),
    enabled: Boolean(from && to),
    staleTime: 60 * 1000,
  });
}

export type {
  AdminActiveWorkersResponse,
  AdminOrdersByStatusReport,
  AdminOverviewResponse,
  AdminRefundsReport,
  AdminRevenueReport,
};
