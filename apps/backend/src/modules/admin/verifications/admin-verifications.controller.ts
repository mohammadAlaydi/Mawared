import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { CurrentUser, type AuthUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { Audit } from '@/common/decorators/audit.decorator';
import { AuditInterceptor } from '@/common/interceptors/audit.interceptor';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { VerificationsService } from '@/modules/verifications/verifications.service';

const ManualOverrideSchema = z
  .object({
    status: z.enum(['VERIFIED', 'FAILED', 'NOT_VERIFIED']),
    reason: z.string().trim().max(400).optional(),
  })
  .strict();

@ApiTags('admin-verifications')
@ApiBearerAuth()
@Roles('STAFF', 'BRANCH_MANAGER', 'SUPER_ADMIN', 'SUPPORT', 'SALES')
@UseInterceptors(AuditInterceptor)
@Controller({ path: 'admin/customers', version: '1' })
export class AdminVerificationsController {
  constructor(
    private readonly verifications: VerificationsService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Returns the customer's verification history + current status. Used by
   * the admin dashboard's "Signit verification management" module (§9).
   */
  @Get(':id/verification')
  async history(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { userId: id },
      select: {
        verificationStatus: true,
        verificationLastCheckedAt: true,
        verificationExpiresAt: true,
        verifications: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    return customer ?? { verifications: [] };
  }

  /**
   * Staff manual override — flip a customer to VERIFIED / FAILED /
   * NOT_VERIFIED with a reason. Audit-logged. Only super-admin can flip
   * back to VERIFIED without Signit; everyone else can only mark FAILED
   * or NOT_VERIFIED.
   */
  @Post(':id/verification/override')
  @HttpCode(200)
  @Roles('STAFF', 'BRANCH_MANAGER', 'SUPER_ADMIN')
  @Audit({ action: 'customer.verification.override', entityType: 'Customer' })
  async override(
    @CurrentUser() actor: AuthUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ZodValidationPipe(ManualOverrideSchema))
    body: z.infer<typeof ManualOverrideSchema>,
  ) {
    if (body.status === 'VERIFIED' && actor.role !== 'SUPER_ADMIN') {
      throw new Error('Only SUPER_ADMIN can manually mark a customer VERIFIED.');
    }
    await this.verifications.manualOverride(id, body.status, actor.id, body.reason);
    return { status: body.status };
  }
}
