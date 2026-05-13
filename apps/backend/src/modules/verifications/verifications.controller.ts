import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import type { Request } from 'express';
import { CurrentUser, type AuthUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { VerificationsService } from './verifications.service';

const StartVerificationSchema = z
  .object({ locale: z.enum(['ar', 'en']).default('ar') })
  .strict();

@ApiTags('verifications')
@Controller({ version: '1' })
export class VerificationsController {
  constructor(private readonly verifications: VerificationsService) {}

  /** Customer reads their current verification state. */
  @ApiBearerAuth()
  @Get('me/verification')
  status(@CurrentUser() user: AuthUser) {
    return this.verifications.getStatus(user.id);
  }

  /** Customer initiates a Signit session. Response includes the redirect URL. */
  @ApiBearerAuth()
  @Post('me/verification/start')
  @HttpCode(200)
  start(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(StartVerificationSchema))
    body: z.infer<typeof StartVerificationSchema>,
  ) {
    return this.verifications.start(user.id, body.locale);
  }

  /**
   * Signit webhook. Public endpoint (signed via HMAC-SHA-256 — we verify
   * the header in the provider). Raw body is preserved by the carve-out
   * in main.ts.
   */
  @Public()
  @Post('verifications/webhooks/signit')
  @HttpCode(200)
  async webhook(@Req() req: Request): Promise<{ received: true }> {
    const sig = req.headers['x-signit-signature'];
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    if (!rawBody || typeof sig !== 'string') {
      throw new BadRequestException('missing raw body or signature header');
    }
    await this.verifications.ingestWebhook(rawBody, sig);
    return { received: true };
  }
}
