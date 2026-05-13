import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { RedisModule } from '@/shared/redis/redis.module';
import { SmsModule } from '@/shared/sms/sms.module';
import { AuthController } from './auth.controller';
import { OtpService } from './otp.service';
import { TokenService } from './token.service';
import { SessionService } from './session.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { getJwtSignOptions } from './jwt-config';
import type { Env } from '@/shared/config/env.schema';

@Module({
  imports: [
    RedisModule,
    SmsModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => {
        const opts = getJwtSignOptions(config);
        return {
          secret: opts.secret,
          signOptions: { algorithm: opts.algorithm },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [OtpService, TokenService, SessionService, JwtStrategy],
  exports: [TokenService, SessionService],
})
export class AuthModule {}
