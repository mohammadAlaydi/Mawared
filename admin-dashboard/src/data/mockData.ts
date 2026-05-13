// =====================================================================
// DEPRECATED — every page now reads from the real backend via TanStack
// Query hooks under src/lib/hooks/use-admin-*. This file is kept as a
// stub so any stragglers fail loudly instead of silently rendering
// fake data.
//
// Safe to delete once a `pnpm typecheck` confirms no remaining imports.
// =====================================================================

export const mockOrders: never[] = [];
export const mockWorkers: never[] = [];
export const mockCustomers: never[] = [];
export const mockPayments: never[] = [];
export const mockServices: never[] = [];
export const mockPackages: never[] = [];
export const ordersOverTime: never[] = [];
export const ordersByStatus: never[] = [];
export const workersByNationality: never[] = [];
export const revenueByMonth: never[] = [];

export function makeWorker(): never {
  throw new Error(
    'makeWorker() from @/data/mockData has been removed. Use the resource hooks under @/lib/hooks instead.',
  );
}
