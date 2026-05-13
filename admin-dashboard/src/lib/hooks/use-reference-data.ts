'use client';

import { useQuery } from '@tanstack/react-query';
import type { Branch, Nationality } from '@mawared/api-client';
import { api } from '@/lib/api';

// =====================================================================
// Reference data (rarely changes). Long staleTime so we don't hammer the
// API every page load.
// =====================================================================

export function useNationalities() {
  return useQuery({
    queryKey: ['reference', 'nationalities'],
    queryFn: () => api.nationalities.list(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useBranches() {
  return useQuery({
    queryKey: ['reference', 'branches'],
    queryFn: () => api.branches.list(),
    staleTime: 30 * 60 * 1000,
  });
}

export type { Branch, Nationality };
