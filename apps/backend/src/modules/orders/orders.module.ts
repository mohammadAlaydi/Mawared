import { Module } from '@nestjs/common';
import { OffersModule } from '@/modules/offers/offers.module';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { ContractsModule } from '@/modules/contracts/contracts.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { ReservationExpiryConsumer } from './reservation-expiry.consumer';

@Module({
  imports: [OffersModule, NotificationsModule, ContractsModule],
  controllers: [OrdersController],
  providers: [OrdersService, ReservationExpiryConsumer],
  exports: [OrdersService],
})
export class OrdersModule {}
