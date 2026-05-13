import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { ERROR_CODES } from '@mawared/shared-types';
import { PrismaService } from '@/shared/prisma/prisma.service';

@Injectable()
export class OffersService {
  constructor(private readonly prisma: PrismaService) {}

  async listActive() {
    const now = new Date();
    const items = await this.prisma.promoCode.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        validFrom: { lte: now },
        validUntil: { gte: now },
      },
      orderBy: { validUntil: 'asc' },
      select: {
        id: true,
        code: true,
        titleAr: true,
        titleEn: true,
        descriptionAr: true,
        descriptionEn: true,
        discountPercent: true,
        discountMinor: true,
        currency: true,
        minOrderMinor: true,
        validFrom: true,
        validUntil: true,
      },
    });
    return { items };
  }

  /**
   * Validate a promo code against an order context (subtotal, customer).
   * Returns the discount that would be applied. Does NOT record a
   * redemption — that happens at order placement.
   */
  async validate(
    code: string,
    context: { customerId: string; subtotalMinor: bigint; currency: string },
  ): Promise<{ promoId: string; discountMinor: bigint; currency: string }> {
    const promo = await this.prisma.promoCode.findFirst({
      where: { code: code.toUpperCase(), deletedAt: null },
    });
    if (!promo) {
      throw new HttpException(
        { code: ERROR_CODES.PROMO_NOT_FOUND, message: 'Promo code not found.' },
        HttpStatus.NOT_FOUND,
      );
    }
    const now = new Date();
    if (!promo.isActive) {
      throw new HttpException(
        { code: ERROR_CODES.PROMO_INACTIVE, message: 'Promo code is inactive.' },
        HttpStatus.CONFLICT,
      );
    }
    if (promo.validFrom > now || promo.validUntil < now) {
      throw new HttpException(
        { code: ERROR_CODES.PROMO_EXPIRED, message: 'Promo code expired.' },
        HttpStatus.CONFLICT,
      );
    }
    if (promo.currency !== context.currency) {
      throw new HttpException(
        {
          code: ERROR_CODES.PROMO_NOT_APPLICABLE,
          message: 'Promo currency does not match the order currency.',
        },
        HttpStatus.CONFLICT,
      );
    }
    if (context.subtotalMinor < promo.minOrderMinor) {
      throw new HttpException(
        {
          code: ERROR_CODES.PROMO_NOT_APPLICABLE,
          message: 'Order subtotal below the promo minimum.',
        },
        HttpStatus.CONFLICT,
      );
    }

    // Per-customer cap.
    const myRedemptions = await this.prisma.promoRedemption.count({
      where: { promoId: promo.id, customerId: context.customerId },
    });
    if (myRedemptions >= promo.maxUsesPerUser) {
      throw new HttpException(
        {
          code: ERROR_CODES.PROMO_USAGE_LIMIT_REACHED,
          message: 'You have already used this promo the maximum number of times.',
        },
        HttpStatus.CONFLICT,
      );
    }

    // Global cap.
    if (promo.maxUsesTotal !== null) {
      const total = await this.prisma.promoRedemption.count({ where: { promoId: promo.id } });
      if (total >= promo.maxUsesTotal) {
        throw new HttpException(
          {
            code: ERROR_CODES.PROMO_USAGE_LIMIT_REACHED,
            message: 'This promo has reached its usage limit.',
          },
          HttpStatus.CONFLICT,
        );
      }
    }

    const discountMinor =
      promo.discountMinor !== null && promo.discountMinor !== undefined
        ? promo.discountMinor
        : (context.subtotalMinor * BigInt(promo.discountPercent ?? 0)) / 100n;

    // Discount can never exceed the subtotal.
    const capped = discountMinor > context.subtotalMinor ? context.subtotalMinor : discountMinor;

    return { promoId: promo.id, discountMinor: capped, currency: promo.currency };
  }

  /**
   * Persist a PromoRedemption after an order has been created with a promo
   * applied. Called from OrdersService.create inside the same transaction
   * so a failure rolls the order back.
   */
  async recordRedemption(
    tx: Prisma.TransactionClient,
    input: {
      promoId: string;
      customerId: string;
      orderId: string;
      discountAppliedMinor: bigint;
      currency: string;
    },
  ): Promise<void> {
    await tx.promoRedemption.create({
      data: {
        promoId: input.promoId,
        customerId: input.customerId,
        orderId: input.orderId,
        discountAppliedMinor: input.discountAppliedMinor,
        currency: input.currency,
      },
    });
  }
}
