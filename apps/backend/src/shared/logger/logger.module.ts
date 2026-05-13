import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import type { Env } from '../config/env.schema';

/**
 * Global Pino logger. Each HTTP request gets a child logger keyed by
 * `requestId`. PII (auth headers, OTPs, JWTs, phone numbers, card data)
 * is redacted at the logger level — see the `redact.paths` list below.
 */
@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        pinoHttp: {
          level: config.get('LOG_LEVEL', { infer: true }),
          genReqId: (req, res) => {
            const incoming =
              (req.headers['x-request-id'] as string | undefined) ?? randomUUID();
            res.setHeader('x-request-id', incoming);
            return incoming;
          },
          autoLogging: { ignore: (req) => req.url === '/healthz' || req.url === '/readyz' },
          customLogLevel: (_req, res, err) => {
            if (err) return 'error';
            if (res.statusCode >= 500) return 'error';
            if (res.statusCode >= 400) return 'warn';
            return 'info';
          },
          redact: {
            paths: [
              // Request headers
              'req.headers.authorization',
              'req.headers.cookie',
              'req.headers["x-api-key"]',
              'req.headers["stripe-signature"]',
              'req.headers["i-twilio-idempotency-token"]',
              // Request body
              'req.body.password',
              'req.body.otp',
              'req.body.code',
              'req.body.totp',
              'req.body.refreshToken',
              'req.body.phone',
              'req.body.phoneE164',
              'req.body.phoneNumber',
              'req.body.email',
              'req.body.token',
              // Response headers
              'res.headers["set-cookie"]',
              // Wildcards — catch nested fields we may add later
              '*.password',
              '*.passwordHash',
              '*.otp',
              '*.totp',
              '*.totpSecret',
              '*.refreshToken',
              '*.accessToken',
              '*.token',
              '*.clientSecret',
              '*.stripeClientSecret',
              '*.jwt',
              '*.privateKey',
              '*.cardNumber',
              '*.cvc',
              '*.cvv',
              // Service-account / Stripe / Twilio creds
              '*.STRIPE_SECRET_KEY',
              '*.STRIPE_WEBHOOK_SECRET',
              '*.TWILIO_AUTH_TOKEN',
              '*.S3_SECRET_ACCESS_KEY',
              '*.FCM_SERVICE_ACCOUNT_JSON',
              '*.JWT_PRIVATE_KEY',
            ],
            censor: '[REDACTED]',
          },
          transport:
            config.get('NODE_ENV', { infer: true }) === 'development'
              ? {
                  target: 'pino-pretty',
                  options: {
                    singleLine: true,
                    translateTime: 'SYS:HH:MM:ss.l',
                    ignore: 'pid,hostname,context',
                  },
                }
              : undefined,
        },
      }),
    }),
  ],
})
export class LoggerModule {}
