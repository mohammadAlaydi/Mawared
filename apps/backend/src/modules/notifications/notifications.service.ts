import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ERROR_CODES } from '@mawared/shared-types';
import { Prisma, type NotificationType } from '@prisma/client';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { DeviceTokensService } from './device-tokens.service';
import { PUSH_CHANNEL, type PushChannel } from './push-channel';

interface NotificationTemplate {
  type: NotificationType;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly deviceTokens: DeviceTokensService,
    @Inject(PUSH_CHANNEL) private readonly push: PushChannel,
  ) {}

  async listForUser(userId: string) {
    const items = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return { items };
  }

  async markRead(userId: string, id: string): Promise<void> {
    const row = await this.prisma.notification.findFirst({
      where: { id, userId },
      select: { id: true, readAt: true },
    });
    if (!row) {
      throw new HttpException(
        { code: ERROR_CODES.NOT_FOUND, message: 'Notification not found.' },
        HttpStatus.NOT_FOUND,
      );
    }
    if (!row.readAt) {
      await this.prisma.notification.update({
        where: { id },
        data: { readAt: new Date() },
      });
    }
  }

  /**
   * Send a notification through every channel set in `channels`. Persists an
   * in-app row first so the customer's notification center is consistent
   * regardless of FCM delivery success.
   */
  async send(
    userId: string,
    template: NotificationTemplate,
    options: {
      channels?: Array<'PUSH' | 'IN_APP' | 'EMAIL' | 'SMS'>;
      relatedOrderId?: string;
      relatedContractId?: string;
      data?: Record<string, string>;
    } = {},
  ): Promise<void> {
    const channels = options.channels ?? ['PUSH', 'IN_APP'];

    await this.prisma.notification.create({
      data: {
        userId,
        type: template.type,
        titleAr: template.titleAr,
        titleEn: template.titleEn,
        bodyAr: template.bodyAr,
        bodyEn: template.bodyEn,
        channels,
        relatedOrderId: options.relatedOrderId ?? null,
        relatedContractId: options.relatedContractId ?? null,
        data: options.data ?? Prisma.DbNull,
      },
    });

    if (channels.includes('PUSH')) {
      const tokens = await this.deviceTokens.listActiveTokensForUser(userId);
      if (tokens.length > 0) {
        await this.push.send({
          userId,
          tokens,
          titleAr: template.titleAr,
          titleEn: template.titleEn,
          bodyAr: template.bodyAr,
          bodyEn: template.bodyEn,
          data: options.data,
        });
      }
    }
    // EMAIL / SMS channels: M2 follow-up.
  }
}
