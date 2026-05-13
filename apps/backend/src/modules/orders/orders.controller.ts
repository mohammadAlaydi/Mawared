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
import { CurrentUser, type AuthUser } from '@/common/decorators/current-user.decorator';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { IdempotencyInterceptor } from '@/common/idempotency/idempotency.interceptor';
import { Idempotent } from '@/common/idempotency/idempotent.decorator';
import { OrdersService } from './orders.service';
import { CreateOrderDto, CreateOrderSchema } from './dto/create-order.dto';
import { CancelOrderDto, CancelOrderSchema } from './dto/cancel-order.dto';

@ApiTags('orders')
@ApiBearerAuth()
@Controller({ path: 'orders', version: '1' })
@UseInterceptors(IdempotencyInterceptor)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  @Idempotent()
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(CreateOrderSchema)) body: CreateOrderDto,
  ) {
    return this.orders.create(user.id, body);
  }

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.orders.listForCustomer(user.id);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.orders.findOneForCustomer(user.id, id);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  async cancel(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ZodValidationPipe(CancelOrderSchema)) body: CancelOrderDto,
  ) {
    // Ownership check: throws 404 if the order doesn't belong to this user.
    await this.orders.findOneForCustomer(user.id, id);
    const result = await this.orders.transition(
      id,
      { type: 'cancel', actor: 'customer', reason: body.reason },
      { type: 'CUSTOMER', id: user.id, note: body.note },
    );
    return result;
  }
}
