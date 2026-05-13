import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ERROR_CODES } from '@mawared/shared-types';
import { PrismaService } from '@/shared/prisma/prisma.service';

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const items = await this.prisma.branch.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { code: 'asc' },
      select: {
        id: true,
        code: true,
        nameAr: true,
        nameEn: true,
        city: true,
        district: true,
        phoneE164: true,
        whatsappE164: true,
        workingHoursAr: true,
        workingHoursEn: true,
        latitude: true,
        longitude: true,
        photoUrl: true,
      },
    });
    return { items };
  }

  async findById(id: string) {
    const b = await this.prisma.branch.findFirst({
      where: { id, isActive: true, deletedAt: null },
    });
    if (!b) {
      throw new HttpException(
        { code: ERROR_CODES.NOT_FOUND, message: 'Branch not found.' },
        HttpStatus.NOT_FOUND,
      );
    }
    return b;
  }
}
