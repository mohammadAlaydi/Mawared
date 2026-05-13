import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from './shared/config/config.module';
import { LoggerModule } from './shared/logger/logger.module';
import { PrismaModule } from './shared/prisma/prisma.module';
import { RedisModule } from './shared/redis/redis.module';
import { SmsModule } from './shared/sms/sms.module';
import { QueueModule } from './shared/queue/queue.module';
import { AuditModule } from './shared/audit/audit.service';
import { FeatureFlagsModule } from './shared/feature-flags/feature-flags.service';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WorkersModule } from './modules/workers/workers.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { BranchesModule } from './modules/branches/branches.module';
import { NationalitiesModule } from './modules/nationalities/nationalities.module';
import { OffersModule } from './modules/offers/offers.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { FilesModule } from './modules/files/files.module';
import { LeadsModule } from './modules/leads/leads.module';
import { VerificationsModule } from './modules/verifications/verifications.module';
import { PublicModule } from './modules/public/public.module';
import { AdminModule } from './modules/admin/admin.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { RequestContextInterceptor } from './common/interceptors/request-context.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    PrismaModule,
    RedisModule,
    SmsModule,
    QueueModule,
    AuditModule,
    FeatureFlagsModule,
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: 120 },
      { name: 'auth', ttl: 60_000, limit: 10 },
    ]),
    HealthModule,
    AuthModule,
    UsersModule,
    WorkersModule,
    CatalogModule,
    BranchesModule,
    NationalitiesModule,
    OffersModule,
    OrdersModule,
    PaymentsModule,
    NotificationsModule,
    ContractsModule,
    FilesModule,
    LeadsModule,
    VerificationsModule,
    PublicModule,
    AdminModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: RequestContextInterceptor },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
