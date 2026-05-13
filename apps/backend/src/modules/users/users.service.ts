import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ERROR_CODES } from '@mawared/shared-types';
import { PrismaService } from '@/shared/prisma/prisma.service';
import type { UpdateMeDto } from './dto/update-me.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: { customer: true },
    });
    if (!user) {
      throw new HttpException(
        { code: ERROR_CODES.NOT_FOUND, message: 'User not found.' },
        HttpStatus.NOT_FOUND,
      );
    }
    return {
      id: user.id,
      role: user.role,
      phoneE164: user.phoneE164,
      email: user.email,
      firstName: user.customer?.firstName ?? null,
      lastName: user.customer?.lastName ?? null,
      preferredLocale: user.customer?.preferredLocale ?? 'ar',
      notificationPrefs: user.customer?.notificationPrefs ?? null,
      createdAt: user.createdAt,
    };
  }

  async updateMe(userId: string, body: UpdateMeDto) {
    await this.prisma.customer.upsert({
      where: { userId },
      update: {
        ...(body.firstName !== undefined && { firstName: body.firstName }),
        ...(body.lastName !== undefined && { lastName: body.lastName }),
        ...(body.preferredLocale !== undefined && { preferredLocale: body.preferredLocale }),
        ...(body.notificationPrefs && {
          notificationPrefs: body.notificationPrefs,
        }),
      },
      create: {
        userId,
        firstName: body.firstName ?? null,
        lastName: body.lastName ?? null,
        preferredLocale: body.preferredLocale ?? 'ar',
        notificationPrefs: body.notificationPrefs ?? { push: true, email: false, sms: false },
      },
    });
    return this.getMe(userId);
  }

  /**
   * Soft-delete the account. Personal data is anonymized; orders + contracts
   * are kept for legal / financial retention. A scheduled job (post-MVP)
   * removes the row entirely after the retention window.
   */
  async initiateDeletion(userId: string): Promise<{ status: 'scheduled'; etaDays: number }> {
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          isActive: false,
          deletedAt: now,
          phoneE164: null,
          email: null,
        },
      }),
      this.prisma.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now },
      }),
    ]);
    return { status: 'scheduled', etaDays: 30 };
  }
}
