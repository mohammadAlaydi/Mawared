/**
 * Money value object — minor units as BigInt + ISO 4217 currency.
 * Never use Decimal or float for money. See ADR-010.
 */
export type CurrencyCode = 'SAR' | 'AED' | 'KWD' | 'BHD' | 'QAR' | 'OMR' | 'USD' | 'EUR';

export class Money {
  private constructor(
    public readonly amountMinor: bigint,
    public readonly currency: CurrencyCode,
  ) {
    if (amountMinor < 0n) {
      throw new Error(`Money cannot be negative: got ${amountMinor} ${currency}`);
    }
  }

  static of(amountMinor: bigint | number | string, currency: CurrencyCode): Money {
    return new Money(BigInt(amountMinor), currency);
  }

  static zero(currency: CurrencyCode): Money {
    return new Money(0n, currency);
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amountMinor + other.amountMinor, this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amountMinor - other.amountMinor, this.currency);
  }

  multiply(factor: number): Money {
    if (!Number.isFinite(factor) || factor < 0) {
      throw new Error(`Money multiplier must be a non-negative finite number; got ${factor}`);
    }
    // Multiply via integer math to avoid float drift on small amounts.
    const scaled = Math.round(factor * 10_000);
    return new Money((this.amountMinor * BigInt(scaled)) / 10_000n, this.currency);
  }

  isZero(): boolean {
    return this.amountMinor === 0n;
  }

  equals(other: Money): boolean {
    return this.currency === other.currency && this.amountMinor === other.amountMinor;
  }

  /** Returns the value as a plain object suitable for JSON serialization. */
  toJSON(): { amountMinor: string; currency: CurrencyCode } {
    return { amountMinor: this.amountMinor.toString(), currency: this.currency };
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(
        `Currency mismatch: cannot combine ${this.currency} with ${other.currency}`,
      );
    }
  }
}
