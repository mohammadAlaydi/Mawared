import { Module } from '@nestjs/common';
import { AuthModule } from '@/modules/auth/auth.module';
import { OrdersModule } from '@/modules/orders/orders.module';
import { PaymentsModule } from '@/modules/payments/payments.module';
import { VerificationsModule } from '@/modules/verifications/verifications.module';
import { AdminAuthService } from './auth/admin-auth.service';
import { AdminAuthController } from './auth/admin-auth.controller';
import { AdminTotpController } from './auth/totp.controller';
import { AdminOrdersService } from './orders/admin-orders.service';
import { AdminOrdersController } from './orders/admin-orders.controller';
import { AdminWorkersService } from './workers/admin-workers.service';
import { AdminWorkersController } from './workers/admin-workers.controller';
import { AdminCustomersService } from './customers/admin-customers.service';
import { AdminCustomersController } from './customers/admin-customers.controller';
import { AdminPromosService } from './promos/admin-promos.service';
import { AdminPromosController } from './promos/admin-promos.controller';
import { AdminStaffService } from './staff/admin-staff.service';
import { AdminStaffController } from './staff/admin-staff.controller';
import { AdminAuditController } from './audit/admin-audit.controller';
import { ReportsService } from './reports/reports.service';
import { ReportsController } from './reports/reports.controller';
import { AdminFlagsController } from './flags/admin-flags.controller';
import { AdminVerificationsController } from './verifications/admin-verifications.controller';
import { AdminCatalogService } from './catalog/admin-catalog.service';
import { AdminCatalogController } from './catalog/admin-catalog.controller';
import { AdminPaymentsController } from './payments/admin-payments.controller';

@Module({
  imports: [AuthModule, OrdersModule, PaymentsModule, VerificationsModule],
  controllers: [
    AdminAuthController,
    AdminTotpController,
    AdminOrdersController,
    AdminWorkersController,
    AdminCustomersController,
    AdminPromosController,
    AdminStaffController,
    AdminAuditController,
    ReportsController,
    AdminFlagsController,
    AdminVerificationsController,
    AdminCatalogController,
    AdminPaymentsController,
  ],
  providers: [
    AdminAuthService,
    AdminOrdersService,
    AdminWorkersService,
    AdminCustomersService,
    AdminPromosService,
    AdminStaffService,
    ReportsService,
    AdminCatalogService,
  ],
})
export class AdminModule {}
