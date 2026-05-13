import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Inject,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser, type AuthUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { PaymentsService } from './payments.service';
import {
  CreatePaymentIntentDto,
  CreatePaymentIntentSchema,
} from './dto/create-payment-intent.dto';
import { PAYMENT_PROVIDER, type PaymentProvider } from './payment-provider';

@ApiTags('payments')
@Controller({ path: 'payments', version: '1' })
export class PaymentsController {
  constructor(
    private readonly payments: PaymentsService,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
  ) {}

  @ApiBearerAuth()
  @Post('intents')
  @HttpCode(201)
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
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    if (!rawBody || typeof signature !== 'string') {
      throw new BadRequestException('missing raw body or signature header');
    }
    const event = this.provider.verifyWebhook(rawBody, signature);
    await this.payments.ingestWebhook(event.providerEventId, event.type, event.payload);
    return { received: true };
  }
}
