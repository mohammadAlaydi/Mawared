import { Module } from '@nestjs/common';
import { AuthModule } from '@/modules/auth/auth.module';
import { OrdersModule } from '@/modules/orders/orders.module';
import { PaymentsModule } from '@/modules/payments/payments.module';
import { AdminAuthService } from './auth/admin-auth.service';
import { AdminAuthController } from './auth/admin-auth.controller';
import { AdminOrdersService } from './orders/admin-orders.service';
import { AdminOrdersController } from './orders/admin-orders.controller';
import { AdminWorkersService } from './workers/admin-workers.service';
import { AdminWorkersController } from './workers/admin-workers.controller';
import { AdminCustomersService } from './customers/admin-customers.service';
import { AdminCustomersController } from './customers/admin-customers.controller';
import { AdminPromosService } from './promos/admin-promos.service';
import { AdminPromosController } from './promos/admin-promos.controller';
import { AdminAuditController } from './audit/admin-audit.controller';

@Module({
  imports: [AuthModule, OrdersModule, PaymentsModule],
  controllers: [
    AdminAuthController,
    AdminOrdersController,
    AdminWorkersController,
    AdminCustomersController,
    AdminPromosController,
    AdminAuditController,
  ],
  providers: [
    AdminAuthService,
    AdminOrdersService,
    AdminWorkersService,
    AdminCustomersService,
    AdminPromosService,
  ],
})
export class AdminModule {}
