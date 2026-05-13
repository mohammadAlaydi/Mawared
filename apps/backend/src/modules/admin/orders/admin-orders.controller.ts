import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { Audit } from '@/common/decorators/audit.decorator';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { AuditInterceptor } from '@/common/interceptors/audit.interceptor';
import { AdminOrdersService } from './admin-orders.service';
import { ListAdminOrdersDto, ListAdminOrdersSchema } from './dto/list-admin-orders.dto';
import {
  AdminTransitionOrderDto,
  AdminTransitionOrderSchema,
} from './dto/transition-order.dto';
import { RefundOrderDto, RefundOrderSchema } from './dto/refund-order.dto';

@ApiTags('admin-orders')
@ApiBearerAuth()
@Roles('STAFF', 'BRANCH_MANAGER', 'SUPER_ADMIN')
@UseInterceptors(AuditInterceptor)
@Controller({ path: 'admin/orders', version: '1' })
export class AdminOrdersController {
  constructor(private readonly orders: AdminOrdersService) {}

  @Get()
  list(
    @CurrentUser() actor: AuthUser,
    @Query(new ZodValidationPipe(ListAdminOrdersSchema)) q: ListAdminOrdersDto,
  ) {
    return this.orders.list(q, actor);
  }

  @Get(':id')
  findOne(
    @CurrentUser() actor: AuthUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.orders.findOne(id, actor);
  }

  @Post(':id/transition')
  @Audit({ action: 'order.transition', entityType: 'Order' })
  transition(
    @CurrentUser() actor: AuthUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ZodValidationPipe(AdminTransitionOrderSchema)) body: AdminTransitionOrderDto,
  ) {
    return this.orders.transition(id, body, actor);
  }

  @Post(':id/refund')
  @Audit({ action: 'order.refund', entityType: 'Order' })
  refund(
    @CurrentUser() actor: AuthUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ZodValidationPipe(RefundOrderSchema)) body: RefundOrderDto,
  ) {
    return this.orders.refund(id, body, actor);
  }
}
