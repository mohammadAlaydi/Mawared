/**
 * Human-friendly order number. Format: MAW-YYYY-NNNNNNNN.
 * Uniqueness is enforced by the DB; collisions retry.
 */
import { randomInt } from 'node:crypto';

export function generateOrderNumber(now = new Date()): string {
  const year = now.getUTCFullYear();
  const seq = randomInt(0, 100_000_000).toString().padStart(8, '0');
  return `MAW-${year}-${seq}`;
}
