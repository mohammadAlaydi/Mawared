'use client';

import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ApiError } from '@mawared/api-client';

/**
 * App-wide TanStack Query client. Created once per browser session and
 * re-used. SSR isn't a concern here — this dashboard is client-rendered.
 *
 * Defaults are tuned for an admin dashboard:
 *  - retries are off for 4xx (the user's input is wrong; retrying won't help)
 *  - staleTime is short (60s) because admins expect live data
 *  - refetchOnWindowFocus is enabled — common pattern for ops dashboards
 */
function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: true,
        retry: (failureCount, error) => {
          // Don't retry user errors (400, 401, 403, 404, 409, 422).
          if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
            return false;
          }
          return failureCount < 2;
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export function QueryProvider({ children }: { children: ReactNode }) {
  // useState ensures one QueryClient per component instance lifetime,
  // not one per render. Don't move this to module scope — that would
  // share state across users on the same Next.js process (in dev/SSR).
  const [client] = useState(() => makeQueryClient());

  return (
    <QueryClientProvider client={client}>
      {children}
      {process.env.NODE_ENV !== 'production' && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
      )}
    </QueryClientProvider>
  );
}
