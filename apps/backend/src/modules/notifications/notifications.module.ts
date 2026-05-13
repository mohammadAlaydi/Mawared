import { Logger, Module, type Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { DeviceTokensService } from './device-tokens.service';
import { LogPushChannel } from './log-push.channel';
import { FcmPushChannel } from './fcm-push.channel';
import { NotificationFanoutConsumer } from './notification-fanout.consumer';
import { PUSH_CHANNEL, type PushChannel } from './push-channel';
import type { Env } from '@/shared/config/env.schema';

/**
 * Selects the push channel based on env. If FCM_SERVICE_ACCOUNT_JSON is
 * set, uses FCM; otherwise falls back to LogPushChannel (dev).
 */
const pushChannelFactory: Provider = {
  provide: PUSH_CHANNEL,
  inject: [ConfigService, LogPushChannel],
  useFactory: (
    config: ConfigService<Env, true>,
    log: LogPushChannel,
  ): PushChannel => {
    const logger = new Logger('NotificationsModule');
    const raw = config.get('FCM_SERVICE_ACCOUNT_JSON', { infer: true });
    if (raw) {
      try {
        const fcm = new FcmPushChannel(config);
        logger.log('Push channel: FCM');
        return fcm;
      } catch (err) {
        logger.error({ err }, 'failed to init FCM — falling back to log channel');
      }
    }
    logger.warn('Push channel: log-only (set FCM_SERVICE_ACCOUNT_JSON to enable FCM)');
    return log;
  },
};

@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    DeviceTokensService,
    LogPushChannel,
    NotificationFanoutConsumer,
    pushChannelFactory,
  ],
  exports: [NotificationsService, DeviceTokensService],
})
export class NotificationsModule {}
