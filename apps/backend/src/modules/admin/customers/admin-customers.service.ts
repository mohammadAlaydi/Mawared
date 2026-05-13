import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ERROR_CODES } from '@mawared/shared-types';
import { PrismaService } from '@/shared/prisma/prisma.service';

@Injectable()
export class AdminCustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query?: string) {
    return this.prisma.user
      .findMany({
        where: {
          role: 'CUSTOMER',
          deletedAt: null,
          ...(query && { phoneE164: { contains: query } }),
        },
        include: { customer: true },
        orderBy: { createdAt: 'desc' },
        take: 200,
      })
      .then((items) => ({ items }));
  }

  async findById(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, role: 'CUSTOMER' },
      include: {
        customer: { include: { addresses: true } },
        sessions: { where: { revokedAt: null } },
      },
    });
    if (!user) {
      throw new HttpException(
        { code: ERROR_CODES.NOT_FOUND, message: 'Customer not found.' },
        HttpStatus.NOT_FOUND,
      );
    }
    return user;
  }

  async suspend(id: string): Promise<void> {
    await this.prisma.user.updateMany({
      where: { id, role: 'CUSTOMER' },
      data: { isActive: false },
    });
    await this.prisma.session.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async reactivate(id: string): Promise<void> {
    await this.prisma.user.updateMany({
      where: { id, role: 'CUSTOMER', deletedAt: null },
      data: { isActive: true },
    });
  }
}
