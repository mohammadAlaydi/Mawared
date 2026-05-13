import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ERROR_CODES } from '@mawared/shared-types';
import { PrismaService } from '@/shared/prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(customerId: string) {
    const rows = await this.prisma.favorite.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: {
        worker: {
          include: {
            nationality: true,
            languages: { include: { language: true } },
            skills: { include: { skill: true } },
          },
        },
      },
    });
    return { items: rows.map((r) => r.worker) };
  }

  async add(customerId: string, workerId: string): Promise<void> {
    const worker = await this.prisma.worker.findFirst({
      where: { id: workerId, deletedAt: null },
      select: { id: true },
    });
    if (!worker) {
      throw new HttpException(
        { code: ERROR_CODES.WORKER_NOT_FOUND, message: 'Worker not found.' },
        HttpStatus.NOT_FOUND,
      );
    }
    try {
      await this.prisma.favorite.create({ data: { customerId, workerId } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        // already favorited — make endpoint idempotent
        return;
      }
      throw err;
    }
  }

  async remove(customerId: string, workerId: string): Promise<void> {
    await this.prisma.favorite
      .delete({ where: { customerId_workerId: { customerId, workerId } } })
      .catch((err) => {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') return;
        throw err;
      });
  }
}
