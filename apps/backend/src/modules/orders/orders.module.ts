import { Module } from '@nestjs/common';
import { OffersModule } from '@/modules/offers/offers.module';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { ContractsModule } from '@/modules/contracts/contracts.module';
import { VerificationsModule } from '@/modules/verifications/verifications.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { ReservationExpiryConsumer } from './reservation-expiry.consumer';

@Module({
  imports: [OffersModule, NotificationsModule, ContractsModule, VerificationsModule],
  controllers: [OrdersController],
  providers: [OrdersService, ReservationExpiryConsumer],
  exports: [OrdersService],
})
export class OrdersModule {}
