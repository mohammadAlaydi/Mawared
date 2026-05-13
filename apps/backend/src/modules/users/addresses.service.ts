import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ERROR_CODES } from '@mawared/shared-types';
import { PrismaService } from '@/shared/prisma/prisma.service';
import type { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  list(customerId: string) {
    return this.prisma.address
      .findMany({
        where: { customerId, deletedAt: null },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      })
      .then((items) => ({ items }));
  }

  async create(customerId: string, body: CreateAddressDto) {
    return this.prisma.$transaction(async (tx) => {
      if (body.isDefault) {
        await tx.address.updateMany({
          where: { customerId, isDefault: true },
          data: { isDefault: false },
        });
      }
      return tx.address.create({
        data: {
          customerId,
          label: body.label,
          city: body.city,
          district: body.district,
          street: body.street,
          buildingNumber: body.buildingNumber,
          additionalNotes: body.additionalNotes ?? null,
          latitude: body.latitude ?? null,
          longitude: body.longitude ?? null,
          isDefault: body.isDefault ?? false,
        },
      });
    });
  }

  async update(customerId: string, id: string, body: UpdateAddressDto) {
    await this.assertOwned(customerId, id);
    return this.prisma.$transaction(async (tx) => {
      if (body.isDefault === true) {
        await tx.address.updateMany({
          where: { customerId, isDefault: true, NOT: { id } },
          data: { isDefault: false },
        });
      }
      return tx.address.update({ where: { id }, data: body });
    });
  }

  async remove(customerId: string, id: string): Promise<void> {
    await this.assertOwned(customerId, id);
    await this.prisma.address.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private async assertOwned(customerId: string, id: string): Promise<void> {
    const row = await this.prisma.address.findFirst({
      where: { id, customerId, deletedAt: null },
      select: { id: true },
    });
    if (!row) {
      throw new HttpException(
        { code: ERROR_CODES.NOT_FOUND, message: 'Address not found.' },
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
