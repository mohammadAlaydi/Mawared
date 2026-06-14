'use client';

/**
 * Per-browser read-state for the admin notification bell.
 *
 * The admin feed is derived server-side from live business data (see the
 * backend AdminNotificationsService), so there are no stored notification rows
 * to flip a `readAt` column on. Instead we remember which stable item ids the
 * operator has already seen, here in localStorage, and drive the unread badge
 * off that. This survives reloads and stays in sync across tabs/components via
 * the `storage` event + an in-page subscriber list.
 */

const STORAGE_KEY = 'mawared.admin.notif.read.v1';
const MAX_REMEMBERED = 500;

type Listener = () => void;

const listeners = new Set<Listener>();
let snapshot = '[]';
let hydrated = false;

function readFromStorage(): string {
  if (typeof window === 'undefined') return '[]';
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? '[]';
  } catch {
    return '[]';
  }
}

function ensureHydrated(): void {
  if (hydrated) return;
  snapshot = readFromStorage();
  hydrated = true;
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key !== STORAGE_KEY) return;
      snapshot = e.newValue ?? '[]';
      emit();
    });
  }
}

function emit(): void {
  for (const listener of listeners) listener();
}

function persist(ids: string[]): void {
  // Keep the list bounded so it can't grow without limit as the feed churns.
  const trimmed = ids.slice(-MAX_REMEMBERED);
  const next = JSON.stringify(trimmed);
  if (next === snapshot) return;
  snapshot = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Storage unavailable (private mode / quota) — keep the in-memory snapshot
    // so the current tab still behaves; it just won't persist.
  }
  emit();
}

function currentIds(): string[] {
  try {
    const parsed = JSON.parse(snapshot) as unknown;
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export const notificationsReadStore = {
  subscribe(listener: Listener): () => void {
    ensureHydrated();
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  /** Stable string snapshot for useSyncExternalStore. */
  getSnapshot(): string {
    ensureHydrated();
    return snapshot;
  },

  /** Server snapshot — nothing is read on the server. */
  getServerSnapshot(): string {
    return '[]';
  },

  markRead(id: string): void {
    ensureHydrated();
    const ids = currentIds();
    if (ids.includes(id)) return;
    persist([...ids, id]);
  },

  markAllRead(ids: string[]): void {
    ensureHydrated();
    const merged = new Set([...currentIds(), ...ids]);
    persist([...merged]);
  },
};

/** Parse a snapshot string into a Set of read ids. */
export function parseReadIds(snap: string): Set<string> {
  try {
    const parsed = JSON.parse(snap) as unknown;
    return new Set(Array.isArray(parsed) ? (parsed as string[]) : []);
  } catch {
    return new Set();
  }
}
