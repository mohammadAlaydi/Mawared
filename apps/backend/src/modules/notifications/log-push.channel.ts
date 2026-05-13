import { Injectable, Logger } from '@nestjs/common';
import type { PushChannel, PushSendInput } from './push-channel';

/**
 * Dev push channel — prints payloads to logs instead of calling FCM.
 * Active until FCM_SERVICE_ACCOUNT_JSON is provided.
 */
@Injectable()
export class LogPushChannel implements PushChannel {
  private readonly logger = new Logger(LogPushChannel.name);

  async send(input: PushSendInput): Promise<{ sent: number; invalidTokens: string[] }> {
    this.logger.warn(
      { event: 'push.send.log_only', input },
      `[DEV PUSH] user=${input.userId} tokens=${input.tokens.length} title="${input.titleAr}"`,
    );
    return { sent: input.tokens.length, invalidTokens: [] };
  }
}
