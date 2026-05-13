import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Inject,
  Post,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser, type AuthUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { IdempotencyInterceptor } from '@/common/idempotency/idempotency.interceptor';
import { Idempotent } from '@/common/idempotency/idempotent.decorator';
import { PaymentsService } from './payments.service';
import {
  CreatePaymentIntentDto,
  CreatePaymentIntentSchema,
} from './dto/create-payment-intent.dto';
import { PAYMENT_PROVIDER, type PaymentProvider } from './payment-provider';

@ApiTags('payments')
@Controller({ path: 'payments', version: '1' })
@UseInterceptors(IdempotencyInterceptor)
export class PaymentsController {
  constructor(
    private readonly payments: PaymentsService,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
  ) {}

  /**
   * Create a Stripe PaymentIntent for an order. Idempotent: clients must pass
   * a UUIDv4 `Idempotency-Key` header so a retried request returns the same
   * intent instead of double-charging the customer.
   */
  @ApiBearerAuth()
  @Post('intents')
  @HttpCode(201)
  @Idempotent()
  async createIntent(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(CreatePaymentIntentSchema)) body: CreatePaymentIntentDto,
  ) {
    return this.payments.createIntentForOrder(user.id, body.orderId);
  }

  /**
   * Stripe webhook ingest. Verified against the signature header, then
   * persisted and ACK'd fast. We need the raw body — see main.ts which
   * registers `express.raw()` for this path.
   */
  @Public()
  @Post('webhooks/stripe')
  @HttpCode(200)
  async stripeWebhook(@Req() req: Request): Promise<{ received: true }> {
    const signature = req.headers['stripe-signature'];
