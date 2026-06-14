'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCheck,
  CreditCard,
  Mail,
  MessageSquare,
  Phone,
  ShieldCheck,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import {
  useAdminNotifications,
  type AdminNotificationView,
} from '@/lib/hooks/use-admin-notifications';
import { formatRelativeTime } from '@/lib/utils';

type Tone = { icon: LucideIcon; iconBg: string; iconColor: string };

const TONE_BY_TYPE: Record<AdminNotificationView['type'], Tone> = {
  LEAD: { icon: MessageSquare, iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
  ORDER_REVIEW: { icon: ShieldCheck, iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
  ORDER_PAID: { icon: CreditCard, iconBg: 'bg-teal-100', iconColor: 'text-teal-600' },
  CUSTOMER_NEW: { icon: UserPlus, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
  VERIFICATION_PENDING: { icon: ShieldCheck, iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
};

export default function NotificationBell() {
  const router = useRouter();
  const { items, unreadCount, isLoading, isError, refetch, markRead, markAllRead } =
    useAdminNotifications();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on outside click + Escape.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const badge = unreadCount > 9 ? '9+' : String(unreadCount);

  const handleOpen = (item: AdminNotificationView) => {
    markRead(item.id);
    if (item.href) {
      setOpen(false);
      router.push(item.href);
    }
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-label="الإشعارات"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors shrink-0"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <>
            <span className="absolute -top-1 -start-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center" aria-hidden="true">
              {badge}
            </span>
            <span className="sr-only">{unreadCount} إشعارات غير مقروءة</span>
          </>
        )}
      </button>

      {open && (
        <>
          {/* Dim backdrop on phones so the sheet reads as a modal layer. */}
          <div
            className="fixed inset-0 bg-black/20 z-40 sm:hidden"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-label="الإشعارات"
            className="fixed inset-x-3 top-[4.25rem] max-h-[75vh] sm:absolute sm:inset-x-auto sm:end-0 sm:top-full sm:mt-2 sm:w-[22rem] sm:max-h-[28rem] bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col overflow-hidden z-50"
          >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900">الإشعارات</h2>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold text-red-600 bg-red-50 rounded-full px-2 py-0.5">
                  {unreadCount} جديدة
                </span>
              )}
            </div>
            {items.length > 0 && unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs font-medium text-[#2D5BE4] hover:underline"
              >
                <CheckCheck size={14} />
                تعليم الكل كمقروء
              </button>
            )}
          </div>

          {/* Body */}
          <div className="overflow-y-auto">
            {isLoading && <BellSkeleton />}

            {!isLoading && isError && (
              <div className="px-4 py-10 text-center">
                <p className="text-sm text-red-600 mb-3">تعذّر تحميل الإشعارات.</p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700"
                >
                  إعادة المحاولة
                </button>
              </div>
            )}

            {!isLoading && !isError && items.length === 0 && (
              <div className="px-4 py-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                  <Bell size={22} className="text-gray-300" />
                </div>
                <p className="text-sm text-gray-400">لا توجد إشعارات حالياً</p>
              </div>
            )}

            {!isLoading &&
              !isError &&
              items.map((item) => (
                <NotificationRow key={item.id} item={item} onOpen={handleOpen} />
              ))}
          </div>
          </div>
        </>
      )}
    </div>
  );
}

function NotificationRow({
  item,
  onOpen,
}: {
  item: AdminNotificationView;
  onOpen: (item: AdminNotificationView) => void;
}) {
  const tone = TONE_BY_TYPE[item.type];
  const Icon = tone.icon;
  const clickable = Boolean(item.href);

  return (
    <div
      className={`flex gap-3 px-4 py-3 border-b border-gray-50 last:border-b-0 transition-colors ${
        item.isRead ? 'bg-white' : 'bg-blue-50/40'
      } ${clickable ? 'cursor-pointer hover:bg-gray-50' : ''}`}
      onClick={clickable ? () => onOpen(item) : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpen(item);
              }
            }
          : undefined
      }
    >
      <div className={`w-9 h-9 rounded-xl ${tone.iconBg} flex items-center justify-center shrink-0`}>
        <Icon size={17} className={tone.iconColor} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-gray-900 leading-snug">{item.titleAr}</p>
          <span className="text-[10px] text-gray-400 shrink-0 whitespace-nowrap mt-0.5">
            {formatRelativeTime(item.createdAt)}
          </span>
        </div>

        {item.customerName && (
          <p className="text-xs font-medium text-gray-700 mt-0.5 truncate">{item.customerName}</p>
        )}

        {item.descriptionAr && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.descriptionAr}</p>
        )}

        {/* Real contact affordances — call / e-mail straight from the bell. */}
        {(item.customerPhone || item.customerEmail) && (
          <div className="flex items-center gap-3 mt-1.5">
            {item.customerPhone && (
              <a
                href={`tel:${item.customerPhone}`}
                onClick={(e) => e.stopPropagation()}
                dir="ltr"
                className="inline-flex items-center gap-1 text-[11px] text-gray-600 hover:text-[#2D5BE4]"
              >
                <Phone size={12} />
                {item.customerPhone}
              </a>
            )}
            {item.customerEmail && (
              <a
                href={`mailto:${item.customerEmail}`}
                onClick={(e) => e.stopPropagation()}
                dir="ltr"
                className="inline-flex items-center gap-1 text-[11px] text-gray-600 hover:text-[#2D5BE4] truncate max-w-[10rem]"
              >
                <Mail size={12} className="shrink-0" />
                <span className="truncate">{item.customerEmail}</span>
              </a>
            )}
          </div>
        )}
      </div>

      {!item.isRead && (
        <span className="w-2 h-2 rounded-full bg-[#2D5BE4] shrink-0 mt-1.5" aria-hidden="true" />
      )}
    </div>
  );
}

function BellSkeleton() {
  return (
    <div className="divide-y divide-gray-50">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-3 px-4 py-3">
          <div className="w-9 h-9 rounded-xl bg-gray-100 animate-pulse shrink-0" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-3 bg-gray-100 rounded animate-pulse w-2/3" />
            <div className="h-2.5 bg-gray-100 rounded animate-pulse w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
