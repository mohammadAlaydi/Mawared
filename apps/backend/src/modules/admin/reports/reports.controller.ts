import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { ReportsService } from './reports.service';
import { ReportsQueryDto, ReportsQuerySchema } from './dto/reports-query.dto';
import { OverviewQueryDto, OverviewQuerySchema } from './dto/overview-query.dto';

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

  /**
   * Single-call rollup for the admin dashboard homepage. Combines yesterday's
   * revenue (with day-before delta), 30-day revenue series, order counts by
   * status, worker availability counts, new customer count, and the 10 most
   * recent orders.
   */
  @Get('overview')
  overview(
    @CurrentUser() actor: AuthUser,
    @Query(new ZodValidationPipe(OverviewQuerySchema)) q: OverviewQueryDto,
  ) {
    return this.reports.overview(actor, q.branchId);
  }

  /**
   * Worker fleet breakdown: counts by availability status and by nationality.
   */
  @Get('active-workers')
  activeWorkers(
    @CurrentUser() actor: AuthUser,
    @Query(new ZodValidationPipe(OverviewQuerySchema)) q: OverviewQueryDto,
  ) {
    return this.reports.activeWorkers(actor, q.branchId);
  }
}
