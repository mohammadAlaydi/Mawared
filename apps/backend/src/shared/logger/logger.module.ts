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
              'req.headers.authorization',
              'req.headers.cookie',
              'req.headers["x-api-key"]',
              'req.headers["stripe-signature"]',
              'req.body.password',
              'req.body.otp',
              'req.body.code',
              'req.body.refreshToken',
              'req.body.phoneNumber',
              'res.headers["set-cookie"]',
              '*.password',
              '*.otp',
              '*.refreshToken',
              '*.accessToken',
              '*.token',
              '*.cardNumber',
              '*.cvc',
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
