import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ERROR_CODES } from '@mawared/shared-types';
import { PrismaService } from '@/shared/prisma/prisma.service';

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrGet(userId: string, deviceId: string, deviceName?: string, requestMeta?: {
    ip?: string;
    userAgent?: string;
  }): Promise<string> {
    const session = await this.prisma.session.upsert({
      where: { userId_deviceId: { userId, deviceId } },
      update: {
        revokedAt: null,
        lastSeenAt: new Date(),
        deviceName: deviceName ?? undefined,
        ipAddress: requestMeta?.ip ?? null,
        userAgent: requestMeta?.userAgent ?? null,
      },
      create: {
        userId,
        deviceId,
        deviceName: deviceName ?? null,
        ipAddress: requestMeta?.ip ?? null,
        userAgent: requestMeta?.userAgent ?? null,
      },
    });
    return session.id;
  }

  async listForUser(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, revokedAt: null },
      orderBy: { lastSeenAt: 'desc' },
      select: {
        id: true,
        deviceId: true,
        deviceName: true,
        ipAddress: true,
        userAgent: true,
        lastSeenAt: true,
        createdAt: true,
      },
    });
  }

  async revoke(userId: string, sessionId: string): Promise<void> {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) {
      throw new HttpException(
        { code: ERROR_CODES.NOT_FOUND, message: 'Session not found.' },
        HttpStatus.NOT_FOUND,
      );
    }
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.session.update({ where: { id: sessionId }, data: { revokedAt: now } }),
      this.prisma.refreshToken.updateMany({
        where: { sessionId, revokedAt: null },
        data: { revokedAt: now },
      }),
    ]);
  }
}
