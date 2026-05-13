import { Injectable } from '@nestjs/common';
import { Prisma, type DevicePlatform } from '@prisma/client';
import { PrismaService } from '@/shared/prisma/prisma.service';

@Injectable()
export class DeviceTokensService {
  constructor(private readonly prisma: PrismaService) {}

  async register(
    userId: string,
    input: { token: string; platform: DevicePlatform; appVersion?: string; locale?: string },
  ) {
    try {
      await this.prisma.deviceToken.create({
        data: {
          userId,
          token: input.token,
          platform: input.platform,
          appVersion: input.appVersion ?? null,
          locale: input.locale ?? null,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        // Re-registration: refresh the lastSeenAt timestamp.
        await this.prisma.deviceToken.update({
          where: { token: input.token },
          data: {
            lastSeenAt: new Date(),
            userId,
            appVersion: input.appVersion ?? null,
            locale: input.locale ?? null,
          },
        });
        return;
      }
      throw err;
    }
  }

  async unregister(userId: string, token: string): Promise<void> {
    await this.prisma.deviceToken.updateMany({
      where: { userId, token, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  async listActiveTokensForUser(userId: string): Promise<string[]> {
    const rows = await this.prisma.deviceToken.findMany({
      where: { userId, deletedAt: null },
      select: { token: true },
    });
    return rows.map((r) => r.token);
  }
}
