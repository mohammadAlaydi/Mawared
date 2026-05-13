import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ERROR_CODES } from '@mawared/shared-types';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { buildPage, type Paged } from '@/common/pagination';
import type { SearchWorkersDto } from './dto/search-workers.dto';

@Injectable()
export class WorkersService {
  constructor(private readonly prisma: PrismaService) {}

  async search(q: SearchWorkersDto): Promise<Paged<unknown>> {
    const where: Prisma.WorkerWhereInput = {
      deletedAt: null,
      availability: 'AVAILABLE',
      ...(q.profession && { profession: q.profession }),
      ...(q.branchId && { branchId: q.branchId }),
      ...(q.nationalityCode && { nationality: { code: q.nationalityCode } }),
      ...(q.languageCode && {
        languages: { some: { language: { code: q.languageCode } } },
      }),
      ...((q.minSalaryMinor || q.maxSalaryMinor) && {
        monthlySalaryMinor: {
          ...(q.minSalaryMinor !== undefined && { gte: q.minSalaryMinor }),
          ...(q.maxSalaryMinor !== undefined && { lte: q.maxSalaryMinor }),
        },
      }),
      ...((q.minAge || q.maxAge) && {
        ageYears: {
          ...(q.minAge !== undefined && { gte: q.minAge }),
          ...(q.maxAge !== undefined && { lte: q.maxAge }),
        },
      }),
      ...(q.minExperienceYears !== undefined && {
        experienceYears: { gte: q.minExperienceYears },
      }),
      ...(q.query && {
        OR: [
          { fullNameAr: { contains: q.query, mode: 'insensitive' } },
          { fullNameEn: { contains: q.query, mode: 'insensitive' } },
        ],
      }),
    };

    const rows = await this.prisma.worker.findMany({
      where,
      take: q.limit + 1,
      ...(q.cursor && { cursor: { id: q.cursor }, skip: 1 }),
      orderBy: this.toOrderBy(q.sort),
      include: {
        nationality: true,
        languages: { include: { language: true } },
        skills: { include: { skill: true } },
      },
    });

    return buildPage(rows, q.limit);
  }

  async findById(id: string) {
    const worker = await this.prisma.worker.findFirst({
      where: { id, deletedAt: null },
      include: {
        nationality: true,
        languages: { include: { language: true } },
        skills: { include: { skill: true } },
        branch: { select: { id: true, code: true, nameAr: true, nameEn: true, city: true } },
      },
    });
    if (!worker) {
      throw new HttpException(
        { code: ERROR_CODES.WORKER_NOT_FOUND, message: 'Worker not found.' },
        HttpStatus.NOT_FOUND,
      );
    }
    return worker;
  }

  private toOrderBy(sort: SearchWorkersDto['sort']): Prisma.WorkerOrderByWithRelationInput {
    switch (sort) {
      case 'price_asc':
        return { monthlySalaryMinor: 'asc' };
      case 'price_desc':
        return { monthlySalaryMinor: 'desc' };
      case 'rating_desc':
        return { rating: 'desc' };
      case 'newest':
      default:
        return { createdAt: 'desc' };
    }
  }
}
