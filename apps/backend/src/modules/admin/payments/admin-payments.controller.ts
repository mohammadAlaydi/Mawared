import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { CurrentUser, type AuthUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { CursorPaginationSchema, buildPage } from '@/common/pagination';

const ListPaymentsSchema = CursorPaginationSchema.extend({
  status: z
    .enum([
      'REQUIRES_PAYMENT_METHOD',
      'REQUIRES_CONFIRMATION',
      'REQUIRES_ACTION',
      'PROCESSING',
      'SUCCEEDED',
      'CANCELED',
      'FAILED',
    ])
    .optional(),
  orderId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
}).strict();

const ListRefundsSchema = CursorPaginationSchema.extend({
  status: z.enum(['PENDING', 'SUCCEEDED', 'FAILED', 'CANCELED']).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
}).strict();

@ApiTags('admin-payments')
@ApiBearerAuth()
@Roles('STAFF', 'BRANCH_MANAGER', 'SUPER_ADMIN', 'FINANCE')
@Controller({ path: 'admin/payments', version: '1' })
export class AdminPaymentsController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cursor-paginated list of PaymentIntent rows. Branch managers see only
   * orders in their branch.
   */
  @Get()
  async listIntents(
    @CurrentUser() actor: AuthUser,
    @Query(new ZodValidationPipe(ListPaymentsSchema))
    q: z.infer<typeof ListPaymentsSchema>,
  ) {
    const rows = await this.prisma.paymentIntent.findMany({
      where: {
        ...(q.status && { status: q.status }),
        ...(q.orderId && { orderId: q.orderId }),
        ...((q.from || q.to) && {
          createdAt: {
            ...(q.from && { gte: q.from }),
            ...(q.to && { lte: q.to }),
          },
        }),
        ...(actor.role === 'BRANCH_MANAGER' &&
          actor.branchId && {
            order: { branchId: actor.branchId },
          }),
      },
      take: q.limit + 1,
      ...(q.cursor && { cursor: { id: q.cursor }, skip: 1 }),
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            customerId: true,
            branchId: true,
            status: true,
          },
        },
      },
    });
    return buildPage(rows, q.limit);
  }

  @Get(':id')
  async findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.prisma.paymentIntent.findUniqueOrThrow({
      where: { id },
      include: {
        order: true,
      },
    });
  }

  @Get('refunds')
  async listRefunds(
    @CurrentUser() actor: AuthUser,
    @Query(new ZodValidationPipe(ListRefundsSchema))
    q: z.infer<typeof ListRefundsSchema>,
  ) {
    const rows = await this.prisma.refund.findMany({
      where: {
        ...(q.status && { status: q.status }),
        ...((q.from || q.to) && {
          createdAt: {
            ...(q.from && { gte: q.from }),
            ...(q.to && { lte: q.to }),
          },
        }),
        ...(actor.role === 'BRANCH_MANAGER' &&
          actor.branchId && {
            order: { branchId: actor.branchId },
          }),
      },
      take: q.limit + 1,
      ...(q.cursor && { cursor: { id: q.cursor }, skip: 1 }),
      orderBy: { createdAt: 'desc' },
      include: {
        order: { select: { id: true, orderNumber: true, customerId: true, branchId: true } },
      },
    });
    return buildPage(rows, q.limit);
  }
}
