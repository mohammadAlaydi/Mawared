'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { AdminNotification, AdminNotificationsResponse } from '@mawared/api-client';
import { api } from '@/lib/api';
import { notificationsReadStore, parseReadIds } from '@/lib/notifications-read-store';

// =====================================================================
// /v1/admin/notifications
//
// Live business-activity feed for the header bell. Polls in the
// background so the unread badge stays current without a manual refresh.
// Read/unread is tracked per-browser (see notifications-read-store).
// =====================================================================

const NOTIFICATIONS_KEY = ['admin', 'notifications'] as const;
const POLL_INTERVAL_MS = 60 * 1000;

export interface AdminNotificationView extends AdminNotification {
  isRead: boolean;
}

export interface UseAdminNotificationsResult {
  items: AdminNotificationView[];
  unreadCount: number;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

export function useAdminNotifications(): UseAdminNotificationsResult {
  const query = useQuery<AdminNotificationsResponse>({
    queryKey: [...NOTIFICATIONS_KEY],
    queryFn: () => api.admin.notifications.list(),
    staleTime: 30 * 1000,
    refetchInterval: POLL_INTERVAL_MS,
  });

  const readSnapshot = useSyncExternalStore(
    notificationsReadStore.subscribe,
    notificationsReadStore.getSnapshot,
    notificationsReadStore.getServerSnapshot,
  );

  const readIds = useMemo(() => parseReadIds(readSnapshot), [readSnapshot]);

  const items = useMemo<AdminNotificationView[]>(
    () =>
      (query.data?.items ?? []).map((n) => ({
        ...n,
        isRead: readIds.has(n.id),
      })),
    [query.data, readIds],
  );

  const unreadCount = useMemo(() => items.filter((n) => !n.isRead).length, [items]);

  const markRead = useCallback((id: string) => {
    notificationsReadStore.markRead(id);
  }, []);

  const markAllRead = useCallback(() => {
    notificationsReadStore.markAllRead((query.data?.items ?? []).map((n) => n.id));
  }, [query.data]);

  return {
    items,
    unreadCount,
    isLoading: query.isPending,
    isError: query.isError,
    refetch: query.refetch,
    markRead,
    markAllRead,
  };
}
