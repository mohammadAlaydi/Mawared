import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';

/**
 * Flat projection of a Nationality row for clients. The Prisma model
 * also carries `id` (UUID), which we expose so admins can use it as
 * the foreign key when creating workers.
 */
export interface NationalityRow {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  flagEmoji: string;
}

@Injectable()
export class NationalitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<{ items: NationalityRow[] }> {
    const rows = await this.prisma.nationality.findMany({
      orderBy: { nameAr: 'asc' },
      select: { id: true, code: true, nameAr: true, nameEn: true, flagEmoji: true },
    });
    return { items: rows };
  }
}
