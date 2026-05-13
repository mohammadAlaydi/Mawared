import { randomInt } from 'node:crypto';

export function generateContractNumber(now = new Date()): string {
  const year = now.getUTCFullYear();
  const seq = randomInt(0, 100_000_000).toString().padStart(8, '0');
  return `MAW-CON-${year}-${seq}`;
}
