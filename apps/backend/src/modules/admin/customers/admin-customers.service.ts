import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ERROR_CODES } from '@mawared/shared-types';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { buildPage, type Paged } from '@/common/pagination';
import type { ListCustomersDto } from './dto/list-customers.dto';

/**
 * Flat projection of a customer record for the admin dashboard. Mirrors the
 * `AdminCustomer` interface exposed by @mawared/api-client; keep these two
 * in sync.
 */
export interface AdminCustomerRow {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  phoneE164: string;
  email: string | null;
  preferredLocale: 'ar' | 'en';
  verificationStatus: 'NOT_VERIFIED' | 'IN_PROGRESS' | 'VERIFIED' | 'FAILED';
  isSuspended: boolean;
  createdAt: string;
}

export interface AdminCustomerDetail extends AdminCustomerRow {
  totalOrders: number;
  lifetimeValueMinor: string;
  addresses: Array<{
    id: string;
    label: string;
    city: string;
    district: string;
    street: string;
    buildingNumber: string;
    isDefault: boolean;
  }>;
  activeSessions: number;
}

@Injectable()
export class AdminCustomersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cursor-paginated list of CUSTOMER users. The cursor is the User.id of
   * the last row from the previous page. Optional `q` substring-matches
   * the E.164 phone number — sufficient for the admin UI's "find a
   * customer" workflow.
   */
  async list(q: ListCustomersDto): Promise<Paged<AdminCustomerRow>> {
    const rows = await this.prisma.user.findMany({
      where: {
        role: 'CUSTOMER',
        deletedAt: null,
        ...(q.q && { phoneE164: { contains: q.q } }),
      },
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
      take: q.limit + 1,
      ...(q.cursor && { cursor: { id: q.cursor }, skip: 1 }),
    });

    const projected = rows.map((u): AdminCustomerRow => this.toRow(u));
    return buildPage(
      projected.map((row) => ({ ...row, id: row.userId })),
      q.limit,
    ) as unknown as Paged<AdminCustomerRow>;
  }

  async findById(id: string): Promise<AdminCustomerDetail> {
    const user = await this.prisma.user.findFirst({
      where: { id, role: 'CUSTOMER' },
      include: {
        customer: { include: { addresses: { where: { deletedAt: null } } } },
        sessions: { where: { revokedAt: null } },
      },
    });
    if (!user) {
      throw new HttpException(
        { code: ERROR_CODES.NOT_FOUND, message: 'Customer not found.' },
        HttpStatus.NOT_FOUND,
      );
    }

    const [agg, addressList] = await Promise.all([
      this.prisma.order.aggregate({
        where: { customerId: user.id, deletedAt: null },
        _count: { _all: true },
        _sum: { totalMinor: true },
      }),
      Promise.resolve(user.customer?.addresses ?? []),
    ]);

    const row = this.toRow(user);
    return {
      ...row,
      totalOrders: agg._count?._all ?? 0,
      lifetimeValueMinor: String(agg._sum?.totalMinor ?? 0n),
      addresses: addressList.map((a) => ({
        id: a.id,
        label: a.label,
        city: a.city,
        district: a.district,
        street: a.street,
        buildingNumber: a.buildingNumber,
        isDefault: a.isDefault,
      })),
      activeSessions: user.sessions.length,
    };
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

  // ---------- helpers ----------

  private toRow(
    u: { id: string; phoneE164: string | null; email: string | null; isActive: boolean; createdAt: Date } & {
      customer: {
        firstName: string | null;
        lastName: string | null;
        preferredLocale: string;
        verificationStatus: string;
      } | null;
    },
  ): AdminCustomerRow {
    return {
      userId: u.id,
      firstName: u.customer?.firstName ?? null,
      lastName: u.customer?.lastName ?? null,
      phoneE164: u.phoneE164 ?? '',
      email: u.email,
      preferredLocale: (u.customer?.preferredLocale === 'en' ? 'en' : 'ar') as 'ar' | 'en',
      verificationStatus: (u.customer?.verificationStatus ??
        'NOT_VERIFIED') as AdminCustomerRow['verificationStatus'],
      isSuspended: !u.isActive,
      createdAt: u.createdAt.toISOString(),
    };
  }
}
