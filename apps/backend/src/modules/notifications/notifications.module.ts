import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { DeviceTokensService } from './device-tokens.service';
import { LogPushChannel } from './log-push.channel';
import { PUSH_CHANNEL } from './push-channel';

@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    DeviceTokensService,
    LogPushChannel,
    { provide: PUSH_CHANNEL, useExisting: LogPushChannel },
  ],
  exports: [NotificationsService, DeviceTokensService],
})
export class NotificationsModule {}
