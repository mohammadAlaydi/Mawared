import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { ReportsService } from './reports.service';
import { ReportsQueryDto, ReportsQuerySchema } from './dto/reports-query.dto';

@ApiTags('admin-reports')
@ApiBearerAuth()
@Roles('STAFF', 'BRANCH_MANAGER', 'SUPER_ADMIN')
@Controller({ path: 'admin/reports', version: '1' })
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('revenue')
  revenue(
    @CurrentUser() actor: AuthUser,
    @Query(new ZodValidationPipe(ReportsQuerySchema)) q: ReportsQueryDto,
  ) {
    return this.reports.revenue(q, actor);
  }

  @Get('orders')
  ordersByStatus(
    @CurrentUser() actor: AuthUser,
    @Query(new ZodValidationPipe(ReportsQuerySchema)) q: ReportsQueryDto,
  ) {
    return this.reports.ordersByStatus(q, actor);
  }

  @Get('refunds')
  refunds(
    @CurrentUser() actor: AuthUser,
    @Query(new ZodValidationPipe(ReportsQuerySchema)) q: ReportsQueryDto,
  ) {
    return this.reports.refunds(q, actor);
  }
}
