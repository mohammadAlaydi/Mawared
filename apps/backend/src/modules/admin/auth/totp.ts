import { createHmac, randomBytes } from 'node:crypto';

/**
 * RFC 6238 TOTP (Time-based One-Time Password) helpers. Compatible with
 * Google Authenticator / Authy / 1Password / any RFC-conformant client.
 *
 * Defaults: SHA-1, 6 digits, 30s step. We accept a ±1 step window for
 * clock skew (default tolerance for 2FA apps).
 */

const STEP_SECONDS = 30;
const DIGITS = 6;
const WINDOW = 1;

export function generateTotpSecret(): string {
  // 20 random bytes → 32-char base32 = standard authenticator secret length.
  return base32Encode(randomBytes(20));
}

export function generateTotpUri(opts: {
  secretBase32: string;
  accountName: string; // e.g. user@mawared.local
  issuer?: string;     // e.g. "Mawared International"
}): string {
  const issuer = encodeURIComponent(opts.issuer ?? 'Mawared');
  const account = encodeURIComponent(opts.accountName);
  return (
    `otpauth://totp/${issuer}:${account}` +
    `?secret=${opts.secretBase32}` +
    `&issuer=${issuer}` +
    `&algorithm=SHA1&digits=${DIGITS}&period=${STEP_SECONDS}`
  );
}

export function verifyTotp(secretBase32: string, code: string, now = Date.now()): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  const key = base32Decode(secretBase32);
  const step = Math.floor(now / 1000 / STEP_SECONDS);
  for (let w = -WINDOW; w <= WINDOW; w++) {
    if (hotp(key, step + w) === code) return true;
  }
  return false;
}

function hotp(key: Buffer, counter: number): string {
  const buf = Buffer.alloc(8);
  // Counter is 64 bits big-endian.
  let hi = Math.floor(counter / 0x100000000);
  let lo = counter & 0xffffffff;
  buf.writeUInt32BE(hi, 0);
  buf.writeUInt32BE(lo, 4);
  const mac = createHmac('sha1', key).update(buf).digest();
  const offset = mac[mac.length - 1]! & 0x0f;
  const binary =
    ((mac[offset]! & 0x7f) << 24) |
    ((mac[offset + 1]! & 0xff) << 16) |
    ((mac[offset + 2]! & 0xff) << 8) |
    (mac[offset + 3]! & 0xff);
  const mod = 10 ** DIGITS;
  return (binary % mod).toString().padStart(DIGITS, '0');
}

// ---------- base32 (RFC 4648, no padding for readability) ----------

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 0x1f];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 0x1f];
  return out;
}

function base32Decode(input: string): Buffer {
  const clean = input.replace(/=+$/g, '').toUpperCase();
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const ch of clean) {
    const idx = B32.indexOf(ch);
    if (idx === -1) throw new Error('invalid base32 character');
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}
