import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ERROR_CODES } from '@mawared/shared-types';
import { PrismaService } from '@/shared/prisma/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listServices() {
    const rows = await this.prisma.serviceCategory.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { displayOrder: 'asc' },
    });
    return { items: rows };
  }

  async listPackages(serviceId: string) {
    const service = await this.prisma.serviceCategory.findFirst({
      where: { id: serviceId, deletedAt: null },
      select: { id: true },
    });
    if (!service) {
      throw new HttpException(
        { code: ERROR_CODES.SERVICE_NOT_FOUND, message: 'Service not found.' },
        HttpStatus.NOT_FOUND,
      );
    }
    const items = await this.prisma.servicePackage.findMany({
      where: { serviceId, isActive: true, deletedAt: null },
      orderBy: [{ isPopular: 'desc' }, { priceMinor: 'asc' }],
    });
    return { items };
  }

  async findPackageById(id: string) {
    const pkg = await this.prisma.servicePackage.findFirst({
      where: { id, isActive: true, deletedAt: null },
    });
    if (!pkg) {
      throw new HttpException(
        { code: ERROR_CODES.PACKAGE_NOT_FOUND, message: 'Package not found.' },
        HttpStatus.NOT_FOUND,
      );
    }
    return pkg;
  }
}
