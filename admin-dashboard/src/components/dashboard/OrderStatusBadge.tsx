import { getStatusDisplay, backendStatusDisplay, legacyStatusDisplay } from '@/lib/order-status';

/**
 * Accepts either a backend OrderStatus (UPPERCASE, 11 values) or a legacy
 * lowercase status string left over from the mock data layer. Falls back
 * to a neutral chip if the value is unrecognized.
 */
export default function OrderStatusBadge({ status }: { status: string }) {
  const config = getStatusDisplay(status);
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold ${config.className}`}
    >
      {config.labelAr}
    </span>
  );
}

// Re-exported for legacy callers that referenced statusConfig directly.
export const statusConfig: Record<string, { labelAr: string; className: string }> = {
  ...legacyStatusDisplay,
  ...backendStatusDisplay,
};
