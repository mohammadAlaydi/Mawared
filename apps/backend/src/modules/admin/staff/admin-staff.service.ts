import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ERROR_CODES } from '@mawared/shared-types';
import * as argon2 from 'argon2';
import { PrismaService } from '@/shared/prisma/prisma.service';
import type { CreateStaffDto, UpdateStaffDto } from './dto/staff.dto';

@Injectable()
export class AdminStaffService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.user
      .findMany({
        where: { role: { in: ['STAFF', 'BRANCH_MANAGER', 'SUPER_ADMIN'] }, deletedAt: null },
        include: { staffProfile: true, branch: { select: { id: true, code: true } } },
        orderBy: { createdAt: 'desc' },
      })
      .then((items) => ({ items }));
  }

  async findById(id: string) {
    const u = await this.prisma.user.findFirst({
      where: { id, role: { in: ['STAFF', 'BRANCH_MANAGER', 'SUPER_ADMIN'] } },
      include: {
        staffProfile: true,
        branch: { select: { id: true, code: true, nameAr: true } },
        sessions: { where: { revokedAt: null } },
      },
    });
    if (!u) {
      throw new HttpException(
        { code: ERROR_CODES.NOT_FOUND, message: 'Staff not found.' },
        HttpStatus.NOT_FOUND,
      );
    }
    return u;
  }

  async create(body: CreateStaffDto) {
    const passwordHash = await argon2.hash(body.password, { type: argon2.argon2id });
    return this.prisma.user.create({
      data: {
        email: body.email,
        role: body.role,
        isActive: body.isActive,
        branchId: body.branchId ?? null,
        passwordHash,
        staffProfile: {
          create: {
            firstName: body.firstName,
            lastName: body.lastName,
            title: body.title ?? null,
          },
        },
      },
      include: { staffProfile: true },
    });
  }

  async update(id: string, body: UpdateStaffDto) {
    await this.findById(id);

    const userData: Record<string, unknown> = {};
    if (body.email !== undefined)    userData.email    = body.email;
    if (body.role !== undefined)     userData.role     = body.role;
    if (body.isActive !== undefined) userData.isActive = body.isActive;
    if (body.branchId !== undefined) userData.branchId = body.branchId;
    if (body.password) {
      userData.passwordHash = await argon2.hash(body.password, { type: argon2.argon2id });
    }

    const profileData: Record<string, unknown> = {};
    if (body.firstName !== undefined) profileData.firstName = body.firstName;
    if (body.lastName !== undefined)  profileData.lastName  = body.lastName;
    if (body.title !== undefined)     profileData.title     = body.title;

    return this.prisma.user.update({
      where: { id },
      data: {
        ...userData,
        ...(Object.keys(profileData).length > 0 && {
          staffProfile: { update: profileData },
        }),
      },
      include: { staffProfile: true },
    });
  }

  async deactivate(id: string): Promise<void> {
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id }, data: { isActive: false } }),
      this.prisma.session.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: now },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: now },
      }),
    ]);
  }
}
