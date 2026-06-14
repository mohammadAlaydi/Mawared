import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number): string {
  return amount.toLocaleString('ar-SA') + ' ريال';
}

/**
 * Format a backend "Money" value (minor units as BigInt-string + ISO currency code)
 * for display. Backend stores SAR in halalas; we divide by 100 for display.
 *
 * The backend always serializes BigInt as a string to avoid JSON precision loss,
 * which is why we accept `string | number`.
 */
export function formatMoneyMinor(
  amountMinor: string | number | null | undefined,
  currency = 'SAR',
): string {
  if (amountMinor === null || amountMinor === undefined) return '—';
  const minor = typeof amountMinor === 'string' ? BigInt(amountMinor) : BigInt(amountMinor);
  // Major units = minor / 100 for SAR/USD/EUR-family currencies.
  const major = Number(minor) / 100;
  const label = currency === 'SAR' ? 'ريال' : currency;
  return `${major.toLocaleString('ar-SA', { maximumFractionDigits: 2 })} ${label}`;
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Short order reference for display — backend orderNumber, or fallback to last 6 of id. */
export function shortOrderRef(orderNumber: string | null | undefined, id: string): string {
  if (orderNumber) return orderNumber;
  return `#${id.slice(-6).toUpperCase()}`;
}

/**
 * Compact Arabic relative-time label ("منذ 5 د", "منذ ساعتين", "أمس"…).
 * Falls back to an absolute date for anything older than ~a week.
 */
export function formatRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const then = new Date(dateStr);
  if (Number.isNaN(then.getTime())) return '';
  const diffMs = Date.now() - then.getTime();
  const sec = Math.round(diffMs / 1000);
  if (sec < 60) return 'الآن';
  const min = Math.round(sec / 60);
  if (min < 60) return `منذ ${min} د`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `منذ ${hr} س`;
  const day = Math.round(hr / 24);
  if (day === 1) return 'أمس';
  if (day < 7) return `منذ ${day} أيام`;
  return formatDate(dateStr);
}
