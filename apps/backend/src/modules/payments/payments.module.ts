import { Logger, Module, type Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrdersModule } from '@/modules/orders/orders.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { StubPaymentProvider } from './stub-payment.provider';
import { StripePaymentProvider } from './stripe-payment.provider';
import { PAYMENT_PROVIDER, type PaymentProvider } from './payment-provider';
import type { Env } from '@/shared/config/env.schema';

/**
 * Selects the payment provider based on env. If STRIPE_SECRET_KEY + the
 * webhook secret are both set, uses Stripe; otherwise falls back to the
 * deterministic stub (dev / test).
 */
const paymentProviderFactory: Provider = {
  provide: PAYMENT_PROVIDER,
  inject: [ConfigService, StubPaymentProvider, StripePaymentProvider],
  useFactory: (
    config: ConfigService<Env, true>,
    stub: StubPaymentProvider,
    stripe: StripePaymentProvider,
  ): PaymentProvider => {
    const logger = new Logger('PaymentsModule');
    const hasStripe = !!(
      config.get('STRIPE_SECRET_KEY', { infer: true }) &&
      config.get('STRIPE_WEBHOOK_SECRET', { infer: true })
    );
    if (hasStripe) {
      logger.log('Payment provider: Stripe');
      return stripe;
    }
    logger.warn('Payment provider: stub (set STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET to enable Stripe)');
    return stub;
  },
};

@Module({
  imports: [OrdersModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, StubPaymentProvider, StripePaymentProvider, paymentProviderFactory],
  exports: [PaymentsService, PAYMENT_PROVIDER],
})
export class PaymentsModule {}
