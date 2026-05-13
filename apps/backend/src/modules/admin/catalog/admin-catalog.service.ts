import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ERROR_CODES } from '@mawared/shared-types';
import { PrismaService } from '@/shared/prisma/prisma.service';
import type { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';
import type { CreatePackageDto, UpdatePackageDto } from './dto/package.dto';

@Injectable()
export class AdminCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  // ===== Services =====

  listServices() {
    return this.prisma.serviceCategory
      .findMany({
        where: { deletedAt: null },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
        include: { _count: { select: { packages: true } } },
      })
      .then((items) => ({ items }));
  }

  async findServiceById(id: string) {
    const s = await this.prisma.serviceCategory.findFirst({
      where: { id, deletedAt: null },
      include: { packages: { where: { deletedAt: null } } },
    });
    if (!s) {
      throw new HttpException(
        { code: ERROR_CODES.SERVICE_NOT_FOUND, message: 'Service not found.' },
        HttpStatus.NOT_FOUND,
      );
    }
    return s;
  }

  createService(body: CreateServiceDto) {
    return this.prisma.serviceCategory.create({
      data: {
        slug: body.slug,
        nameAr: body.nameAr,
        nameEn: body.nameEn ?? null,
        descriptionAr: body.descriptionAr ?? null,
        descriptionEn: body.descriptionEn ?? null,
        profession: body.profession,
        displayOrder: body.displayOrder,
        isActive: body.isActive,
      },
    });
  }

  async updateService(id: string, body: UpdateServiceDto) {
    await this.findServiceById(id);
    return this.prisma.serviceCategory.update({
      where: { id },
      data: {
        ...(body.slug && { slug: body.slug }),
        ...(body.nameAr && { nameAr: body.nameAr }),
        ...(body.nameEn !== undefined && { nameEn: body.nameEn }),
        ...(body.descriptionAr !== undefined && { descriptionAr: body.descriptionAr }),
        ...(body.descriptionEn !== undefined && { descriptionEn: body.descriptionEn }),
        ...(body.profession && { profession: body.profession }),
        ...(body.displayOrder !== undefined && { displayOrder: body.displayOrder }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });
  }

  async deactivateService(id: string) {
    await this.findServiceById(id);
    await this.prisma.serviceCategory.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });
  }

  // ===== Packages =====

  listPackages(serviceId?: string) {
    return this.prisma.servicePackage
      .findMany({
        where: { deletedAt: null, ...(serviceId && { serviceId }) },
        orderBy: [{ isPopular: 'desc' }, { priceMinor: 'asc' }],
        include: { service: { select: { id: true, slug: true, nameAr: true } } },
      })
      .then((items) => ({ items }));
  }

  async findPackageById(id: string) {
    const p = await this.prisma.servicePackage.findFirst({
      where: { id, deletedAt: null },
      include: { service: true },
    });
    if (!p) {
      throw new HttpException(
        { code: ERROR_CODES.PACKAGE_NOT_FOUND, message: 'Package not found.' },
        HttpStatus.NOT_FOUND,
      );
    }
    return p;
  }

  createPackage(body: CreatePackageDto) {
    return this.prisma.servicePackage.create({
      data: {
        serviceId: body.serviceId,
        nameAr: body.nameAr,
        nameEn: body.nameEn ?? null,
        descriptionAr: body.descriptionAr ?? null,
        descriptionEn: body.descriptionEn ?? null,
        type: body.type,
        durationValue: body.durationValue,
        durationUnit: body.durationUnit,
        priceMinor: body.priceMinor,
        currency: body.currency,
        vatRatePpm: body.vatRatePpm,
        features: body.features as Prisma.InputJsonValue,
        isPopular: body.isPopular,
        isActive: body.isActive,
      },
    });
  }

  async updatePackage(id: string, body: UpdatePackageDto) {
    await this.findPackageById(id);
    return this.prisma.servicePackage.update({
      where: { id },
      data: {
        ...(body.nameAr && { nameAr: body.nameAr }),
        ...(body.nameEn !== undefined && { nameEn: body.nameEn }),
        ...(body.descriptionAr !== undefined && { descriptionAr: body.descriptionAr }),
        ...(body.descriptionEn !== undefined && { descriptionEn: body.descriptionEn }),
        ...(body.type && { type: body.type }),
        ...(body.durationValue !== undefined && { durationValue: body.durationValue }),
        ...(body.durationUnit && { durationUnit: body.durationUnit }),
        ...(body.priceMinor !== undefined && { priceMinor: body.priceMinor }),
        ...(body.currency && { currency: body.currency }),
        ...(body.vatRatePpm !== undefined && { vatRatePpm: body.vatRatePpm }),
        ...(body.features !== undefined && { features: body.features as Prisma.InputJsonValue }),
        ...(body.isPopular !== undefined && { isPopular: body.isPopular }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.serviceId && { service: { connect: { id: body.serviceId } } }),
      },
    });
  }

  async deactivatePackage(id: string) {
    await this.findPackageById(id);
    await this.prisma.servicePackage.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });
  }
}
