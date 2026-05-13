import { describe, expect, it } from 'vitest';
import { Money } from './money';

describe('Money', () => {
  it('constructs from bigint, number, and string', () => {
    expect(Money.of(100n, 'SAR').amountMinor).toBe(100n);
    expect(Money.of(100, 'SAR').amountMinor).toBe(100n);
    expect(Money.of('100', 'SAR').amountMinor).toBe(100n);
  });

  it('refuses negative amounts', () => {
    expect(() => Money.of(-1n, 'SAR')).toThrow(/cannot be negative/);
  });

  it('adds and subtracts within the same currency', () => {
    const a = Money.of(150n, 'SAR');
    const b = Money.of(50n, 'SAR');
    expect(a.add(b).amountMinor).toBe(200n);
    expect(a.subtract(b).amountMinor).toBe(100n);
  });

  it('rejects cross-currency arithmetic', () => {
    const sar = Money.of(100n, 'SAR');
    const aed = Money.of(100n, 'AED');
    expect(() => sar.add(aed)).toThrow(/Currency mismatch/);
  });

  it('multiplies cleanly for typical VAT factors', () => {
    const subtotal = Money.of(10_000n, 'SAR'); // 100.00 SAR
    const vat = subtotal.multiply(0.15);
    expect(vat.amountMinor).toBe(1_500n);
  });

  it('serializes amount as a string to survive JSON round-trips', () => {
    const m = Money.of(9_007_199_254_740_993n, 'SAR'); // > Number.MAX_SAFE_INTEGER
    expect(JSON.parse(JSON.stringify(m))).toEqual({
      amountMinor: '9007199254740993',
      currency: 'SAR',
    });
  });
});
