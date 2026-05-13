import { Module } from '@nestjs/common';
import { OrdersModule } from '@/modules/orders/orders.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { StubPaymentProvider } from './stub-payment.provider';
import { PAYMENT_PROVIDER } from './payment-provider';

/**
 * PaymentsModule. For M2 we ship the StubPaymentProvider — Stripe lands
 * once STRIPE_SECRET_KEY is provisioned. Swap is a single line:
 *
 *   { provide: PAYMENT_PROVIDER, useClass: StripeProvider }
 */
@Module({
  imports: [OrdersModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    StubPaymentProvider,
    { provide: PAYMENT_PROVIDER, useExisting: StubPaymentProvider },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
