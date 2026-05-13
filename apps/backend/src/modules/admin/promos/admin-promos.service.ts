import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ERROR_CODES } from '@mawared/shared-types';
import { PrismaService } from '@/shared/prisma/prisma.service';
import type { CreatePromoDto, UpdatePromoDto } from './dto/promo.dto';

@Injectable()
export class AdminPromosService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.promoCode
      .findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { redemptions: true } } },
      })
      .then((items) => ({ items }));
  }

  async findById(id: string) {
    const promo = await this.prisma.promoCode.findFirst({
      where: { id, deletedAt: null },
      include: { _count: { select: { redemptions: true } } },
    });
    if (!promo) {
      throw new HttpException(
        { code: ERROR_CODES.PROMO_NOT_FOUND, message: 'Promo not found.' },
        HttpStatus.NOT_FOUND,
      );
    }
    return promo;
  }

  create(body: CreatePromoDto) {
    return this.prisma.promoCode.create({
      data: {
        code: body.code,
        titleAr: body.titleAr,
        titleEn: body.titleEn ?? null,
        descriptionAr: body.descriptionAr ?? null,
        descriptionEn: body.descriptionEn ?? null,
        discountPercent: body.discountPercent ?? null,
        discountMinor: body.discountMinor ?? null,
        currency: body.currency,
        maxUsesTotal: body.maxUsesTotal ?? null,
        maxUsesPerUser: body.maxUsesPerUser,
        minOrderMinor: body.minOrderMinor,
        validFrom: body.validFrom,
        validUntil: body.validUntil,
        isActive: body.isActive,
      },
    });
  }

  async update(id: string, body: UpdatePromoDto) {
    await this.findById(id);
    return this.prisma.promoCode.update({
      where: { id },
      data: {
        ...(body.titleAr && { titleAr: body.titleAr }),
        ...(body.titleEn !== undefined && { titleEn: body.titleEn }),
        ...(body.descriptionAr !== undefined && { descriptionAr: body.descriptionAr }),
        ...(body.descriptionEn !== undefined && { descriptionEn: body.descriptionEn }),
        ...(body.discountPercent !== undefined && { discountPercent: body.discountPercent }),
        ...(body.discountMinor !== undefined && { discountMinor: body.discountMinor }),
        ...(body.currency && { currency: body.currency }),
        ...(body.maxUsesTotal !== undefined && { maxUsesTotal: body.maxUsesTotal }),
        ...(body.maxUsesPerUser !== undefined && { maxUsesPerUser: body.maxUsesPerUser }),
        ...(body.minOrderMinor !== undefined && { minOrderMinor: body.minOrderMinor }),
        ...(body.validFrom && { validFrom: body.validFrom }),
        ...(body.validUntil && { validUntil: body.validUntil }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });
  }

  async deactivate(id: string): Promise<void> {
    await this.prisma.promoCode.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
